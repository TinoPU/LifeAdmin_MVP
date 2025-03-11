import { WAIncomingMessage } from "../types/incomingWAObject/WAIncomingMessage";
import supabase from "../database/supabaseClient";
import {Contact} from "../types/incomingWAObject/WAIncomingValueObject";
import {Message, wa_metadata} from "../types/message";

export async function storeWhatsAppMessage(message: WAIncomingMessage, user_id: string, actor:string, parent_message_id?: string, response?: string, response_sent_at?: string) {
    try {

        // 🌟 Construct base message object for storage
        const messageData:Message = {
            user_id: user_id,
            message: message.text?.body || "",
            message_sent_at: message.timestamp,
            response: response,
            actor: actor,
            parent_message_id: parent_message_id,
            response_sent_at: response_sent_at,
            type: message.type,
            wa_id: message.id,
        };

        // 🌟 Extract metadata (if available)
        const waMetadata: any  = {
            context: message.context,
            errors: message.errors,
            referral: message.referral,
            interactive: message.interactive,
            system: message.system,
            identity: message.identity,
        };

        const mediaTypes = ["audio", "document", "image", "sticker", "video"] as const;
        type MediaType = (typeof mediaTypes)[number]; // "audio" | "document" | "image" | "sticker" | "video"

        function isMediaType(type: string): type is MediaType {
            return mediaTypes.includes(type as MediaType);
        }

        let mediaData = null;
        if (message.type && isMediaType(message.type)) {
            // Now TypeScript knows message.type is a MediaType.
            const mediaObj = message[message.type] as
                | { id?: string; mime_type?: string; sha256?: string; caption?: string }
                | undefined;

            if (mediaObj) {
                mediaData = {
                    type: message.type,
                    media_id: mediaObj.id || null,
                    mime_type: mediaObj.mime_type || null,
                    sha256: mediaObj.sha256 || null,
                    caption: mediaObj.caption || null,
                    filename: message.type === "document" ? message.document?.filename || null : null,
                    animated: message.type === "sticker" ? message.sticker?.animated || null : null,
                };
            }
        }


        // 🌟 Insert message into `messages` table
        const { data, error: msgError } = await supabase
            .from("messages")
            .insert([messageData])
            .select("id")
            .single();
        if (msgError) console.log(msgError.message)

        if (!data)
        {
            console.error("❌ Error storing WhatsApp message: data: ", data);
            return
        }

        const message_id = data.id;

        // Merge the original waMetadata with the message_id property
        const waMetadataToInsert = {
            ...waMetadata,
            message_id: message_id,
        };

        const { error: metadataError } = await supabase
            .from("wa_metadata")
            .insert(waMetadataToInsert);
        if (metadataError) console.log(metadataError.message)

        // 🌟 Insert media into `wa_media` table (if applicable)
        if (mediaData) {
            const mediaDataToInsert = {
                ...mediaData,
                message_id: message_id,
            };

            const { error: mediaError } = await supabase
                .from("media")
                .insert(mediaDataToInsert);
            if (mediaError) console.log(mediaError.message)

        }

        console.log(`✅ Successfully stored WA message ${message_id}`);
    } catch (error) {
        console.error("❌ Error storing WhatsApp message:", error);
        throw error;
    }
}

export async function createNewUser(contact: Contact, phone_number_id: string) {
    const user = {
        phone_number_id: phone_number_id,
        wa_id: contact.wa_id,
        name: contact.profile.name
    }
    const {data, error} = await supabase.from("users").insert([user]).select("id").single();
    console.log("Tried to create user: ", data)

    if (error) {
        throw new Error("Failed to create new user");
    }

    return data.id
}