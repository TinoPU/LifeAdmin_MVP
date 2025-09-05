import { AgentCard, AgentProps, AgentResponse } from "../../types/agent";
import { composio } from "../../tools/composioClient";
import { langfuse } from "../../services/loggingService";
import { callAgent } from "../../services/agentService";

// Agent metadata
export const emailAgentCard: AgentCard = {
    name: "Email Agent",
    description:
        "This Agent handles email tasks and can send emails, read emails, and manage email tasks.",
};

const toolconfig_dict: Record<string, string> = {
    GMAIL: "ac_IqSbnGGgCbXh",
};

function getToolConfig(tool: string) {
    return toolconfig_dict[tool];
}

// After-execute modifier for Gmail emails/drafts
const afterExecuteModifier = ({ toolSlug, toolkitSlug, result }: { toolSlug: string; toolkitSlug: string; result: any }) => {
    const emailTools = ["GMAIL_FETCH_EMAILS", "GMAIL_LIST_DRAFTS"];

    if (emailTools.includes(toolSlug) && result?.data?.items) {
        const filteredItems = result.data.items.map((item: any) => ({
            messageId: item.id,
            sender: item.sender,
            subject: item.subject,
            body: item.body?.plainText || "",
        }));

        return { ...result, data: { ...result.data, items: filteredItems } };
    }

    return result;
};

export async function EmailAgent(props: AgentProps): Promise<AgentResponse> {
    const span = props.trace.span({
        name: "EmailAgent",
        input: {
            user_message: props.user_message,
            prompt: props.prompt,
            history: props.history,
            executionContext: JSON.stringify(props.context),
        },
    });

    props.context.agentStatus[emailAgentCard.name] = { status: "pending", result: {} };

    try {
        // Check for Gmail connection
        const existingConnections = await composio.connectedAccounts.list({
            userIds: [props.user.id],
            toolkitSlugs: ["GMAIL"],
        });

        if (!existingConnections || existingConnections.items.length === 0) {
            const connection = await composio.connectedAccounts.initiate(
                props.user.id,
                getToolConfig("GMAIL")
            );

            const response: AgentResponse = {
                response:
                    "The User needs to be authenticated to Access this. Redirect them to the URL provided in Data",
                data: { redirectUrl: connection.redirectUrl },
            };

            props.context.agent_messages.push(
                `${emailAgentCard.name}: ${JSON.stringify(response)}`
            );
            span.end({ output: response });
            return response;
        }

        // Fetch Gmail tools (no afterExecute here for Anthropic)
        const tools = await composio.tools.get(props.user.id, {
            toolkits: ["GMAIL"],
        });

        // Build chat prompt
        const chatPrompt = await langfuse.getPrompt("EmailAgent", undefined, { type: "chat" });
        const compiledChatPrompt = chatPrompt.compile({
            user_message: props.user_message,
            prompt: props.prompt || "",
        });

        // Call the agent
        const agent = {
            name: "Email Agent",
            input: compiledChatPrompt,
            prompt: chatPrompt,
            modelConfig: {
                model: "claude-2", // Anthropic model
                temperature: 1,
                max_tokens: 1024,
            },
            tools: tools,
            type: "composio_agent",
        };

        const msg = await callAgent(agent, span);

        // Run tool calls and apply the modifier
        const result = await composio.provider.handleToolCalls(props.user.id, msg, {},{afterExecute: afterExecuteModifier});

        span.event({ name: "tool_executed", output: result });

        const response: AgentResponse = {
            response: "Successful",
            data: result,
        };

        props.context.agent_messages.push(
            `${emailAgentCard.name}: ${JSON.stringify(response)}`
        );
        span.end({ output: response });
        return response;

    } catch (error) {
        span.event({
            name: "email.error",
            output: error instanceof Error ? error.message : String(error),
        });
        props.context.agentStatus[emailAgentCard.name] = { status: "failed", result: {} };
        span.end({ output: "Kann gerade nicht digga" });
        return { response: "Email agent failed", data: error };
    }
}
