package personalFinance.household

import org.springframework.stereotype.Service
import personalFinance.dataStore.HouseholdRepository
import personalFinance.dataStore.IDataStoreClient
import personalFinance.models.Currency
import personalFinance.models.internal.Household
import personalFinance.models.internal.HouseholdMember
import personalFinance.models.internal.MemberRole
import java.security.SecureRandom
import java.util.*

@Service
class HouseholdService(
    private val householdRepository: HouseholdRepository,
    private val dataStoreClient: IDataStoreClient
) {
    private val secureRandom = SecureRandom()

    suspend fun getHouseholdByUserId(userId: UUID): Household? {
        val user = dataStoreClient.getUserById(userId)
        val householdId = user.householdId ?: return null
        return householdRepository.findById(householdId)
    }

    suspend fun createHousehold(userId: UUID, name: String, currency: Currency): Household {
        val user = dataStoreClient.getUserById(userId)

        if (user.householdId != null) {
            throw Exception("User is already in a household")
        }

        val household = Household(
            householdId = UUID.randomUUID(),
            name = name,
            ownerId = userId,
            currency = currency,
            members = listOf(
                HouseholdMember(
                    userId = userId,
                    userName = user.name,
                    email = user.email,
                    role = MemberRole.OWNER
                )
            ),
            inviteCode = generateInviteCode()
        )

        householdRepository.save(household)

        // Update user with household info
        val updatedUser = user.copy(
            householdId = household.householdId,
            householdRole = MemberRole.OWNER
        )
        dataStoreClient.putUser(updatedUser)

        return household
    }

    suspend fun renameHousehold(householdId: UUID, userId: UUID, newName: String): Household {
        val household = householdRepository.findById(householdId)
            ?: throw Exception("Household not found")

        if (household.ownerId != userId) {
            throw Exception("Only the owner can rename the household")
        }

        val updated = household.copy(name = newName)
        householdRepository.save(updated)
        return updated
    }

    suspend fun deleteHousehold(householdId: UUID, userId: UUID) {
        val household = householdRepository.findById(householdId)
            ?: throw Exception("Household not found")

        if (household.ownerId != userId) {
            throw Exception("Only the owner can delete the household")
        }

        // Remove household from all members
        household.members.forEach { member ->
            val memberUser = dataStoreClient.getUserById(member.userId)
            val updatedUser = memberUser.copy(
                householdId = null,
                householdRole = null
            )
            dataStoreClient.putUser(updatedUser)
        }

        householdRepository.delete(householdId)
    }

    suspend fun addMember(householdId: UUID, userId: UUID, memberEmail: String): Household {
        val household = householdRepository.findById(householdId)
            ?: throw Exception("Household not found")

        if (household.ownerId != userId) {
            throw Exception("Only the owner can add members")
        }

        val newMember = dataStoreClient.getUserByEmail(memberEmail)
            ?: throw Exception("User with email $memberEmail not found")

        if (newMember.householdId != null) {
            throw Exception("User is already in a household")
        }

        // Check if already a member
        if (household.members.any { it.userId == newMember.userId }) {
            throw Exception("User is already a member of this household")
        }

        val updatedMembers = household.members + HouseholdMember(
            userId = newMember.userId,
            userName = newMember.name,
            email = newMember.email,
            role = MemberRole.MEMBER
        )

        val updated = household.copy(members = updatedMembers)
        householdRepository.save(updated)

        // Update new member's user record
        val updatedUser = newMember.copy(
            householdId = householdId,
            householdRole = MemberRole.MEMBER
        )
        dataStoreClient.putUser(updatedUser)

        return updated
    }

    suspend fun removeMember(householdId: UUID, ownerId: UUID, memberUserId: UUID): Household {
        val household = householdRepository.findById(householdId)
            ?: throw Exception("Household not found")

        if (household.ownerId != ownerId) {
            throw Exception("Only the owner can remove members")
        }

        if (memberUserId == ownerId) {
            throw Exception("Owner cannot remove themselves")
        }

        val updatedMembers = household.members.filter { it.userId != memberUserId }

        if (updatedMembers.size == household.members.size) {
            throw Exception("Member not found in household")
        }

        val updated = household.copy(members = updatedMembers)
        householdRepository.save(updated)

        // Update removed member's user record
        val memberUser = dataStoreClient.getUserById(memberUserId)
        val updatedUser = memberUser.copy(
            householdId = null,
            householdRole = null
        )
        dataStoreClient.putUser(updatedUser)

        return updated
    }

    suspend fun leaveHousehold(householdId: UUID, userId: UUID) {
        val household = householdRepository.findById(householdId)
            ?: throw Exception("Household not found")

        if (household.ownerId == userId) {
            throw Exception("Owner cannot leave household. Delete it or transfer ownership first.")
        }

        val updatedMembers = household.members.filter { it.userId != userId }
        val updated = household.copy(members = updatedMembers)
        householdRepository.save(updated)

        // Update user record
        val user = dataStoreClient.getUserById(userId)
        val updatedUser = user.copy(
            householdId = null,
            householdRole = null
        )
        dataStoreClient.putUser(updatedUser)
    }

    private fun generateInviteCode(): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return (1..6)
            .map { chars[secureRandom.nextInt(chars.length)] }
            .joinToString("")
    }
}
