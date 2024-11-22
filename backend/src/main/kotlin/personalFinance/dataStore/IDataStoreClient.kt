package personalFinance.dataStore

import personalFinance.models.internal.Transaction
import personalFinance.models.internal.User
import java.time.LocalDate
import java.util.*

interface IDataStoreClient {
    suspend fun putUser(user: User)
    suspend fun getUserByEmail(email: String): User?
    suspend fun getUserById(userId: UUID): User
    suspend fun getTransactions(userId: UUID, fromDate: LocalDate, toDate: LocalDate): List<Transaction>
    suspend fun putTransactions(userId: UUID, date: LocalDate, transactions: List<Transaction>)
}