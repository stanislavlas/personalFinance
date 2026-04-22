/**
 * DynamoDB Service
 * ----------------
 * When the user belongs to a household, listEntries queries by householdId
 * so all members see the same pool of transactions.
 * putEntry always stamps the entry with the current user's userId (for attribution).
 */

import { authRequest } from "./auth.js";

export async function listEntries(yearMonth = null, householdId = null) {
  const params = new URLSearchParams();
  if (yearMonth)   params.set("yearMonth",   yearMonth);
  if (householdId) params.set("householdId", householdId);
  const qs = params.toString();
  return authRequest(`/api/entries${qs ? "?" + qs : ""}`);
}

export async function putEntry(entry) {
  return authRequest("/api/entries", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export async function deleteEntry(entryId) {
  return authRequest(`/api/entries/${entryId}`, { method: "DELETE" });
}
