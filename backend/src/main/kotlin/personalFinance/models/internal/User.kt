package personalFinance.models.internal

import personalFinance.models.Currency
import java.util.UUID

data class User(
    val currency: Currency,
    val email: String,
    val name: String,
    val password: String,
    val userId: UUID,
)