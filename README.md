## LifeAdmin MVP

An agentic, chat-first personal task assistant. Users interact via WhatsApp and Telegram. The system orchestrates specialized agents (Task, Websearch, Response, Composio Email, etc.), persists tasks/reminders in Supabase, observes with Langfuse, and caches context with Redis.

## Quick Start

### Prerequisites
- Node 18+ / npm
- Supabase project (Postgres + anon/service keys)
- Redis instance
- Vercel (optional, for deployment)
- Accounts/credentials for external providers you use (WhatsApp Business Cloud API, Telegram Bot, Composio)

### Setup
1) Install dependencies
```bash
npm i
```

2) Environment variables (.env)
```env
# Server
PORT=4000
NODE_ENV=development

# WhatsApp Business Cloud
WA_URL=https://graph.facebook.com/v21.0
WA_PHONE_ID=your_phone_number_id
WA_TOKEN=your_wa_access_token

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
# Optional: restrict bot to a single user id
ALLOWED_TELEGRAM_ID=123456789

## Integrations

### WhatsApp Integration
The application supports WhatsApp Business API integration for task management.

### Telegram Integration
The application now supports Telegram Bot API integration. See [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md) for detailed setup instructions.

**Quick Setup:**
1. Create a Telegram bot with @BotFather
2. Add `TELEGRAM_BOT_TOKEN=your_bot_token` to your `.env` file
3. Set the webhook URL: `https://your-domain.com/api/telegram`
4. Test the integration with the provided test script

**Test the integration:**
```bash
npm run test:telegram
```

