#!/bin/bash

# Example: Send a simple text message

BASE_URL="http://localhost:3000"

echo "Sending text message..."

curl -X POST "$BASE_URL/send" \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["+1234567890"],
    "message": "Hello from SigAPI! This is a test message."
  }' | jq

echo ""
echo "✅ Message sent!"

