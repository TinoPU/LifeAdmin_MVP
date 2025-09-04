# Telegram Integration Setup Guide

## Overview
This guide will help you set up Telegram integration for your LifeAdmin MVP. The integration allows users to interact with your task management system through Telegram messages.

## Prerequisites
1. A Telegram Bot Token (get from @BotFather)
2. Your application deployed and accessible via HTTPS
3. Supabase database with the updated schema

## Environment Variables
Add these to your `.env` file:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

## Database Schema Updates
Make sure your `users` table has a `telegram_id` column:

```sql
ALTER TABLE users ADD COLUMN telegram_id TEXT;
```

## Setting Up the Telegram Bot

### 1. Create a Bot with BotFather
1. Open Telegram and search for @BotFather
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Save the bot token provided

### 2. Set Webhook URL
Once your application is deployed, set the webhook URL:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/api/telegram"}'
```

### 3. Test the Integration
1. Start a conversation with your bot
2. Send `/start` to get a welcome message
3. Send a task request like "Remind me to buy groceries tomorrow at 5pm"

## API Endpoints

### POST /api/telegram
Receives webhook updates from Telegram Bot API.

**Request Body:**
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 123,
    "date": 1640995200,
    "chat": {
      "id": 123456789,
      "type": "private"
    },
    "from": {
      "id": 123456789,
      "is_bot": false,
      "first_name": "John",
      "last_name": "Doe"
    },
    "text": "Remind me to buy groceries tomorrow"
  }
}
```

### GET /api/telegram
Health check endpoint to verify the service is running.

## Features

### Supported Commands
- `/start` - Welcome message and bot introduction
- `/help` - Help information

### Task Management
Users can send natural language requests like:
- "Remind me to buy groceries tomorrow at 5pm"
- "Create a task to call mom on Friday"
- "Set a reminder for my dentist appointment next week"

### Inline Keyboards
The bot supports interactive buttons for:
- Task completion
- Task deletion
- Reminder management

## Error Handling
- Invalid messages are logged but don't crash the system
- User creation failures are handled gracefully
- Network errors are caught and logged

## Monitoring
All Telegram interactions are logged with:
- User ID and chat ID
- Message content
- Processing status
- Error details

## Security Considerations
1. Always use HTTPS for webhook URLs
2. Validate incoming webhook data
3. Rate limit webhook endpoints if needed
4. Monitor for spam or abuse

## Troubleshooting

### Common Issues

1. **Webhook not receiving updates**
   - Check if the webhook URL is set correctly
   - Verify your server is accessible via HTTPS
   - Check server logs for errors

2. **Bot not responding**
   - Verify TELEGRAM_BOT_TOKEN is set correctly
   - Check if the bot has permission to send messages
   - Review application logs for errors

3. **Database errors**
   - Ensure the `telegram_id` column exists in the users table
   - Check database connection and permissions

### Debug Commands
```bash
# Check webhook status
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# Get bot info
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"
```
