import {AgentContext, ExecutionContext} from "../types/agent";
import {constructUserContext} from "./userUtils";
import {User} from "../types/db";
import {constructTaskContext} from "./taskUtils";
import {uuid} from "@supabase/supabase-js/dist/main/lib/helpers";


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
        agent_messages: [],
        execution_start: new Date().toISOString(),
        status: "Started",
        iteration_count: 0,
        agentStatus: {}
    }
}

export const normalizeContent = (res: any) => {
    if (Array.isArray(res)) {
        res.forEach(r => normalizeContent(r));
    } else if (res && typeof res === "object") {
        for (const key in res) {
            if (typeof res[key] === "string") {
                try {
                    const parsed = JSON.parse(res[key]);
                    res[key] = parsed; // replace with parsed object
                } catch {
                    // not valid JSON string, leave it alone
                }
            } else {
                normalizeContent(res[key]);
            }
        }
    }
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

