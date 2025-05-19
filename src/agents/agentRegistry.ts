import {AgentCard, AgentResponse, ExecutionContext} from "../types/agent";
import {ResponseAgent, responseAgentCard} from "./responseAgent";
import {taskAgentCard} from "./taskAgent";
import {WebsearchAgent, websearchAgentCard} from "./websearchAgent";
import {orchestratorAgentCard} from "./orchestratorAgent";

export function availableAgents() {
    let agents: AgentCard[] = [orchestratorAgentCard, responseAgentCard, taskAgentCard, websearchAgentCard] //Add new Agents here
    return agents.map(agent => `- ${agent.name}: ${agent.description}`).join("\n");
}

export const agentFunctionMap: Record<string, (user_message: string, context: ExecutionContext, history: string[], prompt:string, trace:any) => Promise<AgentResponse>> = {
    [responseAgentCard.name]: ResponseAgent,
    [websearchAgentCard.name]: WebsearchAgent
};
