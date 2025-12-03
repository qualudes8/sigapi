================================================================================
              SigAPI - FEATURES
================================================================================

This wrapper simplifies the signal-cli-rest-api with production-ready features.

--------------------------------------------------------------------------------
CORE FEATURES
--------------------------------------------------------------------------------

1. SINGLE ENDPOINT FOR EVERYTHING
   POST /send - handles text, media, individuals, and groups
   No need to learn multiple endpoints

2. AUTOMATIC MEDIA HANDLING
   - Upload files directly via form-data
   - Auto-converts to base64 (no manual conversion)
   - Auto-detects MIME types
   - Supports: JPG, PNG, GIF, WebP, MP4, MOV, MP3, PDF, DOC, TXT

3. FLEXIBLE GROUP FORMAT
   - Accepts both "group.ID" and "group:ID"
   - Automatically formats for Signal API
   - Just copy group ID from /groups endpoint and use it

4. BUILT-IN RATE LIMITING
   - Queue system processes one message at a time
   - Configurable delay (default: 1 second)
   - Prevents Signal rate limit bans
   - View queue status at GET /status

5. BATCH SENDING
   - Send to multiple recipients in one request
   - Mix individuals and groups
   - Sequential delivery with rate limiting
   - Individual success/failure tracking

6. COMPREHENSIVE LOGGING
   - combined.log: All activity
   - error.log: Errors only
   - messages.log: Message attempts and results
   - Includes timestamps, durations, job IDs

7. DETAILED RESPONSES
   - Job ID for tracking
   - Summary (total, successful, failed)
   - Per-recipient results with duration
   - Clear error messages

8. HEALTH MONITORING
   - GET /health - API status check
   - GET /status - Queue and config info

9. GROUP MANAGEMENT
   - GET /groups - List all groups with IDs
   - POST /groups - Create new groups

10. MESSAGE RECEIVING
    - GET /receive - Get incoming messages

11. CONTACT MANAGEMENT
    - GET /contacts - List all contacts

12. DEVICE LINKING
    - GET /qrcode - Get QR code link for linking new devices

--------------------------------------------------------------------------------
API ENDPOINTS
--------------------------------------------------------------------------------

POST /send
  Send messages to individuals or groups
  Supports JSON body or form-data with file upload

GET /health
  Returns: { status, timestamp, signalNumber }

GET /status
  Returns: { queue info, config settings }

GET /groups
  List all groups the account is part of
  Returns: { success, count, groups: [{ id, name, memberCount }] }

POST /groups
  Create a new group
  Body: { "name": "Group Name", "members": ["+1234567890"] }
  Returns: { success, group: { id, name } }

GET /receive
  Get incoming messages
  Returns: { success, count, messages: [...] }

GET /contacts
  List all contacts
  Returns: { success, count, contacts: [{ number, name, blocked }] }

GET /qrcode
  Get QR code link for linking new devices
  Query: ?device_name=optional-name
  Returns: { success, deviceName, qrCodeLink, instructions }

--------------------------------------------------------------------------------
REQUEST FORMATS
--------------------------------------------------------------------------------

TEXT MESSAGE (JSON):
{
  "recipients": ["+1234567890"],
  "message": "Hello!"
}

WITH MEDIA (form-data):
  recipients: ["+1234567890"]
  message: Your message
  media: (file upload)

TO GROUP:
{
  "recipients": ["group.abc123..."],
  "message": "Hello group!"
}

MULTIPLE RECIPIENTS:
{
  "recipients": ["+111...", "+222...", "group.abc..."],
  "message": "Hello everyone!"
}

--------------------------------------------------------------------------------
RESPONSE FORMAT
--------------------------------------------------------------------------------

{
  "success": true,
  "jobId": "job-1234567890-abc123",
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  },
  "results": [
    {
      "success": true,
      "recipient": "+1234567890",
      "isGroup": false,
      "timestamp": "2024-01-01T12:00:00.000Z",
      "duration": 523
    }
  ]
}

--------------------------------------------------------------------------------
CONFIGURATION OPTIONS (.env)
--------------------------------------------------------------------------------

SIGNAL_NUMBER        Your Signal phone number (required)
RATE_LIMIT_DELAY_MS  Delay between messages in ms (default: 1000)
PORT                 API port (default: 3000)
SIGNAL_API_URL       Signal CLI API URL (default: http://signal-api:8080)

--------------------------------------------------------------------------------
SUPPORTED MEDIA TYPES
--------------------------------------------------------------------------------

Images:     .jpg, .jpeg, .png, .gif, .webp
Videos:     .mp4, .mov
Audio:      .mp3, .m4a, .wav
Documents:  .pdf, .doc, .docx, .txt
Max size:   100MB

--------------------------------------------------------------------------------
SECURITY FEATURES
--------------------------------------------------------------------------------

- Localhost-only binding (127.0.0.1)
- Docker container isolation
- Sensitive data in .env (gitignored)
- Signal data in signal-data/ (gitignored)

--------------------------------------------------------------------------------
TECH STACK
--------------------------------------------------------------------------------

- Node.js 18 + Express
- Docker + Docker Compose
- Winston (logging)
- p-queue (rate limiting)
- Axios (HTTP client)

================================================================================

