package personalFinance.models.api

import com.fasterxml.jackson.annotation.JsonProperty
import personalFinance.models.Amount
import personalFinance.models.Category
import personalFinance.models.TransactionType
import personalFinance.models.internal.Transaction
import java.time.LocalDate
import java.util.*

// PutTransactions
data class PutTransactionsRequest(
    @JsonProperty("transactions")
    val transactions: List<Transaction>,
) {
    data class Transaction(
        val amount: Amount,
        val category: Category,
        val date: LocalDate,
        val name: String,
        val note: String,
        val type: TransactionType,
    ) {
        fun toInternal() = Transaction(
            id = UUID.randomUUID(),
            amount = this.amount,
            category = this.category,
            date = this.date,
            name = this.name,
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
        val id: UUID,
        val amount: Amount,
        val category: Category,
        val date: LocalDate,
        val name: String,
        val note: String,
        val type: TransactionType,
    )
}