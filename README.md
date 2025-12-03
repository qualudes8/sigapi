# SigAPI

A production-ready REST API wrapper for Signal messaging that simplifies sending messages, managing groups, and automating Signal interactions.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is SigAPI?

SigAPI is a Node.js wrapper around [signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) that provides:

- **Simple REST API** - Easy-to-use endpoints for common Signal operations
- **Rate Limiting** - Built-in protection against Signal rate limits (1 msg/sec)
- **File Uploads** - Direct file uploads with automatic base64 conversion
- **Group Management** - Create and manage Signal groups via API
- **Message Receiving** - Read incoming messages programmatically
- **Comprehensive Logging** - Track all activity with detailed logs
- **Docker Ready** - Complete Docker Compose setup for easy deployment

Perfect for automation, bots, notifications, customer support, and integrations.

## Features

- ✅ Send text messages to individuals and groups
- ✅ Send media (images, videos, audio, documents)
- ✅ Create and list groups
- ✅ Receive incoming messages
- ✅ List contacts
- ✅ Device linking via QR codes
- ✅ Rate limiting and queue management
- ✅ Batch sending to multiple recipients
- ✅ Detailed response tracking with job IDs

For a complete feature list, see [FEATURES.txt](FEATURES.txt)

## Quick Start

### Prerequisites

- Docker & Docker Compose
- A Signal phone number (for linking)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/qualudes8/sigapi.git
   cd sigapi
   ```

2. **Configure your Signal number**
   ```bash
   cp .env.example .env
   # Edit .env and set SIGNAL_NUMBER=+1234567890
   ```

3. **Start the services**
   ```bash
   docker-compose up -d
   ```

4. **Link your Signal account**
   
   Open http://localhost:8080/v1/qrcodelink?device_name=signal-api
   
   Scan the QR code with Signal app (Settings → Linked Devices → +)

5. **Test the API**
   ```bash
   curl -X POST http://localhost:3000/send \
     -H "Content-Type: application/json" \
     -d '{"recipients": ["+1234567890"], "message": "Hello from SigAPI!"}'
   ```

That's it! Your Signal messaging API is ready.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send` | Send messages (text + media) |
| GET | `/health` | API health check |
| GET | `/status` | Queue status and config |
| GET | `/groups` | List all groups |
| POST | `/groups` | Create a new group |
| GET | `/receive` | Get incoming messages |
| GET | `/contacts` | List contacts |
| GET | `/qrcode` | Get QR code for linking devices |

## Usage Examples

### Send a Text Message

```bash
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["+1234567890"],
    "message": "Hello from SigAPI!"
  }'
```

### Send to Multiple Recipients

```bash
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["+1111111111", "+2222222222", "group.abc123..."],
    "message": "Hello everyone!"
  }'
```

### List Groups

```bash
curl http://localhost:3000/groups
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "groups": [
    {
      "id": "group.Z3VCOWY0SjFtNzJO...",
      "name": "My Group",
      "memberCount": 5
    }
  ]
}
```

### Create a Group

```bash
curl -X POST http://localhost:3000/groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Project Team",
    "members": ["+1234567890", "+0987654321"]
  }'
```

### Get Incoming Messages

```bash
curl http://localhost:3000/receive
```

More examples in the [examples/](examples/) folder.

## Configuration

Edit the `.env` file to customize:

| Variable | Description | Default |
|----------|-------------|---------|
| `SIGNAL_NUMBER` | Your Signal phone number (required) | - |
| `RATE_LIMIT_DELAY_MS` | Delay between messages (ms) | 1000 |
| `PORT` | API port | 3000 |
| `SIGNAL_API_URL` | Signal CLI API URL | http://signal-api:8080 |

After changing configuration:
```bash
docker-compose restart sigapi
```

## Documentation

- **[Setup Guide](docs/SETUP.md)** - Detailed setup and usage guide
- **[Features](docs/FEATURES.md)** - Complete feature documentation
- **[Architecture](docs/ARCHITECTURE.md)** - Technical architecture overview

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f sigapi

# Rebuild after code changes
docker-compose up -d --build sigapi

# Check status
docker-compose ps
```

## Project Structure

```
sigapi/
├── .github/                # GitHub configuration
├── api/                    # Main application
│   ├── Dockerfile         # Container build file
│   ├── package.json       # Node.js dependencies
│   ├── logs/              # Log files
│   └── src/
│       ├── index.js       # Main server
│       ├── config.js      # Configuration
│       ├── routes/        # API endpoints
│       ├── services/      # Signal API client
│       └── utils/         # Logging & rate limiting
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md    # Technical overview
│   ├── FEATURES.md        # Feature documentation
│   └── SETUP.md           # Setup guide
├── examples/               # Example scripts
├── signal-data/            # Signal account data (auto-created)
├── .dockerignore          # Docker ignore rules
├── .env                    # Your configuration
├── .env.example           # Configuration template
├── .gitignore             # Git ignore rules
├── docker-compose.yml     # Docker configuration
├── LICENSE                # MIT License
└── README.md              # This file
```

## Security

- **Localhost binding:** API is bound to `127.0.0.1` (localhost only)
- **Private keys:** Signal data stored in `signal-data/` (gitignored)
- **Environment variables:** Sensitive config in `.env` (gitignored)
- **Docker isolation:** Services run in isolated containers

**⚠️ Never share:**
- Your `.env` file
- The `signal-data/` folder
- Your QR codes or linking URLs

## Logs

Logs are stored in `api/logs/`:

- `combined.log` - All activity
- `error.log` - Errors only
- `messages.log` - Message send attempts and results

View logs:
```bash
# Real-time logs
docker-compose logs -f sigapi

# Or check log files
tail -f api/logs/messages.log
```

## Troubleshooting

**"Cannot connect to Signal API"**
- Check containers are running: `docker-compose ps`
- View logs: `docker-compose logs signal-api`

**"SIGNAL_NUMBER not configured"**
- Set `SIGNAL_NUMBER` in `.env`
- Restart: `docker-compose restart sigapi`

**Messages not sending**
- Ensure Signal account is linked (scan QR code)
- Check logs: `docker-compose logs -f sigapi`

**Rate limit errors**
- Increase `RATE_LIMIT_DELAY_MS` in `.env` (try 2000 or 3000)
- Restart: `docker-compose restart sigapi`

See [Setup Guide](docs/SETUP.md) for more troubleshooting tips.

## Use Cases

- 🤖 **Chatbots** - Build Signal bots for automation
- 📢 **Notifications** - Send alerts and updates
- 🎫 **Customer Support** - Integrate with support systems
- 📊 **Monitoring** - Send system alerts
- 🔔 **Reminders** - Automated reminder systems
- 👥 **Group Management** - Manage Signal groups programmatically

## Tech Stack

- **Node.js 18** - Runtime
- **Express** - Web framework
- **Docker** - Containerization
- **signal-cli-rest-api** - Signal protocol implementation
- **Winston** - Logging
- **p-queue** - Rate limiting
- **Axios** - HTTP client

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Qualudes**

## Acknowledgments

- [signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) by bbernhard - The underlying Signal API implementation
- [Signal](https://signal.org/) - The Signal messaging protocol

## Support

If you find this project useful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🔀 Contributing code

---

**Note:** This is an unofficial API wrapper. Signal does not have an official public API. Use responsibly and respect Signal's terms of service.

