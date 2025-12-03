#!/bin/bash

# Example: List all contacts

BASE_URL="http://localhost:3000"

echo "Fetching contacts..."

curl -s "$BASE_URL/contacts" | jq

echo ""
echo "✅ Contacts retrieved!"

