package personalFinance.transaction

import kotlinx.coroutines.runBlocking
import org.springframework.stereotype.Service
import personalFinance.dataStore.DynamoClient
import personalFinance.models.Amount
import personalFinance.models.Currency
import personalFinance.models.TransactionType
import personalFinance.models.internal.Transaction
import personalFinance.models.internal.TransactionsOverview
import java.math.BigDecimal
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

    fun getTransactionsOverview(userId: UUID, fromDate: LocalDate, toDate: LocalDate): TransactionsOverview {
        val transactions = runBlocking {
            dynamoClient.getTransactions(
                userId = userId,
                fromDate = fromDate,
                toDate = toDate,
            )
        }

        val incomes = mutableListOf<Transaction>()
        val expenses = mutableListOf<Transaction>()
        val investments = mutableListOf<Transaction>()

        transactions.forEach { transaction ->
            when(transaction.type) {
                TransactionType.INCOME -> incomes.add(transaction)
                TransactionType.EXPENSE -> expenses.add(transaction)
                TransactionType.INVESTMENT -> investments.add(transaction)
                else -> throw Exception("Unsupported transaction type: ${transaction.type}")
            }
        }

        val incomeAmount = incomes.sumAmount()
        val expensesAmount = expenses.sumAmount()
        val investmentsAmount = investments.sumAmount()

        return TransactionsOverview(
            fromDate = fromDate,
            toDate = toDate,
            incomes = TransactionsOverview.Transactions(
                amount = incomeAmount,
                transactions = incomes,
            ),
            expenses = TransactionsOverview.Transactions(
                amount = expensesAmount,
                transactions = expenses,
            ),
            investments = TransactionsOverview.Transactions(
                amount = investmentsAmount,
                transactions = investments,
            ),
            savedAmount = incomeAmount - (expensesAmount + investmentsAmount),
        )
    }

    private fun List<Transaction>.sumAmount() = Amount(
        currency = this.firstOrNull()?.amount?.currency ?: Currency.CZK,
        value = this.fold(BigDecimal.ZERO) { acc, amount -> acc + amount.amount.value }
    )
}