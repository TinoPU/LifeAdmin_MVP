import {Agent, AgentCard, ExecutionContext, OrchestratorResponse, UserContext} from "../types/agent";
import {langfuse} from "../services/loggingService";
import {availableAgents} from "./agentRegistry";
import {callAgent} from "../services/agentService";

export const orchestratorAgentCard: AgentCard = {
    name: "Orchestrator Agent",
    description: "This Agent receives user messages and evaluates the request to determine which Agents to call to handle it"
}

export async function OrchestratorAgent(user_message: string, execution_context: ExecutionContext, history:string[], user_context:UserContext, trace:any): Promise<OrchestratorResponse> {

    const chatPrompt = await langfuse.getPrompt("OrchestratorAgent", undefined, {
        type: "chat",
    });

    const compiled_context = JSON.stringify(execution_context.agent_messages, null, 2)
    const compiledChatPrompt = chatPrompt.compile({
        userMessage: user_message,
        execution_context: compiled_context,
        agents: availableAgents(),
        conversation_history: JSON.stringify(history, null,2),
        user_context: JSON.stringify(user_context, null, 2)
    });

    const agent: Agent = {
        name: "Orchestrator Agent",
        input: compiledChatPrompt,
        prompt: chatPrompt,
        modelConfig: {
            model: "claude-3-haiku-20240307",
            temperature: 0,
            max_tokens: 4096
        }}

    try {
        const orchestrator_response: OrchestratorResponse =  await callAgent(agent,trace)
        execution_context.agentStatus[orchestratorAgentCard.name] = {status: "success", result: orchestrator_response.agents}
        return orchestrator_response
    } catch (error) {
        trace.event({ name: "orchestration.error", output: error });
        return {agents: {}}
    }
}