package personalFinance.transaction

import kotlinx.coroutines.runBlocking
import org.springframework.stereotype.Service
import personalFinance.dataStore.DynamoClient
import personalFinance.models.Transaction
import java.time.LocalDate
import java.util.*

@Service
class TransactionService(
    private val dynamoClient: DynamoClient,
) {
    fun addTransactions(
        userId: UUID,
        transactions: List<Transaction>,
    ) {
        val dateToTransactionsMap = mutableMapOf<LocalDate, MutableList<Transaction>>()

        transactions.forEach { transaction ->
            dateToTransactionsMap.getOrPut(transaction.date) { mutableListOf() }.add(transaction)
        }

        dateToTransactionsMap.forEach { (date, transactions) ->
            runBlocking {
                dynamoClient.putTransactions(
                    userId = userId,
                    date = date,
                    transactions = dynamoClient.getTransactions(userId, date, date) + transactions,
                )
            }
        }
        println("Transactions with $userId saved")
    }

    fun getTransactionsForUser(userId: UUID, fromDate: LocalDate, toDate: LocalDate): List<Transaction> {
        return runBlocking {
            dynamoClient.getTransactions(
                userId = userId,
                fromDate = fromDate,
                toDate = toDate,
            )
        }
    }
}