import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import {ToolResult, ToolSchema} from "../tools/toolRegistry";

dotenv.config()

const anthropic = new Anthropic();

export async function generateUserMessageResponse(userMessage: string) {
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

export async function callLLMOrchestration(userMessage: string, history: any[], toolSchema:any[]) {
    try {
        const prompt = `
        You are an AI assistant managing a user's tasks and reminders.

        ### Conversation History for Context:
        ${JSON.stringify(history, null, 2)}

        ### Available Tools:
        ${JSON.stringify(toolSchema, null, 2)}

        ### Instructions:
        1. Analyze the user’s message and determine whether a tool should be used.
        2. If a tool is needed, extract all relevant parameters.
        3. If no tool applies, respond naturally.

        ### Response Format (JSON):
        {
        "tool": "create_task" | "set_reminder" | "none",
        "parameters": { ... },
        "response": "..."
        }
        `;

        const msg = await anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 1000,
            temperature: 0.8,
            system: "Bitte passe dich der Sprache des Nutzers an (Deutsch, Englisch, Schweizerdeutsch, etc.) und schreibe in einem lockeren, natürlichen Chatting-Stil. Halte deine Nachrichten kurz (1-2 Zeilen). Schreib informell wie ein Kollege, mit unvollständigen Sätzen und typischen Alltagsausdrücken. Vermeide perfekte Grammatik und lange Erklärungen. Reagiere auf den Ton und Stil des Nutzers.",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        }
                    ]
                }
            ]
        });
        const responseText = msg.content
            .filter(block => block.type === "text")
            .map(block => block.text)
            .join(" ");
        return JSON.parse(responseText);
    } catch (error) {
        console.error("Error in callLLMOrchestration:", error);
        return { tool: "none", parameters: {}, response: "Sorry, ich bin grad AFK" };
    }
}


export async function callLLMToolFeedback(userMessage: string, history: any[], selectedTool: ToolSchema | string, parameters:any[], executionResult:ToolResult) {
    try {
        const prompt = `
        ### User’s Message:
        ${userMessage}

        ### Conversation History:
        ${JSON.stringify(history, null, 2)}

        ### Selected Tool:
        ${JSON.stringify(selectedTool, null,2)}

        ### Tool Parameters:
        ${JSON.stringify(parameters, null, 2)}

        ### Tool Execution Result:
        ${JSON.stringify(executionResult, null, 2)}

        ### Instructions:
        1. If the tool **failed** or **needs more details**, generate a clarification request for the user.
        2. If execution **was successful**, confirm it to the user.
        3. If execution **is uncertain**, ask the user how to proceed.

        ### Response Format (JSON):
        {
        "next_action": "retry_tool" | "ask_user" | "confirm_success",
        "new_parameters": { ... } (if retrying),
        "response": "..."
        }
        `;

        const msg = await anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 1000,
            temperature: 0.8,
            system: "Please adapt to the user's language (German, English, Swiss German, etc.) and write in a natural, casual chatting style. Keep responses short (1-2 lines). Write informally like a colleague, using incomplete sentences and common everyday expressions. Avoid perfect grammar and long explanations. Respond in the user's tone and style.",
            messages: [
                {
                    role: "user",
                    content: [{ type: "text", text: prompt }]
                }
            ]
        });

        const responseText = msg.content
            .filter(block => block.type === "text")
            .map(block => block.text)
            .join(" ");

        return JSON.parse(responseText);
    } catch (error) {
        console.error("Error in callLLMToolFeedback:", error);
        return { next_action: "ask_user", new_parameters: {}, response: "Ich kann mir grad nichts merken" };
    }
}

