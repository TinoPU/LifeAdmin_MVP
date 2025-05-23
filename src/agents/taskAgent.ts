import {AgentCard, AgentProps, AgentResponse} from "../types/agent";
import {langfuse} from "../services/loggingService";
import {callAgent} from "../services/agentService";
import {constructTaskContext} from "../utils/taskUtils";
import {executeTool, getToolSchema} from "../tools/toolRegistry";
import {constructUserContext} from "../utils/userUtils";

export const taskAgentCard: AgentCard = {
    name: "Task Agent",
    description: "Tracks specific tasks, to-do lists, reminders, and scheduling for things the user must do."
}

export async function TaskAgent(props: AgentProps): Promise<AgentResponse> {
    const span = props.trace.span({
        name: "TaskAgent",
        input: {
            user_message: props.user_message,
            prompt: props.prompt,
            history: props.history,
            executionContext: JSON.stringify(props.context),
        },
    });

    props.context.agentStatus[taskAgentCard.name] = {status: "pending", result: {}}

    const chatPrompt = await langfuse.getPrompt("TaskAgent", undefined, {
        type: "chat",
    });

    const taskContext = JSON.stringify(await constructTaskContext(props.user), null, 2)
    const toolSchema = JSON.stringify(getToolSchema(), null, 2)
    const userContext = constructUserContext(props.user)

    const compiledChatPrompt = chatPrompt.compile({
        user_message: props.user_message,
        prompt: props.prompt || "",
        taskContext: taskContext,
        toolSchema: toolSchema,
        user_datetime: userContext.time_at_user_location
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
        const response: any =  await callAgent(agent, span)
        const {tool, parameters, modelResponse} = response
        if (tool === "none") {
            props.context.agentStatus[taskAgentCard.name] = {status: "success", result: response}
            props.context.agent_messages.push(`${taskAgentCard.name}: ${modelResponse}`)
            console.log(props.context)
            span.end({output: modelResponse})
            return response
        }
        const executionResult = await executeTool(tool, parameters, props.user, span);
        const result = {response: JSON.stringify(executionResult)}
        props.context.agentStatus[taskAgentCard.name] = {status: "success", result: result}
        props.context.agent_messages.push(`${taskAgentCard.name}: ${JSON.stringify(executionResult)}`)
        span.end({output: executionResult})
        return response
    } catch (error) {
        span.event({ name: "task.error", output: error instanceof Error ? error.message : String(error)});
        props.context.agentStatus[taskAgentCard.name] = {status: "failed", result: {}}
        span.end({output: "Kann gerade nicht digga"})
        return {response: "Kann gerade nicht digga"}
    }
}