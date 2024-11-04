package personalFinance.models

import com.fasterxml.jackson.annotation.JsonEnumDefaultValue

enum class Currency{
    CZK,
    EUR,
    USD,

    @JsonEnumDefaultValue
    UNSUPPORTED,
}
