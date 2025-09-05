import {UUID} from "./message";
import {modelConfig} from "../config/modelConfig";
import {ChatPromptClient} from "langfuse";
import {User} from "./db";

export interface UserContext {
    name?: string,
    time_at_user_location: string
    language?: string
}

export interface TaskContextObject {
    task_id:UUID
    name?: string,
    task_description?: string,
    due_date?: string,
    status?: string
}

export interface AgentContext {
    taskContext: TaskContextObject[] | string,
    userContext: UserContext
}

type AgentExecutionState = {
    status: "pending" | "success" | "failed";
    result?: AgentResponse;
    error?: Error;
};

export interface ExecutionContext {
    id: UUID,
    agent_messages: string[],
    session_id?: UUID,
    user_id?: UUID,
    execution_start: string,
    execution_end?: string,
    status: string,
    iteration_count: number,
    agentStatus: Record<string, AgentExecutionState>
}

interface AgentSkill {
    // A unique identifier for this skill within the context of this agent
    // (e.g., "currency-converter", "generate-image-from-prompt", "summarize-text-v2").
    // Clients MAY use this ID to request a specific skill if the agent supports such dispatch.
    id: string;
    // Human-readable name of the skill (e.g., "Currency Conversion Service", "Image Generation AI").
    name: string;
    // Detailed description of what the skill does, its purpose, and any important considerations.
    // [CommonMark](https://commonmark.org/) MAY be used for rich text formatting.
    description?: string | null;
    // Array of keywords or categories for discoverability and categorization
    // (e.g., ["finance", "conversion"], ["media", "generative ai", "image"]).
    tags?: string[] | null;
    // Array of example prompts, inputs, or use cases illustrating how to use this skill
    // (e.g., ["convert 100 USD to EUR", "generate a photorealistic image of a cat wearing a wizard hat"]).
    // These help clients (and potentially end-users or other agents) understand how to formulate requests for this skill.
    examples?: string[] | null;
    // Overrides `agentCard.defaultInputModes` specifically for this skill.
    // If `null` or omitted, the agent's `defaultInputModes` apply.
    inputModes?: string[] | null; // Array of MIME types
    // Overrides `agentCard.defaultOutputModes` specifically for this skill.
    // If `null` or omitted, the agent's `defaultOutputModes` apply.
    outputModes?: string[] | null; // Array of MIME types
}


export interface AgentCard {
    name: string,
    description?: string | null;
    // Array of [MIME types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)
    // the agent generally accepts as input across all skills, unless overridden by a specific skill.
    // Default if omitted: `["text/plain"]`. Example: `["text/plain", "image/png"]`.
    defaultInputModes?: string[];
    // Array of MIME types the agent generally produces as output across all skills, unless overridden by a specific skill.
    // Default if omitted: `["text/plain"]`. Example: `["text/plain", "application/json"]`.
    defaultOutputModes?: string[];
    // An array of specific skills or capabilities the agent offers.
    // Must contain at least one skill if the agent is expected to perform actions beyond simple presence.
    skills?: AgentSkill[];
}

export interface Agent {
    name: string,
    input: Omit<{role: string, content: string }, "externalId" | "traceIdType">[]
    prompt: ChatPromptClient,
    modelConfig?: modelConfig
    tools?: any[],
    type?: string
}

export interface OrchestratorResponse {
    agents: {
        [agentName: string]: {
            reason: string;
            task: string;
        }
    }
}

export interface AgentResponse {
    response?: string,
    reason?: string,
    data?: any | null
}


export interface AgentProps {
    user_message: string,
    context: ExecutionContext,
    user: User
    history: string[],
    prompt?: string,
    trace: any
}