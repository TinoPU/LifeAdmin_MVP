import {AgentCard, AgentProps, AgentResponse} from "../types/agent";
import {askPerplexity} from "../tools/perplexityTools";


export const websearchAgentCard: AgentCard = {
    name: "Websearch Agent",
    description: "Performs web searches to find up-to-date information on topics that require current data or extensive research"
}

export async function WebsearchAgent (props: AgentProps):Promise<AgentResponse> {

    const span = props.trace.span({name: "Websearch Agent",
        input: props });

    props.context.agentStatus[websearchAgentCard.name] = {status:"pending"}
    const messages = [
        {
            "role": "user",
            "content": props.prompt + "/n ------ unrefined user message for context: " + props.user_message
        },
    ]
    const properties = {
        messages: messages
    }

    try {
        const perplexity = await askPerplexity(properties, span)
        if (perplexity.success) {
            props.context.agentStatus[websearchAgentCard.name] = {status: "success", result:perplexity.message}
            props.context.agent_messages.push(`${websearchAgentCard.name}: ${perplexity.message}`)
            span.end({output: perplexity})
            return {response: perplexity.message}
        } else {
            props.context.agentStatus[websearchAgentCard.name] = {status: "failed", result: perplexity.message}
            span.end({output: perplexity})
            return {response: perplexity.message}
        }
    } catch (error) {
        props.context.agentStatus[websearchAgentCard.name] = {status: "failed", result: {}}
        span.event({name:"Websearch error", statusMessage: error, level: "ERROR"})
        return {response: `Websearch failed with error: ${error}`}
    }
}
