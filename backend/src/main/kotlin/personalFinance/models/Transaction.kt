package personalFinance.models

import java.math.BigDecimal
import java.time.LocalDate

data class Transaction(
    val amount: Amount,
    val category: Category,
    val date: LocalDate,
    val note: String,
    val type: TransactionType,
)

data class Amount(
    val value: BigDecimal,
    val currency: Currency,
) {
    fun plus(value: BigDecimal) = this.value.plus(value)
}

enum class Category{
    FOOD_VOUCHERS,
    FREE_TIME_VOUCHERS,
    SALARY,


    CLOTHING,
    EATING_OUT,
    ELECTRICITY,
    ENTERTAINMENT,
    GROCERIES,
    GYM,
    HOUSEHOLD,
    INTERNET,
    OTHER,
    PHONE,
    RENT,
    TECHNOLOGY,
    TRANSPORT,
}

enum class TransactionType{
    EXPENSES,
    INCOME,
    INVESTMENT,
}