import { AgentCard, AgentProps, AgentResponse } from "../../types/agent";
import { composio } from "../../tools/composioClient";
import { langfuse } from "../../services/loggingService";
import {ComposioUtils, condenseArtifactStrings, getArtifacts} from "../../utils/agentUtils";
import ComposioExecuter from "./composioExecuter";
import {cleanStringList} from "../../utils/transformationUtils";



export const calendarAgentCard: AgentCard = {
    name: "Calendar Agent",
    description: "This Agent can access calenders, plan and check events or availabilities."
}

export async function CalendarAgent(props: AgentProps): Promise<AgentResponse>
{
    const context =  cleanStringList(condenseArtifactStrings(await getArtifacts(props.user.id as string, calendarAgentCard.name)))

    ///Tracing
    const span = props.trace.span({
        name: "Calendar Agent",
        input: {
            user_message: props.user_message,
            prompt: props.prompt,
            executionContext: context
        },
    });

    ///State Update
    props.context.agentStatus[calendarAgentCard.name] = {status: "pending", result: {}}
    try {
        /// Composio Connection
        /// Check if user already has a connection
        const existingConnections = await composio.connectedAccounts.list({userIds: [props.user.id], toolkitSlugs: ["GOOGLECALENDAR"]
        });

        if (!existingConnections || existingConnections.items.length === 0) { ///#TODO: Check for active connections instead!!
            // No connection yet → initiate OAuth
            const connection = await composio.connectedAccounts.initiate(
                props.user.id,
                ComposioUtils.getToolConfig("GOOGLECALENDAR"),
            );
            // Return response that tells frontend to redirect user
            const response: AgentResponse = {
                response: "The User needs to be authenticated to Access this. Redirect them to the URL provided in Data",
                data: { redirectUrl: connection.redirectUrl },
            };
            props.context.agent_messages.push(
                JSON.stringify({
                    agent: calendarAgentCard.name,
                    response: response
                }, null, 2)
            );
            span.end({ output: response });
            return response
        }
        const tools = await composio.tools.get(
            props.user.id,
            {
                toolkits: ["GOOGLECALENDAR"],
            }
        );
        span.event({name:"tools found", metadata: tools})

        /// Context building
        const chatPrompt = await langfuse.getPrompt("CalendarAgent", undefined, {
            type: "chat",
        });
        const compiledChatPrompt = chatPrompt.compile({
            user_message: props.user_message,
            prompt: props.prompt || "",
            executionContext: context
        });

        ///Agent Definition
        const agent = {
            name: "Calendar Agent",
            input: compiledChatPrompt,
            prompt: chatPrompt,
            modelConfig: {
                model: "claude-sonnet-4-20250514",
                temperature: 1,
                max_tokens: 1024
            },
            tools: tools,
            type: "composio_agent"
        }

        const result = await ComposioExecuter(agent, props, span)

        const response: AgentResponse = {
            response: "Successful",
            data: result,
        };
        props.context.agent_messages.push(JSON.stringify({
            agent: calendarAgentCard.name,
            response: response
        }, null, 2))

        span.end({output: response})
        return response
    } catch (error) {
        span.event({ name: "notion.error", output: error instanceof Error ? error.message : String(error)});
        props.context.agentStatus[calendarAgentCard.name] = {status: "failed", result: {}}
        span.end({output: "Kann gerade nicht digga"})
        return { response: "Notion agent failed", data: error }

    }
}