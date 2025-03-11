import {WAIncomingObject} from "../types/incomingWAObject/WAIncomingObject";
import {fetchUserId} from "../utils/userUtils";
import {cacheWhatsappMessage} from "../utils/redisActions";
import ConversationService from "./conversationService";
import {storeWhatsAppMessage} from "../utils/supabaseActions";
import sendMessage from "./messageService";

export const handleIncomingWebhook = async (payload: WAIncomingObject) => {
    const messageObject = payload.entry[0].changes[0].value.messages[0]
    const user_id = await fetchUserId(payload.entry[0].changes[0].value.contacts[0], payload.entry[0].changes[0].value.metadata.phone_number_id)

    if (messageObject.text) {
        await cacheWhatsappMessage(user_id, "user", messageObject.text?.body, messageObject.timestamp)
        console.log("cached message: ", messageObject.text)
        const response_message = await ConversationService.generateResponse(user_id) || "Sorry ich kann grad nicht. 🤒"
        await sendMessage(messageObject.from, response_message)
        const timeNow = new Date().toISOString();
        await cacheWhatsappMessage(user_id, "agent", response_message, timeNow)
        console.log("cached message: ", messageObject.text)
        await storeWhatsAppMessage(messageObject, user_id, "user", response_message, timeNow)
    }
}




