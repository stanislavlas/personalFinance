package personalFinance.user

import kotlinx.coroutines.runBlocking
import org.springframework.stereotype.Service
import personalFinance.currency.CurrencyConversionService
import personalFinance.dataStore.IDataStoreClient
import personalFinance.models.internal.User
import java.util.*

@Service
class UserService(
    private val dataStoreClient: IDataStoreClient,
    private val currencyConversionService: CurrencyConversionService,
) {

    fun getUser(userId: UUID): User {
        return runBlocking { dataStoreClient.getUserById(userId = userId) }
    }

    fun updateUser(userId: UUID, name: String?, currency: String?): User {
        if (currency != null && !currencyConversionService.isValidCurrency(currency)) {
            throw IllegalArgumentException("Unknown currency code: $currency")
        }
        return runBlocking { dataStoreClient.updateUser(userId, name, currency) }
    }
}
