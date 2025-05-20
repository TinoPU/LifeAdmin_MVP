import {AgentCard, AgentProps, AgentResponse} from "../types/agent";
import {ResponseAgent, responseAgentCard} from "./responseAgent";
import {TaskAgent, taskAgentCard} from "./taskAgent";
import {WebsearchAgent, websearchAgentCard} from "./websearchAgent";
import {orchestratorAgentCard} from "./orchestratorAgent";

export function availableAgents() {
    let agents: AgentCard[] = [orchestratorAgentCard, responseAgentCard, taskAgentCard, websearchAgentCard] //Add new Agents here
    return agents.map(agent => `- ${agent.name}: ${agent.description}`).join("\n");
}

export const agentFunctionMap: Record<string, (props: AgentProps) => Promise<AgentResponse>> = {
    [responseAgentCard.name]: ResponseAgent,
    [websearchAgentCard.name]: WebsearchAgent,
    [taskAgentCard.name]: TaskAgent
};
