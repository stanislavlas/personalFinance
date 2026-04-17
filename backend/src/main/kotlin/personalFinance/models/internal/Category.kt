package personalFinance.models.internal

import personalFinance.models.TransactionType
import java.time.Instant
import java.util.*

data class Category(
    val categoryId: UUID,
    val userId: UUID?,
    val householdId: UUID?,
    val name: String,
    val emoji: String,
    val color: String,
    val type: TransactionType,
    val isDefault: Boolean = false,
    val createdAt: Instant = Instant.now()
)
