package personalFinance.dataStore

import aws.sdk.kotlin.services.dynamodb.DynamoDbClient
import aws.sdk.kotlin.services.dynamodb.model.AttributeValue
import aws.sdk.kotlin.services.dynamodb.model.GetItemRequest
import aws.sdk.kotlin.services.dynamodb.model.PutItemRequest
import aws.sdk.kotlin.services.dynamodb.model.QueryRequest
import aws.smithy.kotlin.runtime.net.url.Url
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import personalFinance.models.Transaction
import personalFinance.models.User
import java.time.LocalDate
import java.time.ZoneId
import java.util.*

private const val USER_TABLE_NAME = "users"
private const val TRANSACTION_TABLE_NAME = "transactions"

@Component
class DynamoClient(
    @Value("\${aws.region}") val awsRegion: String,
    @Value("\${aws.url}") val url: String,
): IDataStoreClient {
    private val dynamoClient = DynamoDbClient {
        region = awsRegion
        endpointUrl = Url.parse(url)
    }

    private val objectMapper = jacksonObjectMapper()

    override suspend fun getUserByEmail(email: String): User? {
        val emailKey = "email"
        val emailIndexName = "emailIndex"

        val queryRequest = QueryRequest {
            tableName = USER_TABLE_NAME
            indexName = emailIndexName
            keyConditionExpression = "$emailKey = :$emailIndexName"
            this.expressionAttributeValues = mapOf(
                ":$emailIndexName" to AttributeValue.S(email),
            )
        }

        val queryResponse = dynamoClient.query(queryRequest)

        val items = queryResponse.items

        if (items.isNullOrEmpty()) {
            return null
        }

        val data = items.first()["data"]?.asS()
            ?: throw Exception("User with email: $email contains incorrect data")

        return objectMapper.readValue(data)
    }

    override suspend fun getUserById(userId: UUID): User {
        val userKey = mapOf(
            "userId" to AttributeValue.S(userId.toString())
        )

        val request = GetItemRequest {
            tableName = USER_TABLE_NAME
            key = userKey
        }

        val response = dynamoClient.getItem(request)

        if (!response.item.isNullOrEmpty()) {
            throw Exception("User with id: $userId does not exists")
        }

        val data = response.item?.get("data")
            ?: throw Exception("User with id: $userId contains incorrect data")

        return objectMapper.readValue(data.toString())
    }

    override suspend fun putUser(user: User) {
        val userString = objectMapper.writeValueAsString(user)
        val itemValues = mapOf(
            "userId" to AttributeValue.S(user.userId.toString()),
            "email" to AttributeValue.S(user.email),
            "data" to AttributeValue.S(userString)
        )

        val request = PutItemRequest {
            tableName = USER_TABLE_NAME
            item = itemValues
        }

        dynamoClient.putItem(request)
    }

    override suspend fun getTransactions(userId: UUID, date: LocalDate): List<Transaction> {
        val epochTime = date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
        val userKey = mapOf(
            "userId" to AttributeValue.S(userId.toString()),
            "date" to AttributeValue.N(epochTime.toString())
        )

        val request = GetItemRequest {
            tableName = TRANSACTION_TABLE_NAME
            key = userKey
        }

        val response = dynamoClient.getItem(request)

        if (response.item.isNullOrEmpty()) {
            return emptyList()
        }

        val data = response.item?.get("data") ?: ""

        return objectMapper.readValue(data.toString())
    }

    override suspend fun putTransaction(user: User, transaction: Transaction) {
        val transactionString = objectMapper.writeValueAsString(transaction)

        val epochDate = transaction.date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
        val itemValues = mapOf(
            "userId" to AttributeValue.S(user.userId.toString()),
            "date" to AttributeValue.N(epochDate.toString()),
            "data" to AttributeValue.S(transactionString)
        )

        val request = PutItemRequest {
            tableName = TRANSACTION_TABLE_NAME
            item = itemValues
        }

        dynamoClient.putItem(request)
    }

    override suspend fun putTransactions(user: User, transactions: List<Transaction>) {
//        val requestItems = transactions.map { transaction ->
//
//            val transactionString = objectMapper.writeValueAsString(transaction)
//            val epochDate = transaction.date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
//
//            val itemValues = mapOf(
//                "userId" to AttributeValue.builder().s(user.userId.toString()).build(),
//                "date" to AttributeValue.builder().n(epochDate.toString()).build(),
//                "data" to AttributeValue.builder().s(transactionString).build()
//            )
//
//            putRequest.withItem(itemValues)
//            WriteRequest().withPutRequest(putRequest)
//        }
//
//
//
//        val writeRequests = transactions.map {
//            WriteRequest(
//
//            )
//        }
//
//        val itemValues = mapOf(
//            "userId" to AttributeValue.builder().s(user.userId.toString()).build(),
//            "date" to AttributeValue.builder().n(epochDate.toString()).build(),
//            "data" to AttributeValue.builder().s(transactionString).build()
//        )
//
//        val batchWriteItemRequest = BatchWriteItemRequest().withRequestItems(
//            requestItems = itemValues,
//        )
//
//        dynamoClient.putItem(request)
//        dynamoClient.batchWriteItem()
    }
}