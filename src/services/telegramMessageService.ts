import axios from "axios";
import dotenv from "dotenv";

dotenv.config()

export const sendTelegramMessage = async (chatId: number, messageBody: string, logger: any, source: string) => {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

    const url = `${BASE_URL}/sendMessage`;

    const payload = {
        chat_id: chatId,
        text: messageBody,
        parse_mode: "HTML" // Optional: supports HTML formatting
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        logger.info("Telegram Message sent", {
            messageBody: messageBody, 
            responseData: response.data, 
            source: source,
            chatId: chatId
        });
        return response.data;
    } catch (error) {
        console.error("❌ Error sending Telegram message:", (error as any).response?.data || (error as any).message);
        throw error;
    }
};

export const sendTelegramMessageWithKeyboard = async (
    chatId: number, 
    messageBody: string, 
    keyboard: any, 
    logger: any, 
    source: string
) => {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

    const url = `${BASE_URL}/sendMessage`;

    const payload = {
        chat_id: chatId,
        text: messageBody,
        parse_mode: "HTML",
        reply_markup: keyboard
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        logger.info("Telegram Message with keyboard sent", {
            messageBody: messageBody, 
            responseData: response.data, 
            source: source,
            chatId: chatId
        });
        return response.data;
    } catch (error) {
        console.error("❌ Error sending Telegram message with keyboard:", (error as any).response?.data || (error as any).message);
        throw error;
    }
};

export const answerCallbackQuery = async (callbackQueryId: string, text?: string, logger?: any) => {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

    const url = `${BASE_URL}/answerCallbackQuery`;

    const payload: any = {
        callback_query_id: callbackQueryId
    };

    if (text) {
        payload.text = text;
    }

    try {
        const response = await axios.post(url, payload, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (logger) {
            logger.info("Callback query answered", {
                callbackQueryId: callbackQueryId,
                responseData: response.data
            });
        }
        return response.data;
    } catch (error) {
        console.error("❌ Error answering callback query:", (error as any).response?.data || (error as any).message);
        throw error;
    }
};

export default sendTelegramMessage;
