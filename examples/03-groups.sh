#!/bin/bash

# Example: List groups and create a new group

BASE_URL="http://localhost:3000"

echo "=== Listing all groups ==="
curl -s "$BASE_URL/groups" | jq

echo ""
echo "=== Creating a new group ==="

curl -X POST "$BASE_URL/groups" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Group",
    "members": ["+1234567890", "+0987654321"]
  }' | jq

echo ""
echo "✅ Group operations completed!"

