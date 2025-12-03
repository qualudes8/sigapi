================================================================================
              SigAPI - SETUP & USAGE GUIDE
================================================================================

A simple REST API to send Signal messages (text + media) to individuals and 
groups, with rate limiting and logging built-in.

--------------------------------------------------------------------------------
QUICK START
--------------------------------------------------------------------------------

1. Configure your Signal number:
   
   cp .env.example .env
   # Edit .env and set SIGNAL_NUMBER=+91XXXXXXXXXX (your number)

2. Start the services:
   
   docker-compose up -d

3. Link your Signal account (first time only):
   
   Open: http://localhost:8080/v1/qrcodelink?device_name=signal-api
   Then scan the QR code with Signal app (Settings > Linked Devices > +)

4. Send a test message:
   
   curl -X POST http://localhost:3000/send \
     -H "Content-Type: application/json" \
     -d '{"recipients": ["+91XXXXXXXXXX"], "message": "Hello from API!"}'

--------------------------------------------------------------------------------
API ENDPOINTS
--------------------------------------------------------------------------------

Your Wrapper API:     http://localhost:3000
Signal CLI REST API:  http://localhost:8080 (direct access if needed)

ENDPOINTS:
  POST /send      - Send messages (text and/or media)
  GET  /health    - Check if API is running
  GET  /status    - View queue status and configuration
  GET  /groups    - List all groups
  POST /groups    - Create a new group
  GET  /receive   - Get incoming messages
  GET  /contacts  - List all contacts
  GET  /qrcode    - Get QR code link for linking devices

--------------------------------------------------------------------------------
SENDING MESSAGES
--------------------------------------------------------------------------------

METHOD: POST
URL: http://localhost:3000/send

OPTION 1: JSON Body (Text Only)
-------------------------------
Headers: Content-Type: application/json

Body:
{
  "recipients": ["+91XXXXXXXXXX"],
  "message": "Hello!"
}

OPTION 2: Form-Data (With Media)
--------------------------------
Use form-data in Postman:

  Key          | Type | Value
  -------------|------|----------------------------------
  recipients   | Text | ["+91XXXXXXXXXX"]
  message      | Text | Check out this image!
  media        | File | (select your image/document)

--------------------------------------------------------------------------------
SENDING TO GROUPS
--------------------------------------------------------------------------------

1. First, get your group IDs:
   
   GET http://localhost:3000/groups
   
   Or via wrapper API:
   GET http://localhost:3000/groups

   Response shows your groups with their IDs:
   {
     "success": true,
     "count": 1,
     "groups": [
       {
         "id": "group.abc123...",
         "name": "My Group",
         "memberCount": 5
       }
     ]
   }

2. Send to group using the "id" field (starts with "group."):
   
   {
     "recipients": ["group.ai85VWpqWDlSU2E1Mk02Zl..."],
     "message": "Hello group!"
   }

IMPORTANT: Group IDs use a PERIOD (group.) not a colon (group:)
           Copy the exact "id" from the groups list response.

3. Create a new group:
   
   POST http://localhost:3000/groups
   Content-Type: application/json
   
   {
     "name": "New Group",
     "members": ["+911111111111", "+912222222222"]
   }

--------------------------------------------------------------------------------
SENDING TO MULTIPLE RECIPIENTS
--------------------------------------------------------------------------------

Send to multiple people/groups in one request:

{
  "recipients": [
    "+911111111111",
    "+912222222222",
    "group.abc123..."
  ],
  "message": "Hello everyone!"
}

Messages are sent sequentially with rate limiting (1 second between each).

--------------------------------------------------------------------------------
SUPPORTED MEDIA TYPES
--------------------------------------------------------------------------------

Images:     .jpg, .jpeg, .png, .gif, .webp
Videos:     .mp4, .mov
Audio:      .mp3, .m4a, .wav
Documents:  .pdf, .doc, .docx, .txt

Maximum file size: 100MB

--------------------------------------------------------------------------------
RESPONSE FORMAT
--------------------------------------------------------------------------------

Success:
{
  "success": true,
  "jobId": "job-1234567890-abc123",
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  },
  "results": [
    {
      "success": true,
      "recipient": "+911111111111",
      "isGroup": false,
      "timestamp": "2024-01-01T12:00:00.000Z",
      "duration": 523
    }
  ]
}

Error:
{
  "success": false,
  "error": "Error message here"
}

--------------------------------------------------------------------------------
CONFIGURATION
--------------------------------------------------------------------------------

Edit .env file to customize:

  SIGNAL_NUMBER        Your Signal phone number (required)
                       Format: +911234567890 (international)

  RATE_LIMIT_DELAY_MS  Delay between messages in milliseconds
                       Default: 1000 (1 second)
                       Increase if you get rate limited

  PORT                 Wrapper API port
                       Default: 3000

  SIGNAL_API_URL       Signal CLI API URL (don't change)
                       Default: http://signal-api:8080

After changing .env, restart the wrapper:
  docker-compose restart wrapper

--------------------------------------------------------------------------------
DOCKER COMMANDS
--------------------------------------------------------------------------------

Start services:
  docker-compose up -d

Stop services:
  docker-compose down

Restart wrapper (after config changes):
  docker-compose restart wrapper

Rebuild wrapper (after code changes):
  docker-compose up -d --build wrapper

View wrapper logs:
  docker-compose logs -f wrapper

View Signal API logs:
  docker-compose logs -f signal-api

Check running containers:
  docker-compose ps

--------------------------------------------------------------------------------
LOGS
--------------------------------------------------------------------------------

Logs are stored in: wrapper/logs/

  combined.log   - All activity
  error.log      - Errors only
  messages.log   - Message send attempts

--------------------------------------------------------------------------------
SECURITY
--------------------------------------------------------------------------------

- API is bound to localhost (127.0.0.1) only
- Not accessible from other devices on your network
- Signal account data stored in signal-data/ (contains private keys!)
- Never share your .env file or signal-data/ folder

--------------------------------------------------------------------------------
TROUBLESHOOTING
--------------------------------------------------------------------------------

"Cannot connect to Signal API"
  - Check if containers are running: docker-compose ps
  - View logs: docker-compose logs signal-api

"SIGNAL_NUMBER not configured"
  - Set SIGNAL_NUMBER in .env file
  - Restart: docker-compose restart wrapper

"Failed to send message" to groups
  - Verify group ID format: must start with "group." (period)
  - Get correct ID: GET http://localhost:3000/groups
  - Use the "id" field from the response, not "internal_id"

Messages not sending
  - Check if Signal account is linked: try sending from your phone first
  - View logs: docker-compose logs -f wrapper

Rate limit errors
  - Increase RATE_LIMIT_DELAY_MS in .env (try 2000 or 3000)
  - Restart: docker-compose restart wrapper

Media not sending
  - Ensure file exists and is accessible
  - Check file size (max 100MB)
  - Check supported formats list above

--------------------------------------------------------------------------------
FILE STRUCTURE
--------------------------------------------------------------------------------

sigapi/
├── docker-compose.yml    Docker configuration
├── .env                  Your configuration (create from .env.example)
├── .env.example          Configuration template
├── .gitignore            Git ignore rules
├── SETUP.txt             This file
├── signal-data/          Signal account data (auto-created)
└── wrapper/
    ├── Dockerfile        Container build file
    ├── package.json      Node.js dependencies
    ├── logs/             Log files
    └── src/
        ├── index.js      Main server
        ├── config.js     Configuration
        ├── routes/
        │   ├── send.js      /send endpoint
        │   ├── groups.js    /groups endpoint
        │   ├── receive.js   /receive endpoint
        │   ├── contacts.js  /contacts endpoint
        │   └── qrcode.js    /qrcode endpoint
        ├── services/
        │   └── signal.js Signal API client
        └── utils/
            ├── logger.js   Logging
            └── throttle.js Rate limiting

--------------------------------------------------------------------------------
POSTMAN COLLECTION CHEAT SHEET
--------------------------------------------------------------------------------

1. HEALTH CHECK
   GET http://localhost:3000/health

2. SEND TEXT (JSON)
   POST http://localhost:3000/send
   Headers: Content-Type: application/json
   Body: {"recipients": ["+91..."], "message": "Hello!"}

3. SEND MEDIA (form-data)
   POST http://localhost:3000/send
   Body: form-data
     - recipients (Text): ["+91..."]
     - message (Text): Your message
     - media (File): Select file

4. LIST GROUPS
   GET http://localhost:3000/groups

5. CREATE GROUP
   POST http://localhost:3000/groups
   Headers: Content-Type: application/json
   Body: {"name": "Group Name", "members": ["+91..."]}

6. SEND TO GROUP
   POST http://localhost:3000/send
   Body: {"recipients": ["group.ID..."], "message": "Hello group!"}

7. GET INCOMING MESSAGES
   GET http://localhost:3000/receive

8. LIST CONTACTS
   GET http://localhost:3000/contacts

9. GET QR CODE LINK
   GET http://localhost:3000/qrcode?device_name=my-device

================================================================================
