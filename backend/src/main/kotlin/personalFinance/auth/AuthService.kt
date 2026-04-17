package personalFinance.auth

import kotlinx.coroutines.runBlocking
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import personalFinance.dataStore.IDataStoreClient
import personalFinance.models.Currency
import personalFinance.models.api.AuthUserResponse
import personalFinance.models.internal.User
import java.util.UUID

@Service
class AuthService(
    private val jwtAuth: JwtAuth,
    private val dataStore: IDataStoreClient,
    private val passwordEncoder: PasswordEncoder,
    private val refreshTokenService: RefreshTokenService,
) {
    fun getUserWithJwt(email: String, password: String): AuthUserResponse {
        val user = runBlocking { dataStore.getUserByEmail(email = email) }
            ?: throw Exception("User with email $email does not exist")

        val isPasswordMatch = verifyPassword(
            rawPassword = password,
            encodedPassword = user.password,
        )

        if (!isPasswordMatch) {
            throw Exception("Incorrect credentials")
        }

        // Generate both access and refresh tokens
        val accessToken = jwtAuth.generateJWT(user.userId)
        val refreshToken = runBlocking { refreshTokenService.generateRefreshToken(user.userId) }

        return AuthUserResponse(
            accessToken = accessToken,
            refreshToken = refreshToken,
            user = user.toApi(),
        )
    }

    fun createUser(
        currency: Currency,
        email: String,
        name: String,
        password: String,
    ): AuthUserResponse {
        val user = runBlocking { dataStore.getUserByEmail(email = email) }

        if (user != null) {
            throw Exception("User with email $email already exists")
        }

        val newUser = User(
            userId = UUID.randomUUID(),
            currency = currency,
            email = email,
            name = name,
            password = passwordEncoder.encode(password),
        )

        runBlocking { dataStore.putUser(user = newUser) }

        // Generate tokens for newly created user
        val accessToken = jwtAuth.generateJWT(newUser.userId)
        val refreshToken = runBlocking { refreshTokenService.generateRefreshToken(newUser.userId) }

        return AuthUserResponse(
            accessToken = accessToken,
            refreshToken = refreshToken,
            user = newUser.toApi(),
        )
    }

    suspend fun refreshAccessToken(refreshToken: String): Pair<String, String>? {
        val storedToken = refreshTokenService.validateAndRotate(refreshToken) ?: return null

        // Generate new access token
        val newAccessToken = jwtAuth.generateJWT(storedToken.userId)

        // Generate new refresh token (token rotation)
        val newRefreshToken = refreshTokenService.generateRefreshToken(storedToken.userId)

        // Revoke old refresh token
        refreshTokenService.revokeToken(refreshToken)

        return Pair(newAccessToken, newRefreshToken)
    }

    suspend fun logout(refreshToken: String) {
        refreshTokenService.revokeToken(refreshToken)
    }

    suspend fun deleteUserAccount(userId: UUID, password: String) {
        val user = dataStore.getUserById(userId)

        val isPasswordMatch = verifyPassword(
            rawPassword = password,
            encodedPassword = user.password,
        )

        if (!isPasswordMatch) {
            throw Exception("Incorrect password")
        }

        // Revoke all refresh tokens
        refreshTokenService.revokeAllUserTokens(userId)

        // TODO: Delete user data (entries, categories, etc.)
        // For now, we'll just revoke tokens
    }

    private fun verifyPassword(rawPassword: String, encodedPassword: String) =
        passwordEncoder.matches(rawPassword, encodedPassword)
}