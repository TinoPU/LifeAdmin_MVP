import {AgentCard, AgentProps, AgentResponse} from "../types/agent";
import {langfuse} from "../services/loggingService";
import {callAgent} from "../services/agentService";
import {constructTaskContext} from "../utils/taskUtils";
import {executeTool, getToolSchema} from "../tools/toolRegistry";

export const taskAgentCard: AgentCard = {
    name: "Task Agent",
    description: "Tracks specific tasks, to-do lists, reminders, and scheduling for things the user must do."
}

export async function TaskAgent(props: AgentProps): Promise<AgentResponse> {
    const span = props.trace.span({
        name: "TaskAgent",
        input: {
            props: props,
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
        const parsed = JSON.parse(response.response ?? '{}');
        const {tool, parameters} = parsed
        if (tool === "none") {
            props.context.agentStatus[taskAgentCard.name] = {status: "success", result: response}
            span.end({output: response})
            return response
        }
        const executionResult = await executeTool(tool, parameters, props.user, span);
        const result = {response: JSON.stringify(executionResult)}
        props.context.agentStatus[taskAgentCard.name] = {status: "success", result: result}
        span.end({output: executionResult})
        return response
    } catch (error) {
        span.event({ name: "task.error", output: error });
        props.context.agentStatus[taskAgentCard.name] = {status: "failed", result: {}}
        span.end()
        return {response: "Kann gerade nicht digga"}
    }
}