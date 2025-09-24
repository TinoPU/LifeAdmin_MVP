import {defaultModelConfig} from "../config/modelConfig";
import {Agent, AgentMessage} from "../types/agent";
import Anthropic from "@anthropic-ai/sdk";


const anthropic = new Anthropic();

export async function callAgent(agent:Agent, trace:any, continue_conversation?:AgentMessage[]) {

    let systemPrompt = "";
    const messages: { role: "user" | "assistant"; content: string }[] = [];

    for (const m of agent.input) {
        if (m.role === "system") {
            systemPrompt = m.content;
        } else {
            messages.push({
                role: m.role === "user" ? "user" : "assistant",
                content: m.content,
            });
        }
    }

    if (continue_conversation) {
        for (const message of continue_conversation) {
            messages.push(message)
        }
    }

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
        const msg = await anthropic.messages.create({
            ...defaultModelConfig,
            ...(agent.modelConfig || {}),
            system: systemPrompt,
            messages: messages,
            ...(agent.tools ? { tools: agent.tools } : {})
        });


        if (agent.type === "composio_agent") {
            gen.end(({ output: msg}));
            return msg
        }
        const responseText = msg.content
            .filter(block => block.type === "text")
            .map(block => block.text)
            .join(" ");
        gen.end(({ output: msg}));
        return JSON.parse("{" + responseText);
    } catch (error) {
        trace.event(`${agent.name}.error`, error);
        return "Sorry, ich bin grad AFK";
    }
}