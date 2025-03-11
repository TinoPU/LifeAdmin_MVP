import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import {response} from "express";

dotenv.config()

const anthropic = new Anthropic();

export async function messageLLM(userMessage: string) {
    try {
        const msg = await anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 1000,
            temperature: 1,
            system: "Bitte passe dich der Sprache des Nutzers an (Deutsch, Englisch, Schweizerdeutsch, etc.) und schreibe in einem lockeren, natürlichen Chatting-Stil. Halte deine Nachrichten kurz (1-2 Zeilen). Schreib informell wie ein Kollege, mit unvollständigen Sätzen und typischen Alltagsausdrücken. Vermeide perfekte Grammatik und lange Erklärungen. Reagiere auf den Ton und Stil des Nutzers.",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: userMessage
                        }
                    ]
                }
            ]
        });
        const responseText = msg.content
            .filter((block: any) => block.type === "text") // Ensure it's a text block
            .map((block: any) => block.text) // Extract text
            .join(" "); // Join all text blocks into one string
        return responseText;
    } catch (error) {
        console.log(error)
        return
    }
}

export default messageLLM
