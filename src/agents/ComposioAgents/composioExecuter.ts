import {Agent, AgentMessage, AgentProps} from "../../types/agent";
import {callAgent} from "../../services/agentService";
import {composio} from "../../tools/composioClient";
import {addArtifactStep, createArtifact, normalizeContent, storeArtifact} from "../../utils/agentUtils";
import {formatGmailMessages, formatSingleGmailMessage} from "../../utils/transformationUtils";



export default async function ComposioExecuter(agent: Agent, props: AgentProps, span: any) {
    const break_reasons = ["end_turn", "max_tokens", "stop_sequence", "pause_turn", "refusal"]
    let artifact = createArtifact(agent, props)

    let local_context: AgentMessage[] = []
    let iteration = 0
    let stop_reason = ""
    let result = undefined


    const afterExecuteHandlers: Record<string, (result: any) => any> = {
        GMAIL_FETCH_EMAILS: (result) => formatGmailMessages(result),
        GMAIL_LIST_DRAFTS: (result) => formatGmailMessages(result),
        GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID: (result) => formatSingleGmailMessage(result)
    };

    while (!break_reasons.includes(stop_reason) && iteration <5) {
        const msg = await callAgent(agent, span, local_context);
        iteration += 1
        stop_reason = msg.stop_reason
        const assistantText = msg.content?.[0]?.text;

        if (assistantText) {
            result = assistantText;  // <── Save latest assistant output
        }
        const step = {
            id: iteration,
            type: "agent" as const,
            status: "success" as const,
            output: msg.content
        }
        addArtifactStep(artifact,step)
        local_context.push({role: "assistant" as const, content: msg.content || ""})

        if (stop_reason == "tool_use") {
            result = await composio.provider.handleToolCalls(
                props.user.id,
                msg,
                {},
                {
                    afterExecute: ({toolSlug, toolkitSlug, result}) => {
                        const handler = afterExecuteHandlers[toolSlug];
                        if (handler) {
                            {
                                span.event({
                                    name: "afterExecute called", metadata: {
                                        toolSlug: toolSlug, toolkitSlug: toolkitSlug, result: result
                                    }
                                })
                            }
                            result = handler(result);
                        }
                        return result;
                    },
                });
                span.event({name: "tool_called", input: msg, output: result})
                local_context.push(...result)
            }
    }
    const final_result = normalizeContent(result)
    artifact.final_output = final_result
    storeArtifact(artifact)
    return final_result
}