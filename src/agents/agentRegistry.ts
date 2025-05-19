import {AgentCard, AgentResponse, ExecutionContext} from "../types/agent";
import {ResponseAgent, responseAgentCard} from "./responseAgent";
import {taskAgentCard} from "./taskAgent";
import {websearchAgentCard} from "./websearchAgent";
import {orchestratorAgentCard} from "./orchestratorAgent";

export function availableAgents() {
    let agents: AgentCard[] = [orchestratorAgentCard, responseAgentCard, taskAgentCard, websearchAgentCard] //Add new Agents here
    return agents.map(agent => `- ${agent.name}: ${agent.description}`).join("\n");
}

export const agentFunctionMap: Record<string, (user_message: string, context: ExecutionContext, history: string[], trace:any) => Promise<AgentResponse>> = {
    "Response Agent": ResponseAgent,
    // Add more agents here, like:
    // "Search Agent": SearchAgent,
    // "Planner Agent": PlannerAgent,
};
