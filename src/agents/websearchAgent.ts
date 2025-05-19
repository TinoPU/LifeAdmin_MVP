import {AgentCard, AgentResponse, ExecutionContext} from "../types/agent";
import {askPerplexity} from "../tools/perplexityTools";


export const websearchAgentCard: AgentCard = {
    name: "Websearch Agent",
    description: "Performs web searches to find up-to-date information on topics that require current data or extensive research"
}

export async function WebsearchAgent (user_message: string, execution_context: ExecutionContext,   history: string[], prompt:string, trace:any):Promise<AgentResponse> {

    execution_context.agentStatus[websearchAgentCard.name] = {status:"pending"}
    const messages = [
        {
            "role": "user",
            "content": prompt + "/n ------ unrefined user message for context: " + user_message
        },
    ]
    const properties = {
        messages: messages
    }

    try {
        const perplexity = await askPerplexity(properties, trace)
        if (perplexity.success) {
            execution_context.agentStatus[websearchAgentCard.name] = {status: "success", result:perplexity.message}
            execution_context.agent_messages.push(`${websearchAgentCard.name}: ${perplexity.message}`)
            return {response: perplexity.message}
        } else {
            execution_context.agentStatus[websearchAgentCard.name] = {status: "failed", result: perplexity.message}
            return {response: perplexity.message}
        }
    } catch (error) {
        execution_context.agentStatus[websearchAgentCard.name] = {status: "failed", result: {}}
        return {response: `Websearch failed with error: ${error}`}
    }
}
