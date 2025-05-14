import {UUID} from "./db";

export interface UserContext {
    name?: string,
    time_at_user_location?: string
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

interface agentSuccess {
    taskAgent?: boolean
    searchAgent?: boolean
}

export interface ExecutionContext {
    id: UUID,
    agent_messages: string[],
    session_id?: UUID,
    user_id?: UUID,
    execution_start: string,
    execution_end?: string,
    status: string,
    iteration_count: number,
    agentSuccess?: agentSuccess
}