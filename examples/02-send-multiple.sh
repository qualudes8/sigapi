#!/bin/bash

# Example: Send message to multiple recipients

BASE_URL="http://localhost:3000"

echo "Sending message to multiple recipients..."

curl -X POST "$BASE_URL/send" \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [
      "+1234567890",
      "+0987654321"
    ],
    "message": "Hello everyone! This is a broadcast message from SigAPI."
  }' | jq

echo ""
echo "✅ Messages sent to all recipients!"

