import {AgentCard, AgentProps, AgentResponse} from "../types/agent";
import {langfuse} from "../services/loggingService";
import {callAgent} from "../services/agentService";
import {constructTaskContext} from "../utils/taskUtils";
import {executeTool, getToolSchema} from "../tools/toolRegistry";
import {websearchAgentCard} from "./websearchAgent";

export const taskAgentCard: AgentCard = {
    name: "Task Agent",
    description: "Tracks specific tasks, to-do lists, reminders, and scheduling for things the user must do."
}

export async function TaskAgent(props: AgentProps): Promise<AgentResponse> {
    const span = props.trace.span({
        name: "TaskAgent",
        input: {
            ...props
        },
    });

    props.context.agentStatus[taskAgentCard.name] = {status: "pending", result: {}}

    const chatPrompt = await langfuse.getPrompt("TaskAgent", undefined, {
        type: "chat",
    });

    const taskContext = JSON.stringify(await constructTaskContext(props.user), null, 2)
    const toolSchema = JSON.stringify(getToolSchema(), null, 2)

    const compiledChatPrompt = chatPrompt.compile({
        userMessage: props.user_message,
        prompt: props.prompt || "",
        taskContext: taskContext,
        toolSchema: toolSchema,
    });

    const agent = {
        name: "Task Agent",
        input: compiledChatPrompt,
        prompt: chatPrompt,
        modelConfig: {
            model: "claude-3-7-sonnet-20250219",
            temperature: 1,
            max_tokens: 20000
        }
    }
    try {
        const response: AgentResponse =  await callAgent(agent, span)
        console.log(response)
        const parsed = JSON.parse(JSON.stringify(response));
        console.log(parsed)
        const {tool, parameters, resp} = parsed
        if (tool === "none") {
            props.context.agentStatus[taskAgentCard.name] = {status: "success", result: response}
            props.context.agent_messages.push(`${websearchAgentCard.name}: ${resp}`)
            console.log(props.context)
            span.end({output: resp})
            return response
        }
        const executionResult = await executeTool(tool, parameters, props.user, span);
        const result = {response: JSON.stringify(executionResult)}
        props.context.agentStatus[taskAgentCard.name] = {status: "success", result: result}
        props.context.agent_messages.push(`${websearchAgentCard.name}: ${JSON.stringify(executionResult)}`)
        span.end({output: executionResult})
        return response
    } catch (error) {
        span.event({ name: "task.error", output: error instanceof Error ? error.message : String(error)});
        props.context.agentStatus[taskAgentCard.name] = {status: "failed", result: {}}
        span.end({output: "Kann gerade nicht digga"})
        return {response: "Kann gerade nicht digga"}
    }
}