package personalFinance.transaction

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import personalFinance.auth.JwtAuth
import personalFinance.common.getJWT
import personalFinance.models.Amount
import personalFinance.models.Category
import personalFinance.models.TransactionType
import java.time.LocalDate

@RestController
@RequestMapping("/api/transaction")
class TransactionController(
    private val jwtAuth: JwtAuth,
    private val transactionService: TransactionService,
) {

    @PostMapping("/add")
    fun addTransactions(
        @RequestHeader("Authorization") authHeader: String,
        @RequestBody transactions: List<Transaction>,
    ): ResponseEntity<String> {
        val jwt = authHeader.getJWT()

        transactionService.addTransactions(
            userId = jwtAuth.getUserIdFromJWT(jwt),
            transactions = transactions.map { it.toModel() },
        )

        return ResponseEntity.status(204).body("Transaction Added")
    }

    @GetMapping("/get")
    fun getTransaction(
        @RequestHeader("Authorization") authHeader: String,
        @RequestBody transactionRequest: TransactionRequest,
    ): List<personalFinance.models.Transaction> {
        val jwt = authHeader.getJWT()

        val test = transactionService.getTransactionsForUser(
            userId = jwtAuth.getUserIdFromJWT(jwt),
            fromDate = transactionRequest.fromDate,
            toDate = transactionRequest.toDate,
        )

        return test
    }
}

data class Transaction(
    val amount: Amount,
    val category: Category,
    val date: LocalDate,
    val note: String,
    val type: TransactionType,
) {

    fun toModel() = personalFinance.models.Transaction(
        amount = this.amount,
        category = this.category,
        date = this.date,
        note = this.note,
        type = this.type,
    )
}

data class TransactionRequest(
    val fromDate: LocalDate,
    val toDate: LocalDate
)