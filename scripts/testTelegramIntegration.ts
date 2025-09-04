#!/usr/bin/env node

/**
 * Telegram Integration Test Script
 * 
 * This script helps test the Telegram integration by simulating webhook calls
 * and checking the bot's responses.
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:4000/api/telegram';

if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
    process.exit(1);
}

async function testWebhookEndpoint() {
    console.log('🧪 Testing webhook endpoint...');
    
    const testPayload = {
        update_id: 123456789,
        message: {
            message_id: 123,
            date: Math.floor(Date.now() / 1000),
            chat: {
                id: 123456789,
                type: "private"
            },
            from: {
                id: 123456789,
                is_bot: false,
                first_name: "Test",
                last_name: "User"
            },
            text: "Hello, this is a test message"
        }
    };

    try {
        const response = await axios.post(WEBHOOK_URL, testPayload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Webhook endpoint test successful');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('❌ Webhook endpoint test failed');
        console.error('Error:', (error as any).response?.data || (error as any).message);
    }
}

async function testBotInfo() {
    console.log('🤖 Testing bot info...');
    
    try {
        const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
        
        console.log('✅ Bot info retrieved successfully');
        console.log('Bot:', response.data.result);
    } catch (error) {
        console.error('❌ Bot info test failed');
        console.error('Error:', (error as any).response?.data || (error as any).message);
    }
}

async function testWebhookStatus() {
    console.log('🔗 Testing webhook status...');
    
    try {
        const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
        
        console.log('✅ Webhook status retrieved successfully');
        console.log('Webhook Info:', response.data.result);
    } catch (error) {
        console.error('❌ Webhook status test failed');
        console.error('Error:', (error as any).response?.data || (error as any).message);
    }
}

async function setWebhook() {
    console.log('🔗 Setting webhook URL...');
    
    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
            url: WEBHOOK_URL
        });
        
        console.log('✅ Webhook set successfully');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('❌ Failed to set webhook');
        console.error('Error:', (error as any).response?.data || (error as any).message);
    }
}

async function runAllTests() {
    console.log('🚀 Starting Telegram integration tests...\n');
    
    await testBotInfo();
    console.log('');
    
    await testWebhookStatus();
    console.log('');
    
    await testWebhookEndpoint();
    console.log('');
    
    console.log('📝 To set the webhook URL, run:');
    console.log(`curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"url": "${WEBHOOK_URL}"}'`);
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

export { testWebhookEndpoint, testBotInfo, testWebhookStatus, setWebhook };
