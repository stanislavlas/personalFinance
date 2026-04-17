/**
 * Household Service
 * -----------------
 * A household lets multiple users share one pool of entries.
 * Only the owner can add/remove members.
 * All members (owner included) see all entries in the household.
 *
 * DynamoDB table: budget_households
 *   PK: householdId (String) — uuid v4
 *   Attributes:
 *     name        (String)
 *     ownerUserId (String)
 *     members     (List<Map>) — [{ userId, name, email, joinedAt }]
 *     createdAt   (Number)
 *
 * The user record in budget_users also stores:
 *   householdId  (String | null)
 *   householdRole ("owner" | "member" | null)
 */

import { authRequest } from "./auth.js";

/** Get the current user's household (null if not in one) */
export async function getMyHousehold() {
  return authRequest("/api/households/me");
}

/** Create a new household. The caller becomes owner. */
export async function createHousehold(name) {
  return authRequest("/api/households", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

/** Owner: add a member by email */
export async function addMember(householdId, email) {
  return authRequest(`/api/households/${householdId}/members`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/** Owner: remove a member by userId */
export async function removeMember(householdId, userId) {
  return authRequest(`/api/households/${householdId}/members/${userId}`, { method: "DELETE" });
}

/** Any member: leave the household (owner must transfer or delete first) */
export async function leaveHousehold(householdId) {
  return authRequest(`/api/households/${householdId}/leave`, { method: "POST" });
}

/** Owner: delete the entire household (all members are unlinked, data stays) */
export async function deleteHousehold(householdId) {
  return authRequest(`/api/households/${householdId}`, { method: "DELETE" });
}

/** Owner: rename the household */
export async function renameHousehold(householdId, name) {
  return authRequest(`/api/households/${householdId}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}
