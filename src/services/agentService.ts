import {defaultModelConfig} from "../config/modelConfig";
import {Agent, AgentMessage} from "../types/agent";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import dotenv from "dotenv";
import type { ChatCompletionMessageParam } from "openai/resources/chat";


dotenv.config()

const anthropic = new Anthropic();
const openai = new OpenAI({
    apiKey: process.env.SWISSCOM_API_KEY,
    baseURL: process.env.APERTUS_BASE_URL, // defaults to api.openai.com if unset
});

export async function callAgent(agent:Agent, trace:any, continue_conversation?:AgentMessage[]) {

    let systemPrompt = "";

    // const messages: { role: "user" | "assistant"; content: string }[] = [];
    //
    // for (const m of agent.input) {
    //     if (m.role === "system") {
    //         systemPrompt = m.content;
    //     } else {
    //         messages.push({
    //             role: m.role === "user" ? "user" : "assistant",
    //             content: m.content,
    //         });
    //     }
    // }


    const messages: ChatCompletionMessageParam[] = [];

    type ValidRoles = "system" | "user" | "assistant" | "developer" ;

    function toRole(role: string): ValidRoles {
        switch (role) {
            case "system":
            case "user":
            case "assistant":
            case "developer":
                return role;
            default:
                return "user";
        }
    }
    for (const m of agent.input) {
        if (m.role === "system") {
            systemPrompt = m.content;
        } else {
            messages.push({
                role: toRole(m.role), // narrowed here
                content: m.content,
            });
        }
    }



    // if (continue_conversation) {
    //     for (const message of continue_conversation) {
    //         messages.push(message)
    //     }
    // }

    const gen = trace.generation({
        name: `${agent.name}.call`,
        model: agent.modelConfig?.model || defaultModelConfig.model,
        modelParameters: {
            ...defaultModelConfig,
            ...(agent.modelConfig || {})
        },
        input: messages,
        prompt: agent.prompt,
        tools: agent?.tools || "",
        type: agent?.type || ""
    });

    try {
        // const msg = await anthropic.messages.create({
        //     ...defaultModelConfig,
        //     ...(agent.modelConfig || {}),
        //     system: systemPrompt,
        //     messages: messages,
        //     ...(agent.tools ? { tools: agent.tools } : {})
        // });

        /// Apertus try:
        const msg = await openai.chat.completions.create({
            model: "swiss-ai/Apertus-70B",
            messages: [
                ...(systemPrompt
                    ? ([{ role: "system" as const, content: systemPrompt }] as const)
                    : []),
                ...messages,
            ],
            ...(agent.tools ? { tools: agent.tools } : {}),
        });

        console.log(msg)


        if (agent.type === "composio_agent") {
            gen.end(({ output: msg}));
            return msg
        }
        // const responseText = msg.content
        //     .filter(block => block.type === "text")
        //     .map(block => block.text)
        //     .join(" ");
        // gen.end(({ output: msg}));
        // return JSON.parse("{" + responseText);

        return JSON.parse("{" + msg);

    } catch (error) {
        trace.event(`${agent.name}.error`, error);
        return "Sorry, ich bin grad AFK";
    }
}