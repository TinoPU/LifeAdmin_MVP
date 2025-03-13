import {WAIncomingObject} from "../types/incomingWAObject/WAIncomingObject";
import {fetchUserId} from "../utils/userUtils";
import {cacheWhatsappMessage} from "../utils/redisActions";
import {getUser, storeWhatsAppMessage} from "../utils/supabaseActions";
import {AgentManager} from "../assistant/agentManager";
import {Reminder, SupabaseDueWebhook, Task, User} from "../types/db";

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
    if (data.payload?.user_id) {
        const user: User = await getUser(data.payload.user_id)
    }

    if (data.payload_type === "reminder") {
        const payload: Reminder  = data.payload as Reminder
    }

    if (data.payload_type === "task") {
        const payload: Task  = data.payload as Task
    }

}



