package personalFinance.auth

import org.springframework.security.authentication.AuthenticationManager
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import personalFinance.models.Currency

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
    private val authenticationManager: AuthenticationManager,
) {
    @PostMapping("/login")
    fun loginAndGetJwt(@RequestBody authRequest: AuthRequest): AuthResponse {
        val jwt = authService.getJwtForUser(
            email = authRequest.email,
            password = authRequest.password,
        )

        return AuthResponse(jwt)
    }

    @PostMapping("/create")
    fun createAndGetJwt(@RequestBody createRequest: CreateRequest) {
        authService.createUser(
            currency = createRequest.currency,
            email = createRequest.email,
            name = createRequest.name,
            password = createRequest.password,
        )
    }

}

data class AuthRequest(
    val email: String,
    val password: String,
)

data class AuthResponse(
    val jwt: String,
)

data class CreateRequest(
    val currency: Currency,
    val email: String,
    val name: String,
    val password: String,
)