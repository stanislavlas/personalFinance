package personalFinance.entry

import kotlinx.coroutines.runBlocking
import org.springframework.web.bind.annotation.*
import personalFinance.auth.JwtAuth
import personalFinance.common.GetJWTFromAuthHeader
import personalFinance.models.Amount
import personalFinance.models.TransactionType
import personalFinance.models.internal.Entry
import personalFinance.models.internal.Necessity
import java.time.LocalDate
import java.util.*

@RestController
@RequestMapping("/api/entries")
class EntryController(
    private val entryService: EntryService,
    private val jwtAuth: JwtAuth
) {
    @GetMapping
    fun getEntries(
        @RequestHeader("Authorization") authorization: String,
        @RequestParam(required = false) yearMonth: String?,
        @RequestParam(required = false) householdId: String?
    ): List<Entry> {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        val householdUUID = householdId?.let { UUID.fromString(it) }

        // Parse yearMonth (YYYY-MM) to date range
        val (fromDate, toDate) = if (yearMonth != null) {
            val parts = yearMonth.split("-")
            val year = parts[0].toInt()
            val month = parts[1].toInt()
            val from = LocalDate.of(year, month, 1)
            val to = from.plusMonths(1).minusDays(1)
            Pair(from, to)
        } else {
            Pair(null, null)
        }

        return runBlocking {
            entryService.getEntries(
                userId = userId,
                householdId = householdUUID,
                fromDate = fromDate,
                toDate = toDate
            )
        }
    }

    @PostMapping
    fun createEntry(
        @RequestHeader("Authorization") authorization: String,
        @RequestBody request: CreateEntryRequest
    ): Entry {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        val householdUUID = request.householdId?.let { UUID.fromString(it) }

        return runBlocking {
            entryService.createEntry(
                userId = userId,
                householdId = householdUUID,
                amount = request.amount,
                categoryId = UUID.fromString(request.categoryId),
                date = LocalDate.parse(request.date),
                name = request.name,
                note = request.note ?: "",
                type = request.type,
                necessity = request.necessity
            )
        }
    }

    @PutMapping("/{id}")
    fun updateEntry(
        @RequestHeader("Authorization") authorization: String,
        @PathVariable id: String,
        @RequestBody request: UpdateEntryRequest
    ): Entry {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        val categoryUUID = request.categoryId?.let { UUID.fromString(it) }
        val dateLocal = request.date?.let { LocalDate.parse(it) }

        return runBlocking {
            entryService.updateEntry(
                entryId = UUID.fromString(id),
                userId = userId,
                amount = request.amount,
                categoryId = categoryUUID,
                date = dateLocal,
                name = request.name,
                note = request.note,
                necessity = request.necessity
            )
        }
    }

    @DeleteMapping("/{id}")
    fun deleteEntry(
        @RequestHeader("Authorization") authorization: String,
        @PathVariable id: String
    ): Map<String, Boolean> {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        runBlocking {
            entryService.deleteEntry(
                entryId = UUID.fromString(id),
                userId = userId
            )
        }

        return mapOf("success" to true)
    }
}

data class CreateEntryRequest(
    val householdId: String?,
    val amount: Amount,
    val categoryId: String,
    val date: String,
    val name: String,
    val note: String?,
    val type: TransactionType,
    val necessity: Necessity
)

data class UpdateEntryRequest(
    val amount: Amount?,
    val categoryId: String?,
    val date: String?,
    val name: String?,
    val note: String?,
    val necessity: Necessity?
)
