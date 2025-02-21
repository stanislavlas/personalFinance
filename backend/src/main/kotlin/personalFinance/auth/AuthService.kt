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

        return AuthUserResponse(
            jwt = jwtAuth.generateJWT(user.userId),
            user = user.toApi(),
            success = true,
        )
    }

    fun createUser(
        currency: Currency,
        email: String,
        name: String,
        password: String,
    ) {
        val user = runBlocking { dataStore.getUserByEmail(email = email) }

        if (user != null) {
            throw Exception("User with email $email already exists")
        }

        runBlocking {
            dataStore.putUser(
                user = User(
                    userId = UUID.randomUUID(),
                    currency = currency,
                    email = email,
                    name = name,
                    password = passwordEncoder.encode(password),
                )
            )
        }
    }

    private fun verifyPassword(rawPassword: String, encodedPassword: String) =
        passwordEncoder.matches(rawPassword, encodedPassword)
}