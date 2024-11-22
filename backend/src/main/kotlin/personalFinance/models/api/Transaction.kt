package personalFinance.models.api

import com.fasterxml.jackson.annotation.JsonProperty
import personalFinance.models.Amount
import personalFinance.models.Category
import personalFinance.models.TransactionType
import personalFinance.models.internal.Transaction
import personalFinance.models.internal.TransactionsOverview.Transactions
import java.time.LocalDate

// PutTransactions
data class PutTransactionsRequest(
    @JsonProperty("transactions")
    val transactions: List<Transaction>,
) {
    data class Transaction(
        val amount: Amount,
        val category: Category,
        val date: LocalDate,
        val note: String,
        val type: TransactionType,
    ) {
        fun toInternal() = personalFinance.models.internal.Transaction(
            amount = this.amount,
            category = this.category,
            date = this.date,
            note = this.note,
            type = this.type,
        )
    }
}


// GetTransactions
data class GetTransactionsRequest(
    val fromDate: LocalDate,
    val toDate: LocalDate
)

data class GetTransactionsResponse(
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
    )

    data class Transaction(
        val amount: Amount,
        val category: Category,
        val date: LocalDate,
        val note: String,
        val type: TransactionType,
    )
}