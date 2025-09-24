import {Agent, AgentContext, AgentProps, ExecutionContext} from "../types/agent";
import {constructUserContext} from "./userUtils";
import {User} from "../types/db";
import {constructTaskContext} from "./taskUtils";
import {uuid} from "@supabase/supabase-js/dist/main/lib/helpers";
import {Artifact, Step} from "../types/artifacts";
import {cacheArtifact, getArtifactsFromCache} from "./redisActions";
import {logger} from "@composio/core";


export async function constructContext(user:User) {

    const userContext = constructUserContext(user)
    const taskContext = await constructTaskContext(user)

    const context:AgentContext = {
        userContext: userContext,
        taskContext: taskContext
    }
    return context
}

export function constructExecutionContext(): ExecutionContext {
    return {
        id: uuid(),
        user_id: "",
        agent_messages: [],
        execution_start: new Date().toISOString(),
        status: "Started",
        iteration_count: 0,
        agentStatus: {}
    }
}

export const normalizeContent = (res: any): any => {
    if (Array.isArray(res)) {
        return res.map(r => normalizeContent(r));
    } else if (res && typeof res === "object") {
        const copy: any = Array.isArray(res) ? [] : { ...res };
        for (const key in res) {
            const val = res[key];
            if (typeof val === "string") {
                try {
                    copy[key] = JSON.parse(val);
                } catch {
                    copy[key] = val;
                }
            } else {
                copy[key] = normalizeContent(val);
            }
        }
        return copy;
    }
    // primitive values
    return res;
};


export class ComposioUtils {
    private static toolconfig_dict: Record<string, string> = {
        GMAIL: "ac_IqSbnGGgCbXh",
        NOTION: "ac_yQJRcnWZouqe"
    };

    public static getToolConfig(tool: string, defaultValue: string = "NOT_FOUND"): string {
        return this.toolconfig_dict[tool] ?? defaultValue;
    }
}

export function createArtifact(agent: Agent, props: AgentProps): Artifact {
    return {
        id: uuid(),
        agent_name: agent.name,
        input: props.prompt,
        status: "pending" as const,
        created_at: new Date().toISOString(),
        user_id: props.user.id,
        traceId: props.trace.id,
        parent_message_id: props.user_message,
        steps: [],
        events: [],
        sub_artifacts: [],
        final_output: undefined,
        metadata: undefined
    }
}


export function addArtifactStep (artifact: Artifact, step:Step) {
    artifact?.steps?.push(step)
}

export function storeArtifact (artifact:Artifact) {
    cacheArtifact(artifact).then(r => {})
    logger.info("artifact Stored", {artifact: artifact})
}

export async function getArtifacts(user_id: string, agent_name: string) {
    const artifacts = await getArtifactsFromCache(agent_name, user_id)
    return artifacts.map(s => JSON.parse(s))
}

export function condenseArtifactStrings (artifacts:Artifact[]) {
    const condensed_artifacts = []
    for (const a of artifacts) {
        let condensed_a = {
            input: a.input,
            final_output: a.final_output
        }
        condensed_artifacts.push(JSON.stringify(condensed_a, null, 2))
    }
    return condensed_artifacts
}