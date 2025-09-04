import {TelegramIncomingObject, TelegramMessage, TelegramUser} from "../types/telegram/TelegramIncomingObject";
import {fetchUser, getUserByTelegramId} from "../utils/userUtils";
import {cacheLatestUserMessage, cacheTelegramMessage} from "../utils/redisActions";
import {getTask, getUser, storeTelegramMessage, createNewTelegramUser} from "../utils/supabaseActions";
import {AgentManager} from "../assistant/agentManager";
import {Reminder, SupabaseDueWebhook, Task, User} from "../types/db";
import {generateReminderMessage} from "./llmService";
import sendTelegramMessage from "./telegramMessageService";
import conversationService from "./conversationService";
import {baseLogger, initLogger} from "./loggingService";

export const handleIncomingTelegramWebhook = async (payload: TelegramIncomingObject) => {
    // Handle different types of updates
    if (payload.message) {
        await handleTelegramMessage(payload.message);
    } else if (payload.callback_query) {
        await handleTelegramCallbackQuery(payload.callback_query);
    }
    // Add other update types as needed (edited_message, channel_post, etc.)
};

const handleTelegramMessage = async (message: TelegramMessage) => {
    // Only process text messages for now
    if (!message.text || !message.from || message.chat.type !== "private") {
        return;
    }

    const telegramUser: TelegramUser = message.from;
    const user: User = await fetchTelegramUser(telegramUser);
    const logger = initLogger(user);
    
    logger.info("Telegram Webhook received", {
        messageId: message.message_id,
        text: message.text,
        chatId: message.chat.id,
        userId: telegramUser.id
    });

    // Skip processing for specific commands
    if (message.text === "/start" || message.text === "/help") {
        await sendTelegramMessage(message.chat.id, "Hi! I'm your LifeAdmin assistant. Send me tasks and I'll help you manage them!", logger, "Command Response");
        return;
    }

    const parent_message_id = await storeTelegramMessage(message, user, "user");
    logger.info("Stored incoming Telegram message");
    
    await cacheLatestUserMessage(user, message.text);
    
    const agentManager = new AgentManager();
    await agentManager.handleNewTelegramRequest(user, parent_message_id, message, logger);
    
    logger.info("Telegram message processed", message);
};

const handleTelegramCallbackQuery = async (callbackQuery: any) => {
    // Handle inline keyboard button presses
    if (!callbackQuery.from || !callbackQuery.data) {
        return;
    }

    const telegramUser: TelegramUser = callbackQuery.from;
    const user: User = await fetchTelegramUser(telegramUser);
    const logger = initLogger(user);

    logger.info("Telegram callback query received", {
        callbackQueryId: callbackQuery.id,
        data: callbackQuery.data,
        userId: telegramUser.id
    });

    // Process the callback data
    // You can implement specific actions based on the callback data
    // For example: "complete_task_123", "delete_task_456", etc.
    
    // For now, just acknowledge the callback
    await sendTelegramMessage(callbackQuery.message.chat.id, "Action processed!", logger, "Callback Response");
};

const fetchTelegramUser = async (telegramUser: TelegramUser): Promise<User> => {
    // Check if user exists in database
    let user = await getUserByTelegramId(telegramUser.id.toString());
    
    if (!user) {
        // Create new user
        user = await createNewTelegramUser(telegramUser);
    }
    
    return user!;
};

export const handleIncomingSupabaseWebhookForTelegram = async (data: SupabaseDueWebhook) => {
    try {
        if (!data.payload.user_id) {
            throw new Error("No user_id in payload");
        }
        const user: User = await getUser(data.payload.user_id);
        if (!user || !user.telegram_id) throw new Error("User not found");

        const logger = initLogger(user);

        let task: Task;
        if (data.payload_type === "reminder") {
            task = await getTask((data.payload as Reminder).task_id);
        } else if (data.payload_type === "task") {
            task = data.payload as Task;
        } else {
            throw new Error("Invalid payload type");
        }

        const history = await conversationService.getRecentMessages(data.payload.user_id);

        // Format time for user
        task.due_date = new Date(new Date(task.due_date).getTime() + (user.user_timezone || 1) * 60 * 60 * 1000).toISOString();

        const response_message = await generateReminderMessage(task, user, history) || "You have a task due!";
        await sendTelegramMessage(parseInt(user.telegram_id), response_message, logger, "Reminder Webhook");
        
        const timeNow = new Date().toISOString();
        await cacheTelegramMessage(user, "agent", response_message, timeNow);
    } catch (error) {
        console.error("Error handling Telegram webhook:", error);
        throw error;
    }
};
