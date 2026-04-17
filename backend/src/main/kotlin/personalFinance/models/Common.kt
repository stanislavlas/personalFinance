package personalFinance.models

import com.fasterxml.jackson.annotation.JsonEnumDefaultValue
import java.math.BigDecimal

data class Amount(
    val value: BigDecimal,
    val currency: Currency,
) {
    operator fun plus(amount: Amount): Amount {
        return Amount(
            currency = this.currency,
            value = this.value + amount.value,
        )
    }

    operator fun minus(amount: Amount): Amount {
        return Amount(
            currency = this.currency,
            value = this.value - amount.value,
        )
    }
}

enum class TransactionType{
    EXPENSE,
    INCOME,
    INVESTMENT,

    @JsonEnumDefaultValue
    UNSUPPORTED,
}

enum class Currency{
    CZK,
    EUR,
    USD,

    @JsonEnumDefaultValue
    UNSUPPORTED,
}
