package personalFinance.dashboard

import kotlinx.coroutines.runBlocking
import org.springframework.web.bind.annotation.*
import personalFinance.auth.JwtAuth
import personalFinance.common.GetJWTFromAuthHeader
import personalFinance.models.api.DashboardResponse
import java.time.LocalDate
import java.util.*

@RestController
@RequestMapping("/api/dashboard")
class DashboardController(
    private val dashboardService: DashboardService,
    private val jwtAuth: JwtAuth
) {
    @GetMapping
    fun getDashboard(
        @RequestHeader("Authorization") authorization: String,
        @RequestParam(required = false) householdId: String?,
        @RequestParam fromDate: String,
        @RequestParam toDate: String
    ): DashboardResponse {
        val jwt = GetJWTFromAuthHeader(authorization)
        val userId = jwtAuth.getUserIdFromJWT(jwt)

        val householdUUID = householdId?.let { UUID.fromString(it) }

        return runBlocking {
            dashboardService.getDashboard(
                userId = userId,
                householdId = householdUUID,
                fromDate = LocalDate.parse(fromDate),
                toDate = LocalDate.parse(toDate)
            )
        }
    }
}
