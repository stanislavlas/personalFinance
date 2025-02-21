package personalFinance.models.internal

import personalFinance.models.Currency
import personalFinance.models.api.User
import java.util.UUID

data class User(
    val currency: Currency,
    val email: String,
    val name: String,
    val password: String,
    val userId: UUID,
) {
    fun toApi() = User(
        currency = this.currency,
        email = this.email,
        name = this.name,
        userId = this.userId,
    )
}