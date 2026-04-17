package personalFinance.category

import kotlinx.coroutines.runBlocking
import org.springframework.web.bind.annotation.*
import personalFinance.auth.JwtAuth
import personalFinance.common.GetJWTFromAuthHeader
import personalFinance.models.TransactionType
import personalFinance.models.internal.Category
import java.util.*

@RestController
@RequestMapping("/api/categories")
class CategoryController(
    private val categoryService: CategoryService,
    private val jwtAuth: JwtAuth
) {
    @GetMapping
    fun getCategories(
        @RequestHeader("Authorization") authorization: String,
        @RequestParam(required = false) householdId: String?
    ): List<Category> {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        val householdUUID = householdId?.let { UUID.fromString(it) }

        return runBlocking {
            // Seed default categories on first access
            categoryService.seedDefaultCategories(userId)
            categoryService.getCategories(userId, householdUUID)
        }
    }

    @PostMapping
    fun createCategory(
        @RequestHeader("Authorization") authorization: String,
        @RequestBody request: CreateCategoryRequest
    ): Category {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        val householdUUID = request.householdId?.let { UUID.fromString(it) }

        return runBlocking {
            categoryService.createCategory(
                userId = userId,
                householdId = householdUUID,
                name = request.name,
                emoji = request.emoji,
                color = request.color,
                type = request.type
            )
        }
    }

    @PutMapping("/{id}")
    fun updateCategory(
        @RequestHeader("Authorization") authorization: String,
        @PathVariable id: String,
        @RequestBody request: UpdateCategoryRequest
    ): Category {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        return runBlocking {
            categoryService.updateCategory(
                categoryId = UUID.fromString(id),
                userId = userId,
                name = request.name,
                emoji = request.emoji,
                color = request.color
            )
        }
    }

    @DeleteMapping("/{id}")
    fun deleteCategory(
        @RequestHeader("Authorization") authorization: String,
        @PathVariable id: String
    ): Map<String, Boolean> {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        runBlocking {
            categoryService.deleteCategory(
                categoryId = UUID.fromString(id),
                userId = userId
            )
        }

        return mapOf("success" to true)
    }
}

data class CreateCategoryRequest(
    val name: String,
    val emoji: String,
    val color: String,
    val type: TransactionType,
    val householdId: String?
)

data class UpdateCategoryRequest(
    val name: String?,
    val emoji: String?,
    val color: String?
)
