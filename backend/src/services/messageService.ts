import axios from "axios";
import dotenv from "dotenv";

dotenv.config()

export const sendMessage = async (toPhoneNumber: string, messageBody: string) => {
    const BASEURL = process.env.WA_URL; // Update with the correct API version
    const FROM_PHONE_NUMBER_ID = process.env.WA_PHONE_ID; // Replace with your WhatsApp business phone ID
    const ACCESS_TOKEN = process.env.WA_TOKEN; // Store in .env for security

    const url = `${BASEURL}/${FROM_PHONE_NUMBER_ID}/messages`;

    const payload = {
        messaging_product: "whatsapp",
        to: toPhoneNumber,
        type: "text",
        text: {
            body: messageBody,
        },
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
        });

        console.log("✅ Message sent:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error sending WhatsApp message:", (error as any).response?.data || (error as any).message);
        throw error;
    }
};

export default sendMessage