================================================================================
              SigAPI - ARCHITECTURE OVERVIEW
================================================================================

This document explains what this project is, why it exists, and how it works.

--------------------------------------------------------------------------------
WHAT IS THIS?
--------------------------------------------------------------------------------

This is a Node.js wrapper API that sits on top of signal-cli-rest-api to make
sending Signal messages easier and safer.

signal-cli-rest-api (by bbernhard on GitHub) is a powerful but low-level API.
SigAPI adds convenience features for the common use case of "send messages."

--------------------------------------------------------------------------------
WHY DOES THIS WRAPPER EXIST?
--------------------------------------------------------------------------------

The original signal-cli-rest-api:
  - Has 20+ endpoints (complex for simple use cases)
  - Requires base64-encoded attachments (manual conversion)
  - Has no rate limiting (risk of getting blocked by Signal)
  - Returns minimal responses

SigAPI adds:
  - Simplified endpoints for common operations
  - Direct file uploads (auto-converts to base64)
  - Built-in rate limiting (1 message/second)
  - Detailed responses with job tracking
  - Comprehensive logging
  - Group management (list, create)
  - Message receiving
  - Contact management
  - Device linking via QR codes

--------------------------------------------------------------------------------
SYSTEM ARCHITECTURE
--------------------------------------------------------------------------------

                    ┌─────────────────────────────────────────────────────────┐
                    │                    Docker Network                       │
                    │                                                         │
  ┌──────────┐      │   ┌───────────────────┐      ┌────────────────────┐    │
  │          │      │   │                   │      │                    │    │
  │  Your    │ ────────►│  SigAPI     │─────►│  signal-cli-rest   │────────► Signal
  │  App     │      │   │  (Port 3000)      │      │  -api (Port 8080)  │    │    Servers
  │          │      │   │                   │      │                    │    │
  └──────────┘      │   │  - Rate limiting  │      │  - Signal protocol │    │
   (Postman,        │   │  - File handling  │      │  - Account mgmt    │    │
    curl, etc)      │   │  - Logging        │      │  - Encryption      │    │
                    │   │  - Queue mgmt     │      │                    │    │
                    │   └───────────────────┘      └────────────────────┘    │
                    │         Node.js                      Go                │
                    │                                                         │
                    └─────────────────────────────────────────────────────────┘


  
  - Written in Node.js
  - Simplified API for sending messages
  - Handles file uploads, rate limiting, logging
  - This is what you call from your app

--------------------------------------------------------------------------------
REQUEST FLOW
--------------------------------------------------------------------------------

When you send a message, here's what happens:

1. YOUR APP sends POST /send to wrapper (port 3000)
   {
     "recipients": ["+1234567890", "group.abc..."],
     "message": "Hello!",
     "media": (optional file)
   }

2. WRAPPER receives the request
   └─► Validates input (recipients, message)
   └─► If media attached: converts file to base64
   └─► Adds request to rate-limited queue

3. QUEUE processes each recipient (1 per second)
   └─► Determines if recipient is user or group
   └─► Formats request for signal-cli-rest-api

4. WRAPPER calls signal-cli-rest-api (port 8080)
   └─► POST /v2/send with proper format
   └─► Handles response/errors

5. SIGNAL-CLI-REST-API sends to Signal servers
   └─► Encrypts message
   └─► Delivers to recipient

6. WRAPPER returns detailed response to your app
   {
     "success": true,
     "jobId": "job-123...",
     "summary": { "total": 2, "successful": 2, "failed": 0 },
     "results": [...]
   }

--------------------------------------------------------------------------------
FILE STRUCTURE EXPLAINED
--------------------------------------------------------------------------------

sigapi/
│
├── docker-compose.yml      # Defines both services (wrapper + signal-api)
│                           # Configures ports, volumes, environment
│
├── .env                    # Your configuration (Signal number, etc.)
│                           # Created from .env.example
│
├── .env.example            # Template showing required config
│
├── signal-data/            # Signal account data (created after linking)
│                           # Contains encryption keys - never share!
│
└── wrapper/                # The Node.js wrapper application
    │
    ├── Dockerfile          # How to build SigAPI container
    │
    ├── package.json        # Node.js dependencies
    │
    ├── logs/               # Log files (created at runtime)
    │   ├── combined.log    # All logs
    │   ├── error.log       # Errors only
    │   └── messages.log    # Message send attempts
    │
    └── src/                # Source code
        │
        ├── index.js        # Entry point - Express server setup
        │                   # Configures routes, middleware, error handling
        │
        ├── config.js       # Reads environment variables
        │                   # Exports configuration object
        │
        ├── routes/
        │   ├── send.js     # POST /send endpoint
        │   │               # Parses request, queues messages, returns results
        │   ├── groups.js   # GET/POST /groups endpoint
        │   │               # List and create groups
        │   ├── receive.js  # GET /receive endpoint
        │   │               # Get incoming messages
        │   ├── contacts.js # GET /contacts endpoint
        │   │               # List contacts
        │   └── qrcode.js   # GET /qrcode endpoint
        │                   # Get QR code link for device linking
        │
        ├── services/
        │   └── signal.js   # Communicates with signal-cli-rest-api
        │                   # sendToUser(), sendToGroup(), fileToBase64()
        │                   # getGroups(), createGroup(), receive()
        │                   # getContacts(), getQRCodeLink()
        │
        └── utils/
            ├── logger.js   # Winston logger configuration
            │               # Writes to console and log files
            │
            └── throttle.js # p-queue rate limiting
                            # Ensures 1 message per second max

--------------------------------------------------------------------------------
KEY DESIGN DECISIONS
--------------------------------------------------------------------------------

1. WHY p-queue FOR RATE LIMITING?
   Signal has undocumented rate limits. Sending too fast can get your account
   temporarily blocked. p-queue ensures messages are spaced out safely.

2. WHY AUTO-CONVERT FILES TO BASE64?
   signal-cli-rest-api only accepts base64 strings for attachments.
   Manual conversion is tedious. Wrapper handles it automatically.

3. WHY ACCEPT BOTH "group." AND "group:" PREFIXES?
   signal-cli-rest-api returns group IDs with "group." prefix.
   Users might type "group:" by mistake. Wrapper accepts both.

4. WHY LOCALHOST-ONLY BINDING?
   Security. The API can send messages as your Signal account.
   Binding to 127.0.0.1 prevents network access.

5. WHY SEPARATE WRAPPER FROM SIGNAL-API?
   Separation of concerns. signal-cli-rest-api handles Signal protocol.
   Wrapper handles UX improvements. Either can be updated independently.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Node.js packages (in wrapper/package.json):

  express       Web framework for the API
  axios         HTTP client to call signal-cli-rest-api
  multer        Handles file uploads
  winston       Logging library
  p-queue       Rate limiting queue
  form-data     Multipart form handling

External:

  signal-cli-rest-api   Docker image from bbernhard/signal-cli-rest-api
                        Handles actual Signal communication

--------------------------------------------------------------------------------
PORTS REFERENCE
--------------------------------------------------------------------------------

  Port 3000    SigAPI API (call this from your app)
  Port 8080    signal-cli-rest-api (wrapper calls this internally)

Both are bound to 127.0.0.1 (localhost only) for security.

--------------------------------------------------------------------------------
CONFIGURATION
--------------------------------------------------------------------------------

All configuration via environment variables in .env file:

  SIGNAL_NUMBER         Your Signal phone number (+1234567890)
  RATE_LIMIT_DELAY_MS   Milliseconds between messages (default: 1000)
  PORT                  Wrapper API port (default: 3000)
  SIGNAL_API_URL        Signal API URL (default: http://signal-api:8080)

--------------------------------------------------------------------------------
EXTENDING THIS PROJECT
--------------------------------------------------------------------------------

To add new features:

1. New endpoint?
   └─► Add route in wrapper/src/routes/
   └─► Register in wrapper/src/index.js

2. New Signal API call?
   └─► Add method in wrapper/src/services/signal.js

3. New configuration?
   └─► Add to wrapper/src/config.js
   └─► Document in .env.example

4. After changes:
   └─► docker-compose up -d --build wrapper

================================================================================

