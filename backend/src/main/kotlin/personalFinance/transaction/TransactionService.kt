package personalFinance.transaction

import org.springframework.stereotype.Service
import personalFinance.dataStore.DynamoClient
import personalFinance.models.Transaction
import java.util.*

@Service
class TransactionService(
    private val dynamoClient: DynamoClient,
) {

    fun addTransaction(
        userId: UUID,
        transaction: Transaction,
    ) {
        println("Transaction with $userId saved")
    }

    fun addTransactions(
        userId: UUID,
        transactions: List<Transaction>,
    ) {
        println("Transactions with $userId saved")
    }

    fun getTransactionsForUser(userId: UUID): String {
        return "bigTransaction"
    }
}