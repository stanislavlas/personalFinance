package personalFinance.dataStore

import aws.sdk.kotlin.services.dynamodb.DynamoDbClient
import aws.sdk.kotlin.services.dynamodb.model.AttributeValue
import aws.sdk.kotlin.services.dynamodb.model.GetItemRequest
import aws.sdk.kotlin.services.dynamodb.model.PutItemRequest
import aws.sdk.kotlin.services.dynamodb.model.QueryRequest
import aws.smithy.kotlin.runtime.net.url.Url
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import personalFinance.models.Transaction
import personalFinance.models.User
import java.time.LocalDate
import java.util.*

private const val USER_TABLE_NAME = "users"
private const val TRANSACTION_TABLE_NAME = "transactions"

private const val USERS_SECONDARY_INDEX_NAME = "emailIndex"

private const val DATA_ATTRIBUTE = "data"
private const val USER_ID_ATTRIBUTE = "userId"
private const val EMAIL_ATTRIBUTE = "email"
private const val DATE_ATTRIBUTE = "dateOfTransaction"

@Component
class DynamoClient(
    @Value("\${aws.region}") val awsRegion: String,
    @Value("\${aws.url}") val url: String,
    private val objectMapper: ObjectMapper,
): IDataStoreClient {
    private val dynamoClient = DynamoDbClient {
        region = awsRegion
        endpointUrl = Url.parse(url)
    }

    override suspend fun getUserByEmail(email: String): User? {
        val queryRequest = QueryRequest {
            tableName = USER_TABLE_NAME
            indexName = USERS_SECONDARY_INDEX_NAME
            keyConditionExpression = "$EMAIL_ATTRIBUTE = :$USERS_SECONDARY_INDEX_NAME"
            this.expressionAttributeValues = mapOf(
                ":$USERS_SECONDARY_INDEX_NAME" to AttributeValue.S(email),
            )
        }

        val items = dynamoClient.query(queryRequest).items
        if (items.isNullOrEmpty()) {
            return null
        }

        val data = items.first()[DATA_ATTRIBUTE]?.asS() ?: throw Exception("User with email: $email contains incorrect data")
        return objectMapper.readValue(data)
    }

    override suspend fun getUserById(userId: UUID): User {
        val request = GetItemRequest {
            tableName = USER_TABLE_NAME
            key = mapOf(USER_ID_ATTRIBUTE to AttributeValue.S(userId.toString()))
        }

        val item = dynamoClient.getItem(request).item

        if (item.isNullOrEmpty()) {
            throw Exception("User with id: $userId does not exists")
        }

        val data = item[DATA_ATTRIBUTE]?.asS() ?: throw Exception("User with id: $userId contains incorrect data")
        return objectMapper.readValue(data)
    }

    override suspend fun putUser(user: User) {
        val request = PutItemRequest {
            tableName = USER_TABLE_NAME
            item = mapOf(
                USER_ID_ATTRIBUTE to AttributeValue.S(user.userId.toString()),
                EMAIL_ATTRIBUTE to AttributeValue.S(user.email),
                DATA_ATTRIBUTE to AttributeValue.S(objectMapper.writeValueAsString(user))
            )
        }

        dynamoClient.putItem(request)
    }

    override suspend fun getTransactions(userId: UUID, fromDate: LocalDate, toDate: LocalDate): List<Transaction> {
        val queryRequest = QueryRequest {
            tableName = TRANSACTION_TABLE_NAME
            keyConditionExpression = "$USER_ID_ATTRIBUTE = :userId AND $DATE_ATTRIBUTE BETWEEN :fromDate AND :toDate"
            this.expressionAttributeValues = mapOf(
                ":userId" to AttributeValue.S(userId.toString()),
                ":fromDate" to AttributeValue.S(fromDate.toString()),
                ":toDate" to AttributeValue.S(toDate.toString()),
            )
        }

        val items = dynamoClient.query(queryRequest).items
        if (items.isNullOrEmpty()) {
            return emptyList()
        }

        val transactions = mutableListOf<Transaction>()
        items.forEach { item ->
            val data = item[DATA_ATTRIBUTE]?.asS()?.let {
                objectMapper.readValue<List<Transaction>>(it)
            } ?: emptyList()

            transactions.addAll(data)
        }

        return transactions
    }

    override suspend fun putTransactions(userId: UUID, date: LocalDate, transactions: List<Transaction>) {
        val request = PutItemRequest {
            tableName = TRANSACTION_TABLE_NAME
            item = mapOf(
                USER_ID_ATTRIBUTE to AttributeValue.S(userId.toString()),
                DATE_ATTRIBUTE to AttributeValue.S(date.toString()),
                DATA_ATTRIBUTE to AttributeValue.S(objectMapper.writeValueAsString(transactions))
            )
        }

        dynamoClient.putItem(request)
    }
}