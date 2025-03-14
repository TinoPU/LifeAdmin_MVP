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