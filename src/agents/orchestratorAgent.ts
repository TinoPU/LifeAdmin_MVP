import {Agent, AgentCard, ExecutionContext} from "../types/agent";
import {langfuse} from "../services/loggingService";

export const orchestratorAgentCard: AgentCard = {
    name: "Orchestrator Agent",
    description: "This Agent receives user messages and evaluates the request to determine which Agents to call to handle it"
}

export async function OrchestratorAgent(user_message: string, execution_context: ExecutionContext): Promise<Agent> {

    const chatPrompt = await langfuse.getPrompt("OrchestratorAgent", undefined, {
        type: "chat",
    });

    const compiled_context = JSON.stringify(execution_context.agent_messages, null, 2)
    const compiledChatPrompt = chatPrompt.compile({
        userMessage: user_message,
        execution_context: compiled_context
    });
    return {
        name: "Orchestrator Agent",
        input: compiledChatPrompt,
        prompt: chatPrompt,
        modelConfig: {
            model: "claude-3-haiku-20240307",
            temperature: 0,
            max_tokens: 4096
        }
    }
}