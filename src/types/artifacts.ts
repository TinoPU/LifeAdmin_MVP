import { UUID } from "./db";

export interface Event {
    id: string;
    title: string;
    summary?: string;
    sources?: string[];
    timestamp?: string;
}

export interface Step {
    id: string;
    iteration: number;
    type: string;
    name?: string;
    query: string;
    resultSummary: string; // summarized/truncated result
    fullResultRef?: string; // optional pointer to raw log or S3 file
    executedAt?: string;
    status?: "pending" | "success" | "failed";
}

export interface Artifact {
    id: UUID;
    version: string; // e.g. "v1"
    type: string;
    name: string;
    query: string;
    created_at: string;
    user_id: UUID;
    platform: "whatsapp" | "telegram" | "other";
    agent?: string;
    orchestratorSummary?: string; // brief of which agents/tasks chosen
    traceId?: string; // link to Langfuse trace
    parent_message_id?: string;
    session_id?: string;
    events?: Event[];
    steps?: Step[];
    finalResult?: string; // summarized final response
    metadata?: Record<string, any>; // flexible for future needs
}
