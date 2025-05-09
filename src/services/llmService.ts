import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import {ToolResult, ToolSchema} from "../tools/toolRegistry";
import {Task, User} from "../types/db";
import {AgentContext, UserContext} from "../types/agent";
import {langfuse} from "./loggingService";
import {defaultModelConfig} from "../config/modelConfig";



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
        return msg.content
            .filter((block: any) => block.type === "text") // Ensure it's a text block
            .map((block: any) => block.text) // Extract text
            .join(" "); // Join all text blocks into one string
    } catch (error) {
        console.log(error)
        return
    }
}

export async function callLLMOrchestration(userMessage: string, context:AgentContext, history: any[], toolSchema:any[], trace: any) {
    try {
        const chatPrompt = await langfuse.getPrompt("LLMOrchestration", undefined, {
            type: "chat",
        });
        const compiledChatPrompt = chatPrompt.compile({
            userMessage: userMessage,
            history: JSON.stringify(history, null, 2),
            userContext: JSON.stringify(context.userContext, null, 2),
            taskContext: JSON.stringify(context.taskContext, null, 2),
            toolSchema: JSON.stringify(toolSchema, null, 2)
        });


        let systemPrompt = "";
        const messages: { role: "user" | "assistant"; content: string }[] = [];

        for (const m of compiledChatPrompt) {
            if (m.role === "system") {
                systemPrompt = m.content;
            } else {
                messages.push({
                    role: m.role === "user" ? "user" : "assistant",
                    content: m.content,
                });
            }
        }

        const gen = trace.generation({
            name: "orchestration.call",
            model: defaultModelConfig.model,
            modelParameters: { ...defaultModelConfig },
            input: compiledChatPrompt,
            prompt: chatPrompt
        });

        const msg = await anthropic.messages.create({
            ...defaultModelConfig,
            system: systemPrompt,
            messages: messages
        });
        const responseText = msg.content
            .filter(block => block.type === "text")
            .map(block => block.text)
            .join(" ");

        gen.end(({ output: responseText}));
        return JSON.parse("{" + responseText);
    } catch (error) {
        trace.event("orchestration.error", error);
        return { tool: "none", parameters: {}, response: "Sorry, ich bin grad AFK" };
    }
}


export async function callLLMToolFeedback(userMessage: string, userContext:UserContext, history: any[], selectedTool: ToolSchema | string, parameters:any[], executionResult:ToolResult, trace: any) {
    try {

        const chatPrompt = await langfuse.getPrompt("LLMToolFeedback", undefined, {
            type: "chat",
        });
        const compiledChatPrompt = chatPrompt.compile({
            userMessage: userMessage,
            history: JSON.stringify(history, null, 2),
            userContext: JSON.stringify(userContext, null, 2),
            executionResult: JSON.stringify(executionResult, null, 2),
            parameters: JSON.stringify(parameters, null, 2),
            selectedTool: JSON.stringify(selectedTool, null, 2),
        });


        let systemPrompt = "";
        const messages: { role: "user" | "assistant"; content: string }[] = [];

        for (const m of compiledChatPrompt) {
            if (m.role === "system") {
                systemPrompt = m.content;
            } else {
                messages.push({
                    role: m.role === "user" ? "user" : "assistant",
                    content: m.content,
                });
            }
        }


        const gen = trace.generation({
            name: "LLMToolFeedback.call",
            model: defaultModelConfig.model,
            modelParameters: { ...defaultModelConfig },
            input: compiledChatPrompt,
            prompt: chatPrompt
        });


        const msg = await anthropic.messages.create({
            ...defaultModelConfig,
            system: systemPrompt,
            messages: messages
        });

        const responseText = msg.content
            .filter(block => block.type === "text")
            .map(block => block.text)
            .join(" ");

        gen.end(({ output: responseText}));
        return JSON.parse("{" + responseText);
    } catch (error) {
        trace.event("LLMToolFeedback.error", error);
        return { next_action: "ask_user", new_parameters: {}, response: "Ich kann mir grad nichts merken" };
    }
}

export async function generateReminderMessage(task: Task, user: User, history:any[]) {

    const trace = langfuse.trace({ name: "agent.generateReminderMessage", userId: user.id });
    const userContext: UserContext = user

    try {
        const chatPrompt = await langfuse.getPrompt("generateReminderMessage", undefined, {
            type: "chat",
        });
        const compiledChatPrompt = chatPrompt.compile({
            task: JSON.stringify(task, null, 2),
            history: JSON.stringify(history, null, 2),
            userContext: JSON.stringify(userContext, null, 2),
        });

        let systemPrompt = "";
        const messages: { role: "user" | "assistant"; content: string }[] = [];

        for (const m of compiledChatPrompt) {
            if (m.role === "system") {
                systemPrompt = m.content;
            } else {
                messages.push({
                    role: m.role === "user" ? "user" : "assistant",
                    content: m.content,
                });
            }
        }

        const gen = trace.generation({
            name: "generateReminderMessage.call",
            model: defaultModelConfig.model,
            modelParameters: { ...defaultModelConfig },
            input: compiledChatPrompt,
            prompt: chatPrompt
        });

        const msg = await anthropic.messages.create({
            ...defaultModelConfig,
            system: systemPrompt,
            messages: messages
        });
        const response = msg.content
            .filter((block: any) => block.type === "text") // Ensure it's a text block
            .map((block: any) => block.text) // Extract text
            .join(" "); // Join all text blocks into one string
        gen.end({output: response})
        return response
    } catch (error) {
        trace.event("generateReminderMessage.error", error)
        return
    } finally {
        // ensure flush in Vercel
        await langfuse.shutdownAsync();
    }
}