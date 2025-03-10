export type UUID = string;

export interface User {
    id: UUID;
    created_at?: string;
    phone_number: string;
    name?: string;
    preferences?: Record<string, any>; // Optional JSON field
    updated_at?: string
}

export interface Task {
    id: UUID;
    created_at?: string;
    user_id: UUID;
    task_description?: string;
    name: string;
    due_time: string; // Store as ISO 8601 string
    status: "pending" | "completed" | "canceled";
    source: "whatsapp" | "email" | "calendar";
    type?: string;
    priority_level?: number;
    location?: string;
    documents?: string;
    links?: string;
    updated_at?: string
}

export interface Reminder {
    id: UUID;
    created_at?: string;
    task_id: UUID;
    user_id?: UUID;
    reminder_time: string;
    status: "scheduled" | "sent" | "cancelled";
    updated_at?: string
}

export interface Conversation {
    id: UUID;
    created_at?: string;
    session_id?: UUID;
    user_id?: UUID;
    message: string;
    response?: string;
}