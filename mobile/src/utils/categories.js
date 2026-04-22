/**
 * Category Configuration (Historical Reference)
 * =============================================
 *
 * Categories are now stored in DynamoDB and loaded dynamically via the API.
 * This file is kept for reference and documentation purposes only.
 *
 * When a new user registers, the backend automatically seeds these default categories
 * via CategoryService.seedDefaultCategories().
 *
 * To add or modify categories:
 * 1. Update the backend: src/main/kotlin/personalFinance/category/CategoryService.kt
 * 2. Update the seeding script: scripts/seed-categories.sh (for existing users)
 * 3. Update this documentation
 *
 * Categories are fetched via useCategories() hook which calls /api/categories
 */

// Default Income Categories (4)
// - Salary (💼, #1D9E75)
// - Meal Vouchers (🍽️, #5DCAA5)
// - Flexi Pass (💳, #9FE1CB)
// - Invested (🪙, #63B3ED)

// Default Expense Categories (16)
// - Rent (🏠, #D85A30)
// - Energy (🔥, #EF9F27)
// - Electricity (⚡, #FAC775)
// - Internet (🌐, #7F77DD)
// - Phone (📱, #534AB7)
// - Insurance (🛡️, #888780)
// - Groceries (🛒, #D4537E)
// - Household (🏡, #993556)
// - Transport (🚗, #BA7517)
// - Clothing (👕, #F0997B)
// - Multisport (🏋️, #5DCAA5)
// - Subscription (📺, #AFA9EC)
// - Dining Out (🍕, #D85A30)
// - Alza (🖥️, #185FA5)
// - Entertainment (🎉, #7F77DD)
// - Other (❓, #D3D1C7)


