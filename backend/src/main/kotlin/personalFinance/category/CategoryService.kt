package personalFinance.category

import org.springframework.stereotype.Service
import personalFinance.dataStore.CategoryRepository
import personalFinance.models.TransactionType
import personalFinance.models.internal.Category
import java.util.*

@Service
class CategoryService(
    private val categoryRepository: CategoryRepository
) {
    suspend fun getCategories(userId: UUID, householdId: UUID?): List<Category> {
        val userCategories = categoryRepository.findByUserId(userId)

        val householdCategories = if (householdId != null) {
            categoryRepository.findByHouseholdId(householdId)
        } else {
            emptyList()
        }

        return userCategories + householdCategories
    }

    suspend fun createCategory(
        userId: UUID,
        householdId: UUID?,
        name: String,
        emoji: String,
        color: String,
        type: TransactionType
    ): Category {
        val category = Category(
            categoryId = UUID.randomUUID(),
            userId = if (householdId == null) userId else null,
            householdId = householdId,
            name = name,
            emoji = emoji,
            color = color,
            type = type,
            isDefault = false
        )

        categoryRepository.save(category)
        return category
    }

    suspend fun updateCategory(
        categoryId: UUID,
        userId: UUID,
        name: String?,
        emoji: String?,
        color: String?
    ): Category {
        val existing = categoryRepository.findById(categoryId)
            ?: throw Exception("Category not found")

        // Verify ownership
        if (existing.userId != userId) {
            throw Exception("Not authorized to update this category")
        }

        val updated = existing.copy(
            name = name ?: existing.name,
            emoji = emoji ?: existing.emoji,
            color = color ?: existing.color
        )

        categoryRepository.save(updated)
        return updated
    }

    suspend fun deleteCategory(categoryId: UUID, userId: UUID) {
        val category = categoryRepository.findById(categoryId)
            ?: throw Exception("Category not found")

        // Verify ownership
        if (category.userId != userId) {
            throw Exception("Not authorized to delete this category")
        }

        // Don't allow deleting default categories
        if (category.isDefault) {
            throw Exception("Cannot delete default category")
        }

        // TODO: Check if category is used in any entries
        // For now, just delete
        categoryRepository.delete(categoryId)
    }

    suspend fun seedDefaultCategories(userId: UUID) {
        // Check if user already has categories
        val existing = categoryRepository.findByUserId(userId)
        if (existing.isNotEmpty()) {
            return
        }

        // Seed default income categories (8)
        val incomeCategories = listOf(
            Triple("Salary", "💼", "#1D9E75"),
            Triple("Meal Vouchers", "🍽️", "#5DCAA5"),
            Triple("Flexi Pass", "💳", "#9FE1CB"),
            Triple("Trading", "📈", "#378ADD"),
            Triple("Independence", "🏦", "#185FA5"),
            Triple("Income", "💰", "#0C447C"),
            Triple("Invested", "🪙", "#63B3ED"),
            Triple("Saved", "🐖", "#9FE1CB")
        )

        incomeCategories.forEach { (name, emoji, color) ->
            categoryRepository.save(
                Category(
                    categoryId = UUID.randomUUID(),
                    userId = userId,
                    householdId = null,
                    name = name,
                    emoji = emoji,
                    color = color,
                    type = TransactionType.INCOME,
                    isDefault = true
                )
            )
        }

        // Seed default expense categories (18)
        val expenseCategories = listOf(
            Triple("Rent", "🏠", "#D85A30"),
            Triple("Energy", "🔥", "#EF9F27"),
            Triple("Electricity", "⚡", "#FAC775"),
            Triple("Internet", "🌐", "#7F77DD"),
            Triple("Phone", "📱", "#534AB7"),
            Triple("Insurance", "🛡️", "#888780"),
            Triple("Groceries", "🛒", "#D4537E"),
            Triple("Household", "🏡", "#993556"),
            Triple("Transport", "🚗", "#BA7517"),
            Triple("Clothing", "👕", "#F0997B"),
            Triple("Multisport", "🏋️", "#5DCAA5"),
            Triple("Subscription", "📺", "#AFA9EC"),
            Triple("Dining Out", "🍕", "#D85A30"),
            Triple("Alza", "🖥️", "#185FA5"),
            Triple("Entertainment", "🎉", "#7F77DD"),
            Triple("Essentials", "🧴", "#B4B2A9"),
            Triple("Other Expenses", "📦", "#888780"),
            Triple("Other", "❓", "#D3D1C7")
        )

        expenseCategories.forEach { (name, emoji, color) ->
            categoryRepository.save(
                Category(
                    categoryId = UUID.randomUUID(),
                    userId = userId,
                    householdId = null,
                    name = name,
                    emoji = emoji,
                    color = color,
                    type = TransactionType.EXPENSE,
                    isDefault = true
                )
            )
        }
    }
}
