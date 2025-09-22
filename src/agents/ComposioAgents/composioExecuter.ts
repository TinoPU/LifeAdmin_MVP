import {Agent, AgentProps} from "../../types/agent";
import {callAgent} from "../../services/agentService";
import {composio} from "../../tools/composioClient";
import {normalizeContent} from "../../utils/agentUtils";


export default async function ComposioExecuter(agent: Agent, props: AgentProps, span: any) {
    const break_reasons = ["end_turn", "max_tokens", "stop_sequence", "pause_turn", "refusal"]

    let continue_conversation = undefined
    let iteration = 0
    let stop_reason = ""
    let result = undefined

    while (!break_reasons.includes(stop_reason) && iteration <5) {
        const msg = await callAgent(agent, span, continue_conversation);
        iteration += 1
        stop_reason = msg.stop_reason
        result = await composio.provider.handleToolCalls(
            props.user.id,
            msg);
        span.event({name: "tool_called", input: msg, output: result})
        if (stop_reason == "tool_use") {
            continue_conversation = [
                {role: "assistant" as const, content: msg.content[0]?.text || ""},
                {role: "user" as const , content: JSON.stringify(result, null, 2) || ""}
            ];
        }
    }

    return normalizeContent(result);
}