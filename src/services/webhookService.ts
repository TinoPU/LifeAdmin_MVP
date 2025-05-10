import {WAIncomingObject} from "../types/incomingWAObject/WAIncomingObject";
import {fetchUserId} from "../utils/userUtils";
import {cacheLatestUserMessage, cacheWhatsappMessage} from "../utils/redisActions";
import {getTask, getUser, storeWhatsAppMessage} from "../utils/supabaseActions";
import {AgentManager} from "../assistant/agentManager";
import {Reminder, SupabaseDueWebhook, Task, User} from "../types/db";
import {generateReminderMessage} from "./llmService";
import sendMessage from "./messageService";
import conversationService from "./conversationService";
import {baseLogger, initLogger} from "./loggingService";

export const handleIncomingWAWebhook = async (payload: WAIncomingObject) => {
    const messageObject = payload.entry[0].changes[0].value.messages[0]
    const user: User = await fetchUserId(payload.entry[0].changes[0].value.contacts[0])
    const logger = initLogger(user)
    logger.info("WA Webhook received", messageObject)

    if (messageObject.text) {
        if (messageObject.text.body === "active") {
            await baseLogger.info("active message received. flow skipped.", {user: user})
            return
        }
        const parent_message_id = await storeWhatsAppMessage(messageObject, user, "user")
        await cacheLatestUserMessage(user,messageObject.text.body)
        const agentManager = new AgentManager();
        const response_message = await agentManager.handleNewRequest(user, parent_message_id, messageObject, logger)
        const timeNow = new Date().toISOString();
        await cacheWhatsappMessage(user, "agent", response_message, timeNow)
    }
}


export const handleIncomingSupabaseWebhook = async (data: SupabaseDueWebhook) => {
    try {
        if (!data.payload.user_id) {
            throw new Error("No user_id in payload");
        }
        const user: User = await getUser(data.payload.user_id);
        if (!user || !user.wa_id) throw new Error("User not found");

        const logger = initLogger(user)

        let task: Task;
        if (data.payload_type === "reminder") {
            task = await getTask((data.payload as Reminder).task_id);
        } else if (data.payload_type === "task") {
            task = data.payload as Task;
        } else {
            throw new Error("Invalid payload type");
        }

        const history = await conversationService.getRecentMessages(data.payload.user_id);

        //format time for user
        task.due_date = new Date(new Date(task.due_date).getTime() + (user.user_timezone || 1) * 60 * 60 * 1000).toISOString();

        const response_message = await generateReminderMessage(task, user, history) || "irgendwas steht noch an";
        await sendMessage(user.wa_id, response_message, logger, "Reminder Webhook");
        const timeNow = new Date().toISOString();
        await cacheWhatsappMessage(user, "agent", response_message,timeNow)
    } catch (error) {
        console.error("Error handling webhook:", error);
        throw error;
    }
};



