import {User} from "./db";

export type ToolFunction = (properties: any, user: User, trace: any) => Promise<{
    success: boolean;
    message: string;
    updated_parameters?: any
}>;
export interface ToolProperty {
    type: string;
    description: string;
    enum?: string[],
    properties?: Record<string, ToolProperty>;
    items?: Record<string, ToolProperty>[]
}
export interface ToolSchema {
    name: string;
    description: string;
    input_schema: {
        type: string;
        items?: Record<string, ToolProperty>[]
        properties: Record<string, ToolProperty>
        required: string[]
    };
}
export interface ToolResult {
    success: boolean;
    message: string;
    updated_parameters?: any
}