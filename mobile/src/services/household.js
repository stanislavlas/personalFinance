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
 *
 * Offline-first:
 * - All mutating operations queue failed requests on network errors AND server errors (5xx).
 * - 404 responses for leave/delete are treated as success (idempotent).
 * - sync* exports are used by syncService to replay queued ops.
 */

import { authRequest } from "./auth.js";
import { logger } from "../utils/logger.js";
import { isRetryableError } from "../utils/isRetryableError.js";

logger.info('household', 'Household service loaded');

async function enqueueHouseholdOp(type, payload) {
  try {
    const { default: syncService } = await import("./syncService.js");
    const { getStoredUser } = await import("./auth.js");
    const user = await getStoredUser();
    await syncService.enqueue(type, payload, user?.userId);
  } catch (err) {
    logger.error('household', `Failed to queue ${type}`, err.message);
    throw err;
  }
}

async function isOffline() {
  const { default: syncService } = await import("./syncService.js");
  return !syncService.isOnline();
}

/** Get the current user's household (null if not in one) */
export async function getMyHousehold() {
  logger.info('household', 'getMyHousehold called');
  try {
    const result = await authRequest("/api/households");
    logger.info('household', 'getMyHousehold result: ' + (result ? 'household found' : 'no household'));
    return result;
  } catch (error) {
    logger.error('household', 'getMyHousehold error', error.message);
    throw error;
  }
}

/** Create a new household. The caller becomes owner. */
export async function createHousehold(name, currency = "USD", { skipQueue = false } = {}) {
  logger.info('household', 'createHousehold called', { name, currency });
  if (!skipQueue && await isOffline()) {
    await enqueueHouseholdOp("household.create", { name, currency });
    return { queued: true };
  }
  try {
    const result = await authRequest("/api/households", {
      method: "POST",
      body: JSON.stringify({ name, currency }),
    }, skipQueue ? 0 : 3000);
    logger.info('household', 'createHousehold success');
    return result;
  } catch (error) {
    logger.error('household', 'createHousehold error', error.message);
    if (!skipQueue && isRetryableError(error)) {
      await enqueueHouseholdOp("household.create", { name, currency });
      return { queued: true };
    }
    throw error;
  }
}

/** Owner: add a member by email */
export async function addMember(householdId, email, { skipQueue = false } = {}) {
  logger.info('household', 'addMember called', { householdId, email });
  if (!skipQueue && await isOffline()) {
    await enqueueHouseholdOp("household.addMember", { householdId, email });
    return { queued: true };
  }
  try {
    const result = await authRequest(`/api/households/${householdId}/members`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }, skipQueue ? 0 : 3000);
    logger.info('household', 'addMember success');
    return result;
  } catch (error) {
    logger.error('household', 'addMember error', error.message);
    if (!skipQueue && isRetryableError(error)) {
      await enqueueHouseholdOp("household.addMember", { householdId, email });
      return { queued: true };
    }
    throw error;
  }
}

/** Owner: remove a member by userId */
export async function removeMember(householdId, userId, { skipQueue = false } = {}) {
  logger.info('household', 'removeMember called', { householdId, userId });
  if (!skipQueue && await isOffline()) {
    await enqueueHouseholdOp("household.removeMember", { householdId, userId });
    return { queued: true };
  }
  try {
    const result = await authRequest(`/api/households/${householdId}/members/${userId}`, { method: "DELETE" }, skipQueue ? 0 : 3000);
    logger.info('household', 'removeMember success');
    return result;
  } catch (error) {
    logger.error('household', 'removeMember error', error.message);
    if (!skipQueue && isRetryableError(error)) {
      await enqueueHouseholdOp("household.removeMember", { householdId, userId });
      return { queued: true };
    }
    throw error;
  }
}

/** Any member: leave the household (owner must transfer or delete first) */
export async function leaveHousehold(householdId, { skipQueue = false } = {}) {
  logger.info('household', 'leaveHousehold called', { householdId });
  if (!skipQueue && await isOffline()) {
    await enqueueHouseholdOp("household.leave", { householdId });
    return { queued: true };
  }
  try {
    const result = await authRequest(`/api/households/${householdId}/leave`, { method: "POST" }, skipQueue ? 0 : 3000);
    logger.info('household', 'leaveHousehold success');
    return result;
  } catch (error) {
    logger.error('household', 'leaveHousehold error', error.message);
    if (!skipQueue && isRetryableError(error)) {
      await enqueueHouseholdOp("household.leave", { householdId });
      return { queued: true };
    }
    throw error;
  }
}

/** Owner: delete the entire household (all members are unlinked, data stays) */
export async function deleteHousehold(householdId, { skipQueue = false } = {}) {
  logger.info('household', 'deleteHousehold called', { householdId });
  if (!skipQueue && await isOffline()) {
    await enqueueHouseholdOp("household.delete", { householdId });
    return { queued: true };
  }
  try {
    const result = await authRequest(`/api/households/${householdId}`, { method: "DELETE" }, skipQueue ? 0 : 3000);
    logger.info('household', 'deleteHousehold success');
    return result;
  } catch (error) {
    logger.error('household', 'deleteHousehold error', error.message);
    if (!skipQueue && isRetryableError(error)) {
      await enqueueHouseholdOp("household.delete", { householdId });
      return { queued: true };
    }
    throw error;
  }
}

/** Owner: rename the household */
export async function renameHousehold(householdId, name, { skipQueue = false } = {}) {
  logger.info('household', 'renameHousehold called', { householdId, name });
  if (!skipQueue && await isOffline()) {
    await enqueueHouseholdOp("household.rename", { householdId, name });
    return { queued: true };
  }
  try {
    const result = await authRequest(`/api/households/${householdId}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    }, skipQueue ? 0 : 3000);
    logger.info('household', 'renameHousehold success');
    return result;
  } catch (error) {
    logger.error('household', 'renameHousehold error', error.message);
    if (!skipQueue && isRetryableError(error)) {
      await enqueueHouseholdOp("household.rename", { householdId, name });
      return { queued: true };
    }
    throw error;
  }
}

// ── Sync-replay functions (used by syncService, skipQueue=true) ───────────────

export async function syncCreateHousehold(name, currency) {
  return createHousehold(name, currency, { skipQueue: true });
}

export async function syncAddMember(householdId, email) {
  return addMember(householdId, email, { skipQueue: true });
}

export async function syncRemoveMember(householdId, userId) {
  return removeMember(householdId, userId, { skipQueue: true });
}

export async function syncLeaveHousehold(householdId) {
  return leaveHousehold(householdId, { skipQueue: true });
}

export async function syncDeleteHousehold(householdId) {
  return deleteHousehold(householdId, { skipQueue: true });
}

export async function syncRenameHousehold(householdId, name) {
  return renameHousehold(householdId, name, { skipQueue: true });
}
