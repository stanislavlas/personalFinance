package personalFinance.dataStore

import aws.sdk.kotlin.services.dynamodb.DynamoDbClient
import aws.sdk.kotlin.services.dynamodb.model.*
import aws.smithy.kotlin.runtime.net.url.Url
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Repository
import personalFinance.models.TransactionType
import personalFinance.models.internal.Category
import java.time.Instant
import java.util.*

private const val CATEGORY_TABLE = "categories"
private const val CATEGORY_ID_ATTRIBUTE = "categoryId"
private const val USER_ID_ATTRIBUTE = "userId"
private const val HOUSEHOLD_ID_ATTRIBUTE = "householdId"
private const val NAME_ATTRIBUTE = "name"
private const val EMOJI_ATTRIBUTE = "emoji"
private const val COLOR_ATTRIBUTE = "color"
private const val TYPE_ATTRIBUTE = "type"
private const val IS_DEFAULT_ATTRIBUTE = "isDefault"
private const val CREATED_AT_ATTRIBUTE = "createdAt"

@Repository
class CategoryRepository(
    @Value("\${aws.region}") val awsRegion: String,
    @Value("\${aws.url}") val url: String,
    private val objectMapper: ObjectMapper,
) {
    private val dynamoClient = DynamoDbClient {
        region = awsRegion
        endpointUrl = Url.parse(url)
    }

    suspend fun save(category: Category) {
        val item = mutableMapOf(
            CATEGORY_ID_ATTRIBUTE to AttributeValue.S(category.categoryId.toString()),
            NAME_ATTRIBUTE to AttributeValue.S(category.name),
            EMOJI_ATTRIBUTE to AttributeValue.S(category.emoji),
            COLOR_ATTRIBUTE to AttributeValue.S(category.color),
            TYPE_ATTRIBUTE to AttributeValue.S(category.type.name),
            IS_DEFAULT_ATTRIBUTE to AttributeValue.Bool(category.isDefault),
            CREATED_AT_ATTRIBUTE to AttributeValue.N(category.createdAt.epochSecond.toString())
        )

        category.userId?.let {
            item[USER_ID_ATTRIBUTE] = AttributeValue.S(it.toString())
        }

        category.householdId?.let {
            item[HOUSEHOLD_ID_ATTRIBUTE] = AttributeValue.S(it.toString())
        }

        val request = PutItemRequest {
            tableName = CATEGORY_TABLE
            this.item = item
        }

        dynamoClient.putItem(request)
    }

    suspend fun findByUserId(userId: UUID): List<Category> {
        val queryRequest = QueryRequest {
            tableName = CATEGORY_TABLE
            indexName = "userId-index"
            keyConditionExpression = "$USER_ID_ATTRIBUTE = :userId"
            expressionAttributeValues = mapOf(
                ":userId" to AttributeValue.S(userId.toString())
            )
        }

        val items = dynamoClient.query(queryRequest).items ?: return emptyList()
        return items.map { mapToCategory(it) }
    }

    suspend fun findByHouseholdId(householdId: UUID): List<Category> {
        val queryRequest = QueryRequest {
            tableName = CATEGORY_TABLE
            indexName = "householdId-index"
            keyConditionExpression = "$HOUSEHOLD_ID_ATTRIBUTE = :householdId"
            expressionAttributeValues = mapOf(
                ":householdId" to AttributeValue.S(householdId.toString())
            )
        }

        val items = dynamoClient.query(queryRequest).items ?: return emptyList()
        return items.map { mapToCategory(it) }
    }

    suspend fun findById(categoryId: UUID): Category? {
        val request = GetItemRequest {
            tableName = CATEGORY_TABLE
            key = mapOf(CATEGORY_ID_ATTRIBUTE to AttributeValue.S(categoryId.toString()))
        }

        val item = dynamoClient.getItem(request).item ?: return null
        return mapToCategory(item)
    }

    suspend fun delete(categoryId: UUID) {
        val deleteRequest = DeleteItemRequest {
            tableName = CATEGORY_TABLE
            key = mapOf(CATEGORY_ID_ATTRIBUTE to AttributeValue.S(categoryId.toString()))
        }

        dynamoClient.deleteItem(deleteRequest)
    }

    private fun mapToCategory(item: Map<String, AttributeValue>): Category {
        val userIdStr = item[USER_ID_ATTRIBUTE]?.asS()
        val householdIdStr = item[HOUSEHOLD_ID_ATTRIBUTE]?.asS()

        return Category(
            categoryId = UUID.fromString(item[CATEGORY_ID_ATTRIBUTE]?.asS() ?: throw Exception("Missing categoryId")),
            userId = userIdStr?.let { UUID.fromString(it) },
            householdId = householdIdStr?.let { UUID.fromString(it) },
            name = item[NAME_ATTRIBUTE]?.asS() ?: throw Exception("Missing name"),
            emoji = item[EMOJI_ATTRIBUTE]?.asS() ?: throw Exception("Missing emoji"),
            color = item[COLOR_ATTRIBUTE]?.asS() ?: throw Exception("Missing color"),
            type = TransactionType.valueOf(item[TYPE_ATTRIBUTE]?.asS() ?: throw Exception("Missing type")),
            isDefault = item[IS_DEFAULT_ATTRIBUTE]?.asBool() ?: false,
            createdAt = Instant.ofEpochSecond(item[CREATED_AT_ATTRIBUTE]?.asN()?.toLong() ?: throw Exception("Missing createdAt"))
        )
    }
}
