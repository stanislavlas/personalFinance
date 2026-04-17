package personalFinance.household

import kotlinx.coroutines.runBlocking
import org.springframework.web.bind.annotation.*
import personalFinance.auth.JwtAuth
import personalFinance.common.GetJWTFromAuthHeader
import personalFinance.models.Currency
import personalFinance.models.internal.Household
import java.util.*

@RestController
@RequestMapping("/api/households")
class HouseholdController(
    private val householdService: HouseholdService,
    private val jwtAuth: JwtAuth
) {
    @GetMapping
    fun getHousehold(
        @RequestHeader("Authorization") authorization: String
    ): Household? {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        return runBlocking {
            householdService.getHouseholdByUserId(userId)
        }
    }

    @PostMapping
    fun createHousehold(
        @RequestHeader("Authorization") authorization: String,
        @RequestBody request: CreateHouseholdRequest
    ): Household {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        return runBlocking {
            householdService.createHousehold(
                userId = userId,
                name = request.name,
                currency = request.currency
            )
        }
    }

    @PutMapping("/{id}")
    fun renameHousehold(
        @RequestHeader("Authorization") authorization: String,
        @PathVariable id: String,
        @RequestBody request: RenameHouseholdRequest
    ): Household {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        return runBlocking {
            householdService.renameHousehold(
                householdId = UUID.fromString(id),
                userId = userId,
                newName = request.name
            )
        }
    }

    @DeleteMapping("/{id}")
    fun deleteHousehold(
        @RequestHeader("Authorization") authorization: String,
        @PathVariable id: String
    ): Map<String, Boolean> {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        runBlocking {
            householdService.deleteHousehold(
                householdId = UUID.fromString(id),
                userId = userId
            )
        }

        return mapOf("success" to true)
    }

    @PostMapping("/{id}/members")
    fun addMember(
        @RequestHeader("Authorization") authorization: String,
        @PathVariable id: String,
        @RequestBody request: AddMemberRequest
    ): Household {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        return runBlocking {
            householdService.addMember(
                householdId = UUID.fromString(id),
                userId = userId,
                memberEmail = request.email
            )
        }
    }

    @DeleteMapping("/{id}/members/{userId}")
    fun removeMember(
        @RequestHeader("Authorization") authorization: String,
        @PathVariable id: String,
        @PathVariable userId: String
    ): Household {
        val jwt = GetJWTFromAuthHeader(authorization)
        val ownerId = jwtAuth.getUserIdFromJWT(jwt)

        return runBlocking {
            householdService.removeMember(
                householdId = UUID.fromString(id),
                ownerId = ownerId,
                memberUserId = UUID.fromString(userId)
            )
        }
    }

    @PostMapping("/{id}/leave")
    fun leaveHousehold(
        @RequestHeader("Authorization") authorization: String,
        @PathVariable id: String
    ): Map<String, Boolean> {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        runBlocking {
            householdService.leaveHousehold(
                householdId = UUID.fromString(id),
                userId = userId
            )
        }

        return mapOf("success" to true)
    }
}

data class CreateHouseholdRequest(
    val name: String,
    val currency: Currency
)

data class RenameHouseholdRequest(
    val name: String
)

data class AddMemberRequest(
    val email: String
)
