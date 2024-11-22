package personalFinance.transaction

import org.springframework.web.bind.annotation.*
import personalFinance.auth.JwtAuth
import personalFinance.common.getJWT
import personalFinance.models.api.GetTransactionsRequest
import personalFinance.models.api.GetTransactionsResponse
import personalFinance.models.api.PutTransactionsRequest

@RestController
@RequestMapping("/api/transaction")
class TransactionController(
    private val jwtAuth: JwtAuth,
    private val transactionService: TransactionService,
) {

    @PostMapping("/add")
    fun addTransactions(
        @RequestHeader("Authorization") authHeader: String,
        @RequestBody request: PutTransactionsRequest,
    ): List<personalFinance.models.internal.Transaction> {
        val jwt = authHeader.getJWT()

        val transactionsModel = request.transactions.map { it.toInternal() }

        transactionService.addTransactions(
            userId = jwtAuth.getUserIdFromJWT(jwt),
            transactions = transactionsModel,
        )

        return transactionsModel
    }

    @GetMapping("/get")
    fun getTransaction(
        @RequestHeader("Authorization") authHeader: String,
        @RequestBody request: GetTransactionsRequest,
    ): GetTransactionsResponse {
        val jwt = authHeader.getJWT()

        val transactionsOverview = transactionService.getTransactionsOverview(
            userId = jwtAuth.getUserIdFromJWT(jwt),
            fromDate = request.fromDate,
            toDate = request.toDate,
        )

        return transactionsOverview.toAPI()
    }
}
