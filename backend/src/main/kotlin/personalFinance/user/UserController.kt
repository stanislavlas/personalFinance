package personalFinance.user

import org.springframework.web.bind.annotation.*
import personalFinance.auth.JwtAuth
import personalFinance.common.getJWT
import personalFinance.models.api.User

@RestController
@RequestMapping("/api/user")
class UserController(
    private val jwtAuth: JwtAuth,
    private val userService: UserService,
) {

    @GetMapping("")
    fun getUser(@RequestHeader("Authorization") authHeader: String): User {
        val jwt = authHeader.getJWT()

        val user = userService.getUser(
            userId = jwtAuth.getUserIdFromJWT(jwt),
        )

        return user.toApi()
    }

    @PatchMapping("")
    fun updateUser(
        @RequestHeader("Authorization") authHeader: String,
        @RequestBody request: UpdateUserRequest,
    ): User {
        val jwt    = authHeader.getJWT()
        val userId = jwtAuth.getUserIdFromJWT(jwt)
        val updated = userService.updateUser(
            userId   = userId,
            name     = request.name,
            currency = request.currency,
        )
        return updated.toApi()
    }
}

data class UpdateUserRequest(
    val name: String?,
    val currency: String?,
)
