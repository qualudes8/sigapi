#!/bin/bash

# Example: Check API health and status

BASE_URL="http://localhost:3000"

echo "=== Health Check ==="
curl -s "$BASE_URL/health" | jq

echo ""
echo "=== API Status ==="
curl -s "$BASE_URL/status" | jq

echo ""
echo "✅ API is operational!"

