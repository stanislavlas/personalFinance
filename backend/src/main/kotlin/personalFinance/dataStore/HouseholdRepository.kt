package personalFinance.dataStore

import aws.sdk.kotlin.services.dynamodb.DynamoDbClient
import aws.sdk.kotlin.services.dynamodb.model.*
import aws.smithy.kotlin.runtime.net.url.Url
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Repository
import personalFinance.models.Currency
import personalFinance.models.internal.Household
import personalFinance.models.internal.HouseholdMember
import personalFinance.models.internal.MemberRole
import java.time.Instant
import java.util.*

private const val HOUSEHOLD_TABLE = "households"
private const val HOUSEHOLD_ID_ATTRIBUTE = "householdId"
private const val NAME_ATTRIBUTE = "name"
private const val OWNER_ID_ATTRIBUTE = "ownerId"
private const val CURRENCY_ATTRIBUTE = "currency"
private const val MEMBERS_ATTRIBUTE = "members"
private const val CREATED_AT_ATTRIBUTE = "createdAt"
private const val INVITE_CODE_ATTRIBUTE = "inviteCode"

@Repository
class HouseholdRepository(
    @Value("\${aws.region}") val awsRegion: String,
    @Value("\${aws.url}") val url: String,
    private val objectMapper: ObjectMapper,
) {
    private val dynamoClient = DynamoDbClient {
        region = awsRegion
        endpointUrl = Url.parse(url)
    }

    suspend fun save(household: Household) {
        val item = mutableMapOf(
            HOUSEHOLD_ID_ATTRIBUTE to AttributeValue.S(household.householdId.toString()),
            NAME_ATTRIBUTE to AttributeValue.S(household.name),
            OWNER_ID_ATTRIBUTE to AttributeValue.S(household.ownerId.toString()),
            CURRENCY_ATTRIBUTE to AttributeValue.S(household.currency.name),
            MEMBERS_ATTRIBUTE to AttributeValue.S(objectMapper.writeValueAsString(household.members)),
            CREATED_AT_ATTRIBUTE to AttributeValue.N(household.createdAt.epochSecond.toString())
        )

        household.inviteCode?.let {
            item[INVITE_CODE_ATTRIBUTE] = AttributeValue.S(it)
        }

        val request = PutItemRequest {
            tableName = HOUSEHOLD_TABLE
            this.item = item
        }

        dynamoClient.putItem(request)
    }

    suspend fun findById(householdId: UUID): Household? {
        val request = GetItemRequest {
            tableName = HOUSEHOLD_TABLE
            key = mapOf(HOUSEHOLD_ID_ATTRIBUTE to AttributeValue.S(householdId.toString()))
        }

        val item = dynamoClient.getItem(request).item ?: return null
        return mapToHousehold(item)
    }

    suspend fun findByOwnerId(ownerId: UUID): List<Household> {
        val queryRequest = QueryRequest {
            tableName = HOUSEHOLD_TABLE
            indexName = "ownerId-index"
            keyConditionExpression = "$OWNER_ID_ATTRIBUTE = :ownerId"
            expressionAttributeValues = mapOf(
                ":ownerId" to AttributeValue.S(ownerId.toString())
            )
        }

        val items = dynamoClient.query(queryRequest).items ?: return emptyList()
        return items.map { mapToHousehold(it) }
    }

    suspend fun delete(householdId: UUID) {
        val deleteRequest = DeleteItemRequest {
            tableName = HOUSEHOLD_TABLE
            key = mapOf(HOUSEHOLD_ID_ATTRIBUTE to AttributeValue.S(householdId.toString()))
        }

        dynamoClient.deleteItem(deleteRequest)
    }

    private fun mapToHousehold(item: Map<String, AttributeValue>): Household {
        val membersJson = item[MEMBERS_ATTRIBUTE]?.asS() ?: "[]"
        val members: List<HouseholdMember> = objectMapper.readValue(membersJson)

        return Household(
            householdId = UUID.fromString(item[HOUSEHOLD_ID_ATTRIBUTE]?.asS() ?: throw Exception("Missing householdId")),
            name = item[NAME_ATTRIBUTE]?.asS() ?: throw Exception("Missing name"),
            ownerId = UUID.fromString(item[OWNER_ID_ATTRIBUTE]?.asS() ?: throw Exception("Missing ownerId")),
            currency = Currency.valueOf(item[CURRENCY_ATTRIBUTE]?.asS() ?: throw Exception("Missing currency")),
            members = members,
            createdAt = Instant.ofEpochSecond(item[CREATED_AT_ATTRIBUTE]?.asN()?.toLong() ?: throw Exception("Missing createdAt")),
            inviteCode = item[INVITE_CODE_ATTRIBUTE]?.asS()
        )
    }
}
