package personalFinance.models

import java.math.BigDecimal
import java.time.LocalDate

data class Transaction(
    val amount: Amount,
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

enum class Category(val value: String){
    FOOD_VOUCHERS("Food Vouchers"),
    FREE_TIME_VOUCHERS("Free Time Vouchers"),
    SALARY("Salary"),


    CLOTHING("Clothing"),
    EATING_OUT("Eating out"),
    ELECTRICITY("Electricity"),
    ENTERTAINMENT("Entertainment"),
    GROCERIES("Groceries"),
    GYM("Gym"),
    HOUSEHOLD("HOUSEHOLD"),
    INTERNET("INTERNET"),
    OTHER("OTHER"),
    PHONE("PHONE"),
    RENT("RENT"),
    TECHNOLOGY("TECHNOLOGY"),
    TRANSPORT("TRANSPORT"),
}

enum class TransactionType{
    EXPENSES,
    INCOME,
    INVESTMENT,
}