### SETUP COMMANDS
1. npm i
2. npm run build 
3. npm start

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

