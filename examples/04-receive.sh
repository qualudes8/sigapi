#!/bin/bash

# Example: Get incoming messages

BASE_URL="http://localhost:3000"

echo "Fetching incoming messages..."

curl -s "$BASE_URL/receive" | jq

echo ""
echo "✅ Messages retrieved!"

