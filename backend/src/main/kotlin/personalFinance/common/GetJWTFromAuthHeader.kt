package personalFinance.common

fun String?.getJWT(): String {
    if (this != null && this.startsWith("Bearer ")) {
        return this.substring(7)
    }

    throw Exception("Incorrect authentication header")
}

// Alias for compatibility
fun GetJWTFromAuthHeader(authHeader: String): String = authHeader.getJWT()
