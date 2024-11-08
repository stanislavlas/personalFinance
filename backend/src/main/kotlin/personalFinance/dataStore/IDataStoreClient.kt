package personalFinance.dataStore

import personalFinance.models.Transaction
import personalFinance.models.User
import java.time.LocalDate
import java.util.*

interface IDataStoreClient {
    suspend fun putUser(user: User)
    suspend fun getUserByEmail(email: String): User?
    suspend fun getUserById(userId: UUID): User
    suspend fun getTransactions(userId: UUID, date: LocalDate): List<Transaction>
    suspend fun putTransaction(user: User, transaction: Transaction)
    suspend fun putTransactions(user: User, transactions: List<Transaction>)
}