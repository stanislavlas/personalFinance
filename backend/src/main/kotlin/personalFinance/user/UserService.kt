package personalFinance.user

import kotlinx.coroutines.runBlocking
import org.springframework.stereotype.Service
import personalFinance.dataStore.IDataStoreClient
import personalFinance.models.User
import java.util.*

@Service
class UserService(
    private val dataStoreClient: IDataStoreClient,
) {

    fun getUser(userId: UUID): User {
        return runBlocking { dataStoreClient.getUserById(userId = userId) }
    }
}