import {AgentCard, AgentProps, AgentResponse} from "../types/agent";
import {langfuse} from "../services/loggingService";
import {callAgent} from "../services/agentService";
import {orchestratorAgentCard} from "./orchestratorAgent";


export const responseAgentCard: AgentCard = {
    name: "Response Agent",
    description: "Handles general inquiries, conversations, and provides information on a wide range of topic. Always responds to the User."
}


export async function ResponseAgent(props: AgentProps): Promise<AgentResponse> {
    const span = props.trace.span({
        name: "ResponseAgent",
        input: {
            user_message: props.user_message,
            prompt: props.prompt,
            history: props.history,
            executionContext: props.context

        },
    });

    props.context.agentStatus[orchestratorAgentCard.name] = {status: "pending", result: {}}
    const chatPrompt = await langfuse.getPrompt("ResponseAgent", undefined, {
        type: "chat",
    });

    const compiled_context = JSON.stringify(props.context.agent_messages.map((msg) => {
            try {
                return JSON.parse(msg); // convert string back to object
            } catch {
                return msg; // fallback in case it's not valid JSON
            }
        }),
        null,
        2)
    const compiledChatPrompt = chatPrompt.compile({
        userMessage: props.user_message,
        executionContext: compiled_context,
        history: JSON.stringify(props.history, null,2),
    });

    const agent = {
        name: "Response Agent",
        input: compiledChatPrompt,
        prompt: chatPrompt,
        modelConfig: {
            model: "claude-3-7-sonnet-20250219",
            temperature: 1,
            max_tokens: 20000
        }
    }

    try {
        const response: AgentResponse =  await callAgent(agent, span)
        props.context.agentStatus[orchestratorAgentCard.name] = {status: "success", result: response}
        span.end({output: response})
        return response
    } catch (error) {
        span.event({ name: "response.error", output: error });
        props.context.agentStatus[orchestratorAgentCard.name] = {status: "failed", result: {}}
        span.end()
        return {response: "Kann gerade nicht digga"}
    }
}