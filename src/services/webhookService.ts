import {WAIncomingObject} from "../types/incomingWAObject/WAIncomingObject";
import {fetchUserId} from "../utils/userUtils";
import {cacheWhatsappMessage} from "../utils/redisActions";
import {getTask, getUser, storeWhatsAppMessage} from "../utils/supabaseActions";
import {AgentManager} from "../assistant/agentManager";
import {Reminder, SupabaseDueWebhook, Task, User} from "../types/db";
import {generateReminderMessage} from "./llmService";
import sendMessage from "./messageService";

export const handleIncomingWAWebhook = async (payload: WAIncomingObject) => {
    const messageObject = payload.entry[0].changes[0].value.messages[0]
    const user_id = await fetchUserId(payload.entry[0].changes[0].value.contacts[0])

    if (messageObject.text) {
        // await cacheWhatsappMessage(user_id, "user", messageObject.text?.body, messageObject.timestamp)
        const parent_message_id = await storeWhatsAppMessage(messageObject, user_id, "user")
        const agentManager = new AgentManager();
        const response_message = await agentManager.handleNewRequest(user_id, parent_message_id, messageObject)
        const timeNow = new Date().toISOString();
        await cacheWhatsappMessage(user_id, "agent", response_message, timeNow)
    }
}


export const handleIncomingSupabaseWebhook = async (data: SupabaseDueWebhook) => {
    try {
        if (!data.payload.user_id) {
            throw new Error("No user_id in payload");
        }
        const user: User = await getUser(data.payload.user_id);
        if (!user || !user.wa_id) throw new Error("User not found");

        let task: Task;
        if (data.payload_type === "reminder") {
            task = await getTask((data.payload as Reminder).task_id);
        } else if (data.payload_type === "task") {
            task = data.payload as Task;
        } else {
            throw new Error("Invalid payload type");
        }

        const response_message = await generateReminderMessage(task) || "irgendwas steht noch an";
        await sendMessage(user.wa_id, response_message);
    } catch (error) {
        console.error("Error handling webhook:", error);
        throw error;
    }
};



