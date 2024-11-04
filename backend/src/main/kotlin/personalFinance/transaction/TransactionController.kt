package personalFinance.transaction

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import personalFinance.auth.JwtAuth
import personalFinance.common.getJWT
import personalFinance.models.Amount
import personalFinance.models.TransactionType
import java.time.LocalDate
import java.util.*

@RestController
@RequestMapping("/api/transaction")
class TransactionController(
    private val jwtAuth: JwtAuth,
    private val transactionService: TransactionService,
) {

    @PostMapping("/add")
    fun addTransaction(
        @RequestHeader("Authorization") authHeader: String,
        @RequestBody transaction: Transaction,
    ): ResponseEntity<String> {
        val jwt = authHeader.getJWT()

        transactionService.addTransaction(
            userId = jwtAuth.getUserIdFromJWT(jwt),
            transaction = transaction.toModel(),
        )

        return ResponseEntity.status(200).body("Transaction Added")
    }

    @PostMapping("/addBatch")
    fun addTransactions(
        @RequestHeader("Authorization") authHeader: String,
        @RequestBody transactions: List<Transaction>,
    ): ResponseEntity<String> {
        val jwt = authHeader.getJWT()

        transactionService.addTransactions(
            userId = jwtAuth.getUserIdFromJWT(jwt),
            transactions = transactions.map { it.toModel() },
        )

        return ResponseEntity.status(200).body("Transaction Added")
    }

    @GetMapping("/get")
    fun getTransaction(@PathVariable userId: UUID): ResponseEntity<String> {
        val transaction = transactionService.getTransactionsForUser(userId = userId)

        return ResponseEntity.status(200).body("Transaction for $userId: $transaction")
    }
}

//data class TransactionsPerMonth(
//    val date: String,
//    val transactions: List<Transaction>,
//) {
//    fun toModel(): personalFinance.models.TransactionsPerMonth {
//        val currency = this.transactions.firstOrNull()?.amount?.currency ?: Currency.CZK
//        val incomeAmount = Amount(
//            value = 0.0.toBigDecimal(),
//            currency = currency,
//        )
//        val expensesAmount = Amount(
//            value = 0.0.toBigDecimal(),
//            currency = currency,
//        )
//        val investmentAmount = Amount(
//            value = 0.0.toBigDecimal(),
//            currency = currency,
//        )
//
//        val transactions = this.transactions.map { transaction ->
//            when(transaction.type) {
//                TransactionType.INCOME -> incomeAmount.plus(transaction.amount.value)
//                TransactionType.EXPENSES -> expensesAmount.plus(transaction.amount.value)
//                TransactionType.INVESTMENT -> investmentAmount.plus(transaction.amount.value)
//            }
//
//            return@map transaction.toModel()
//        }
//
//        return personalFinance.models.TransactionsPerMonth(
//            date = this.date,
//            incomeAmount = incomeAmount,
//            expensesAmount = expensesAmount,
//            investmentAmount = investmentAmount,
//            transactions = transactions,
//        )
//    }
//}

data class Transaction(
    val amount: Amount,
    val date: LocalDate,
    val note: String,
    val type: TransactionType,
) {

    fun toModel() = personalFinance.models.Transaction(
        amount = this.amount,
        date = this.date,
        note = this.note,
        type = this.type,
    )
}