import {AgentCard, AgentProps, AgentResponse} from "../types/agent";
import {ResponseAgent, responseAgentCard} from "./responseAgent";
import {TaskAgent, taskAgentCard} from "./taskAgent";
import {WebsearchAgent, websearchAgentCard} from "./websearchAgent";
import {orchestratorAgentCard} from "./orchestratorAgent";
import {EmailAgent, emailAgentCard} from "./ComposioAgents/emailAgent";
import {NotionAgent, notionAgentCard} from "./ComposioAgents/notionAgent";
import {MapsAgent, mapsAgentCard} from "./ComposioAgents/mapsAgent";
import {CalendarAgent, calendarAgentCard} from "./ComposioAgents/calendarAgent";

export function availableAgents() {
    let agents: AgentCard[] = [orchestratorAgentCard, responseAgentCard, taskAgentCard, websearchAgentCard, emailAgentCard, notionAgentCard, mapsAgentCard, calendarAgentCard] //Add new Agents here
    return agents.map(agent => `- ${agent.name}: ${agent.description}`).join("\n");
}

export const agentFunctionMap: Record<string, (props: AgentProps) => Promise<AgentResponse>> = {
    [responseAgentCard.name]: ResponseAgent,
    [websearchAgentCard.name]: WebsearchAgent,
    [taskAgentCard.name]: TaskAgent,
    [emailAgentCard.name]: EmailAgent,
    [notionAgentCard.name]: NotionAgent,
    [mapsAgentCard.name]: MapsAgent,
    [calendarAgentCard.name]: CalendarAgent
};
