import {AgentCard, AgentResponse, ExecutionContext} from "../types/agent";
import {langfuse} from "../services/loggingService";
import {callAgent} from "../services/agentService";
import {orchestratorAgentCard} from "./orchestratorAgent";


export const responseAgentCard: AgentCard = {
    name: "Response Agent",
    description: "Handles general inquiries, conversations, and provides information on a wide range of topic. Always responds to the User."
}


export async function ResponseAgent(user_message: string, execution_context: ExecutionContext, conversation_history:string[], trace:any): Promise<AgentResponse> {

    execution_context.agentStatus[orchestratorAgentCard.name] = {status: "pending", result: {}}
    const chatPrompt = await langfuse.getPrompt("ResponseAgent", undefined, {
        type: "chat",
    });

    const compiled_context = JSON.stringify(execution_context.agent_messages, null, 2)
    const compiledChatPrompt = chatPrompt.compile({
        userMessage: user_message,
        executionContext: compiled_context,
        history: JSON.stringify(conversation_history, null,2),
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
        const response: AgentResponse =  await callAgent(agent,trace)
        execution_context.agentStatus[orchestratorAgentCard.name] = {status: "success", result: response}
        return response
    } catch (error) {
        trace.event({ name: "response.error", output: error });
        execution_context.agentStatus[orchestratorAgentCard.name] = {status: "failed", result: {}}
        return {response: "Kann gerade nicht digga"}
    }
}