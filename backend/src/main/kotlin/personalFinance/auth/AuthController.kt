package personalFinance.auth

import kotlinx.coroutines.runBlocking
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.web.bind.annotation.*
import personalFinance.common.GetJWTFromAuthHeader
import personalFinance.models.Currency
import personalFinance.models.api.AuthUserResponse

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
    private val authenticationManager: AuthenticationManager,
    private val jwtAuth: JwtAuth,
) {
    @PostMapping("/login")
    fun loginAndGetJwt(@RequestBody authRequest: AuthRequest): AuthUserResponse {
        return authService.getUserWithJwt(
            email = authRequest.email,
            password = authRequest.password,
        )
    }

    @PostMapping("/create")
    fun createAndGetJwt(@RequestBody createRequest: CreateRequest): AuthUserResponse {
        return authService.createUser(
            currency = createRequest.currency,
            email = createRequest.email,
            name = createRequest.name,
            password = createRequest.password,
        )
    }

    @PostMapping("/refresh")
    fun refreshToken(@RequestBody refreshRequest: RefreshRequest): RefreshResponse {
        val tokens = runBlocking {
            authService.refreshAccessToken(refreshRequest.refreshToken)
        } ?: throw Exception("Invalid or expired refresh token")

        return RefreshResponse(
            accessToken = tokens.first,
            refreshToken = tokens.second
        )
    }

    @PostMapping("/logout")
    fun logout(@RequestBody logoutRequest: LogoutRequest): Map<String, Boolean> {
        runBlocking {
            authService.logout(logoutRequest.refreshToken)
        }
        return mapOf("success" to true)
    }

    @DeleteMapping("/account")
    fun deleteAccount(
        @RequestHeader("Authorization") authorization: String,
        @RequestBody deleteRequest: DeleteAccountRequest
    ): Map<String, Boolean> {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        runBlocking {
            authService.deleteUserAccount(userId, deleteRequest.password)
        }

        return mapOf("success" to true)
    }
}

data class AuthRequest(
    val email: String,
    val password: String,
)

data class CreateRequest(
    val currency: Currency,
    val email: String,
    val name: String,
    val password: String,
)

data class RefreshRequest(
    val refreshToken: String,
)

data class RefreshResponse(
    val accessToken: String,
    val refreshToken: String,
)

data class LogoutRequest(
    val refreshToken: String,
)

data class DeleteAccountRequest(
    val password: String,
)