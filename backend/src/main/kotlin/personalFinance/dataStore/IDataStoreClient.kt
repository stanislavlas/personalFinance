package personalFinance.dataStore

import personalFinance.models.internal.User
import java.util.*

interface IDataStoreClient {
    suspend fun putUser(user: User)
    suspend fun getUserByEmail(email: String): User?
    suspend fun getUserById(userId: UUID): User
}
