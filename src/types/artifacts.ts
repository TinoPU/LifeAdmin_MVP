import { UUID } from "./db";

export interface Event {
    id: string;
    title: string;
    summary?: string;
    sources?: string[];
    timestamp?: string;
}

export interface Step {
    id: number;
    type: "tool_use" | "agent";
    name?: string;
    input?: string;
    executedAt?: string;
    status?: "pending" | "success" | "failed";
    output: Record<string, any> | string;
}

export interface Artifact {
    id: UUID;
    parent_artifact_id?: UUID
    agent_name: string;
    input?: string;
    status: "pending"| "in_progress" | "completed" | "failed" | "cancelled"
    created_at: string;
    user_id: UUID;
    traceId: string; // link to Langfuse trace
    parent_message_id?: string;
    session_id?: string;
    events?: Event[];
    steps?: Step[];
    sub_artifacts: Artifact[]
    final_output?: Record<string, any> | string;
    metadata?: Record<string, any>; // flexible for future needs
}
