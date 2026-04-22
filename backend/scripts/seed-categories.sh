#!/bin/bash

# Seed default categories into DynamoDB
# This script populates default income and expense categories for a specific user.
# Usage: ./seed-categories.sh <userId>

if [ -z "$1" ]; then
  echo "Usage: ./seed-categories.sh <userId>"
  echo "Example: ./seed-categories.sh 123e4567-e89b-12d3-a456-426614174000"
  exit 1
fi

USER_ID=$1
ENDPOINT="${AWS_ENDPOINT:-http://localhost:4566}"
REGION="${AWS_REGION:-eu-central-1}"
TIMESTAMP=$(date +%s)

echo "Seeding categories for user: $USER_ID"
echo "DynamoDB endpoint: $ENDPOINT"
echo ""

# Function to generate UUID (simple random UUID v4)
generate_uuid() {
  uuidgen | tr '[:upper:]' '[:lower:]'
}

# Function to add a category
add_category() {
  local name=$1
  local emoji=$2
  local color=$3
  local type=$4
  local category_id=$(generate_uuid)

  echo "Adding category: $name ($type)"

  aws --endpoint-url=$ENDPOINT dynamodb put-item \
    --table-name categories \
    --region $REGION \
    --item "{
      \"categoryId\": {\"S\": \"$category_id\"},
      \"userId\": {\"S\": \"$USER_ID\"},
      \"name\": {\"S\": \"$name\"},
      \"emoji\": {\"S\": \"$emoji\"},
      \"color\": {\"S\": \"$color\"},
      \"type\": {\"S\": \"$type\"},
      \"isDefault\": {\"BOOL\": true},
      \"createdAt\": {\"N\": \"$TIMESTAMP\"}
    }" > /dev/null 2>&1

  if [ $? -eq 0 ]; then
    echo "  ✓ Added: $name"
  else
    echo "  ✗ Failed to add: $name"
  fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Adding INCOME categories (4 categories)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

add_category "Salary" "💼" "#1D9E75" "INCOME"
add_category "Meal Vouchers" "🍽️" "#5DCAA5" "INCOME"
add_category "Flexi Pass" "💳" "#9FE1CB" "INCOME"
add_category "Invested" "🪙" "#63B3ED" "INCOME"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Adding EXPENSE categories (16 categories)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

add_category "Rent" "🏠" "#D85A30" "EXPENSE"
add_category "Energy" "🔥" "#EF9F27" "EXPENSE"
add_category "Electricity" "⚡" "#FAC775" "EXPENSE"
add_category "Internet" "🌐" "#7F77DD" "EXPENSE"
add_category "Phone" "📱" "#534AB7" "EXPENSE"
add_category "Insurance" "🛡️" "#888780" "EXPENSE"
add_category "Groceries" "🛒" "#D4537E" "EXPENSE"
add_category "Household" "🏡" "#993556" "EXPENSE"
add_category "Transport" "🚗" "#BA7517" "EXPENSE"
add_category "Clothing" "👕" "#F0997B" "EXPENSE"
add_category "Multisport" "🏋️" "#5DCAA5" "EXPENSE"
add_category "Subscription" "📺" "#AFA9EC" "EXPENSE"
add_category "Dining Out" "🍕" "#D85A30" "EXPENSE"
add_category "Alza" "🖥️" "#185FA5" "EXPENSE"
add_category "Entertainment" "🎉" "#7F77DD" "EXPENSE"
add_category "Other" "❓" "#D3D1C7" "EXPENSE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Category seeding complete!"
echo "Total: 4 income + 16 expense = 20 categories"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
