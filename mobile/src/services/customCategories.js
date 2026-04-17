/**
 * Custom Categories Service
 * -------------------------
 * Users can create their own categories on top of the built-in ones.
 * Custom categories are stored in `budget_categories` DynamoDB table:
 *
 *   PK: userId     (String)
 *   SK: categoryId (String) — "custom:<timestamp>-<random>"
 *   Attributes: label, emoji, type ("income"|"expense"), createdAt
 *
 * The Lambda routes are:
 *   GET    /categories        → list user's custom categories
 *   POST   /categories        → create a new custom category
 *   DELETE /categories/:id    → delete a custom category
 */

import { authRequest } from "./auth.js";

export async function listCustomCategories() {
  return authRequest("/api/categories");
}

export async function createCustomCategory({ label, emoji, type }) {
  return authRequest("/api/categories", {
    method: "POST",
    body: JSON.stringify({ name: label, emoji, type }),
  });
}

export async function deleteCustomCategory(categoryId) {
  return authRequest(`/api/categories/${categoryId}`, { method: "DELETE" });
}
