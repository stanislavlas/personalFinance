package personalFinance.models.internal

import personalFinance.models.Amount
import personalFinance.models.Category
import personalFinance.models.TransactionType
import personalFinance.models.api.GetTransactionsResponse
import personalFinance.models.api.PutTransactionsRequest
import java.time.LocalDate

data class Transaction(
    val amount: Amount,
    val category: Category,
    val date: LocalDate,
    val note: String,
    val type: TransactionType,
) {
    fun toAPI() = GetTransactionsResponse.Transaction(
        amount = this.amount,
        category = this.category,
        date = this.date,
        note = this.note,
        type = this.type,
    )
}

data class TransactionsOverview(
    val fromDate: LocalDate,
    val toDate: LocalDate,
    val incomes: Transactions,
    val expenses: Transactions,
    val investments: Transactions,
    val savedAmount: Amount,
) {
    data class Transactions(
        val amount: Amount,
        val transactions: List<Transaction>,
    ) {
        fun toAPI() = GetTransactionsResponse.Transactions(
            amount = this.amount,
            transactions = this.transactions.map { it.toAPI() }
        )
    }

    fun toAPI() = GetTransactionsResponse(
        fromDate = this.fromDate,
        toDate = this.toDate,
        incomes = this.incomes.toAPI(),
        expenses = this.expenses.toAPI(),
        investments = this.investments.toAPI(),
        savedAmount = this.savedAmount,
    )
}