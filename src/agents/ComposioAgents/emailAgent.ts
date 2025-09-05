import { AgentCard, AgentProps, AgentResponse } from "../../types/agent";
import { composio } from "../../tools/composioClient";
import { langfuse } from "../../services/loggingService";
import {callAgent} from "../../services/agentService";



export const emailAgentCard: AgentCard = {
    name: "Email Agent",
    description: "This Agent handles email tasks and can send emails, read emails, and manage email tasks."
}

const toolconfig_dict: Record<string, string> = {
    "GMAIL": "ac_IqSbnGGgCbXh",
    }
function getToolConfig(tool: string) {
    return toolconfig_dict[tool];
}


export async function EmailAgent(props: AgentProps): Promise<AgentResponse>
{
    ///Tracing
    const span = props.trace.span({
        name: "EmailAgent",
        input: {
            user_message: props.user_message,
            prompt: props.prompt,
            history: props.history,
            executionContext: JSON.stringify(props.context),
        },
    });

    ///State Update
    props.context.agentStatus[emailAgentCard.name] = {status: "pending", result: {}}
    try {
        /// Composio Connection
        /// Check if user already has a Gmail connection
        const existingConnections = await composio.connectedAccounts.list({userIds: [props.user.id], toolkitSlugs: ["GMAIL"]
        });

        if (!existingConnections || existingConnections.items.length === 0) {
            // No connection yet → initiate OAuth
            const connection = await composio.connectedAccounts.initiate(
                props.user.id,
                getToolConfig("GMAIL"), // your Gmail Auth Config ID
            );
            // Return response that tells frontend to redirect user
            const response: AgentResponse = {
                response: "The User needs to be authenticated to Access this. Redirect them to the URL provided in Data",
                data: { redirectUrl: connection.redirectUrl },
            };
            props.context.agent_messages.push(
                JSON.stringify({
                    agent: emailAgentCard.name,
                    response: response
                }, null, 2)
            );
            span.end({ output: response });
            return response
        }
        const tools = await composio.tools.get(
            props.user.id,
            {
                toolkits: ["GMAIL"],
                limit: 23
            }
        );
        span.event({name:"tools found", metadata: tools})

        /// Context building
        const chatPrompt = await langfuse.getPrompt("EmailAgent", undefined, {
            type: "chat",
        });
        const compiledChatPrompt = chatPrompt.compile({
            user_message: props.user_message,
            prompt: props.prompt || "",
        });

        ///Agent Definition
        const agent = {
            name: "Email Agent",
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

        const msg =  await callAgent(agent, span);
        span.event({name: "tool_executed", input: msg})
        const result = await composio.provider.handleToolCalls(
            props.user.id,
            msg,
            {}, // options
            {
                afterExecute: ({ toolSlug, toolkitSlug, result }) => {
                    const emailTools = ["GMAIL_FETCH_EMAILS", "GMAIL_LIST_DRAFTS"];
                    if (
                        emailTools.includes(toolSlug)
                    )
                    { span.event({name: "afterExecute called", metadata: {
                        toolslug: toolSlug, toolkitSlug: toolkitSlug, result: result}
                        })
                        const messages = result?.data?.messages;
                        if (Array.isArray(messages)) {
                            const MAX_LENGTH = 2000; // adjust as needed

                            result.data.messages = messages.map((msg: any) => {
                                let body = msg.messageText || msg.preview?.body || "";

                                // truncate if too long
                                if (body.length > MAX_LENGTH) {
                                    body = msg.preview?.body
                                        ? msg.preview.body
                                        : body.slice(0, MAX_LENGTH) + "...";
                                }

                                return {
                                    messageId: msg.messageId,
                                    sender: msg.sender,
                                    subject: msg.subject,
                                    body
                                };
                            })
                        }
                    }
                    return result;
                },
            }
        );
        span.event({name: "tool_executed", output: result})
        const response: AgentResponse = {
            response: "Successful",
            data: result,
        };
        props.context.agent_messages.push(JSON.stringify({
            agent: emailAgentCard.name,
            response: response
        }, null, 2))

        span.end({output: response})
        return response
    } catch (error) {
        span.event({ name: "email.error", output: error instanceof Error ? error.message : String(error)});
        props.context.agentStatus[emailAgentCard.name] = {status: "failed", result: {}}
        span.end({output: "Kann gerade nicht digga"})
        return { response: "Email agent failed", data: error }

    }
}