import {Agent, AgentCard, ExecutionContext, OrchestratorResponse, UserContext} from "../types/agent";
import {langfuse} from "../services/loggingService";
import {availableAgents} from "./agentRegistry";
import {callAgent} from "../services/agentService";
import {getArtifacts, storeArtifact} from "../utils/agentUtils";
import {Artifact} from "../types/artifacts";
import {uuid} from "@supabase/supabase-js/dist/main/lib/helpers";
import {UUID} from "../types/db";
import {cleanStringList} from "../utils/transformationUtils";

export const orchestratorAgentCard: AgentCard = {
    name: "Orchestrator Agent",
    description: "This Agent receives user messages and evaluates the request to determine which Agents to call to handle it"
}

export async function OrchestratorAgent(user_message: string, execution_context: ExecutionContext, history:string[], user_context:UserContext, trace:any): Promise<OrchestratorResponse> {
    const span = trace.span({
        name: "Orchestration",
        input: {
            userInput: user_message,
        },
    });
    const chatPrompt = await langfuse.getPrompt("OrchestratorAgent", undefined, {
        type: "chat",
    });

    const compiledChatPrompt = chatPrompt.compile({
        userMessage: user_message,
        execution_context: cleanStringList(await getArtifacts(execution_context.user_id as string, orchestratorAgentCard.name)),
        agents: availableAgents(),
        history: JSON.stringify(history, null,2),
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

    let artifact: Artifact = {
        id: uuid(),
        status: "pending",
        agent_name: agent.name,
        input: user_message,
        created_at: new Date().toISOString(),
        user_id: execution_context.user_id as UUID,
        traceId: trace.id,
        sub_artifacts: [],
        final_output: undefined
    }

    try {
        const orchestrator_response: OrchestratorResponse =  await callAgent(agent, span)
        execution_context.agentStatus[orchestratorAgentCard.name] = {status: "success", result: orchestrator_response.agents}
        span.end({output: orchestrator_response})
        artifact.final_output = orchestrator_response
        storeArtifact(artifact)
        return orchestrator_response
    } catch (error) {
        span.event({ name: "orchestration.error", output: error });
        span.end()
        return {agents: {}}
    }
}