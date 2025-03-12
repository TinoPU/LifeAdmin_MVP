import {WAIncomingObject} from "../types/incomingWAObject/WAIncomingObject";
import {fetchUserId} from "../utils/userUtils";
import {cacheWhatsappMessage} from "../utils/redisActions";
import {storeWhatsAppMessage} from "../utils/supabaseActions";
import {AgentManager} from "../assistant/agentManager";

export const handleIncomingWebhook = async (payload: WAIncomingObject) => {
    const messageObject = payload.entry[0].changes[0].value.messages[0]
    const user_id = await fetchUserId(payload.entry[0].changes[0].value.contacts[0])

    if (messageObject.text) {
        // await cacheWhatsappMessage(user_id, "user", messageObject.text?.body, messageObject.timestamp)
        const agentManager = new AgentManager();
        const response_message = await agentManager.handleNewRequest(user_id, messageObject)
        const timeNow = new Date().toISOString();
        await cacheWhatsappMessage(user_id, "agent", response_message, timeNow)
        await storeWhatsAppMessage(messageObject, user_id, "user", response_message, timeNow)
    }
}




