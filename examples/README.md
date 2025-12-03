# SigAPI Examples

This folder contains example API calls for common use cases.

## Files

- **01-send-text.sh** - Send a simple text message
- **02-send-multiple.sh** - Send to multiple recipients
- **03-groups.sh** - List and create groups
- **04-receive.sh** - Get incoming messages
- **05-contacts.sh** - List contacts
- **06-health.sh** - Check API health

## Usage

1. Make sure SigAPI is running:
   ```bash
   docker-compose up -d
   ```

2. Make scripts executable:
   ```bash
   chmod +x examples/*.sh
   ```

3. Run any example:
   ```bash
   ./examples/01-send-text.sh
   ```

## Configuration

All examples use `http://localhost:3000` as the base URL.

If you're using a different URL (e.g., via zrok), update the `BASE_URL` variable in each script.

## Note

Replace `+1234567890` with actual phone numbers before running the examples.

