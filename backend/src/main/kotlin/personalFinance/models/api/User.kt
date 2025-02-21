package personalFinance.models.api

import personalFinance.models.Currency
import java.util.*

data class AuthUserResponse(
    val jwt: String,
    val success: Boolean,
    val user: User,
)

data class User(
    val currency: Currency,
    val email: String,
    val name: String,
    val userId: UUID,
)