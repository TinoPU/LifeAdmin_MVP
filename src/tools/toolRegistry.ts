import {createTaskTool} from "./taskTools";

export type ToolFunction = (properties: any, user_id: string) => Promise<{
    success: boolean;
    message: string;
    updated_parameters?: any
}>;
export interface ToolProperty {
    type: string;
    description: string;
    enum?: string[]
}
export interface ToolSchema {
    name: string;
    description: string;
    input_schema: {
        type: string;
        properties: Record<string, ToolProperty>
        required: string[]
    };
}
export interface ToolResult {
    success: boolean;
    message: string;
    updated_parameters?: any
}

export const toolRegistry: Record<string, {
    function: ToolFunction;
    schema: ToolSchema;
}> = {
    create_task: {
        function: createTaskTool,
        schema: {
            name: "create_task",
            description: "Creates a new task with a due date and a description and generates a reminder schedule.",
            input_schema: {
                type: "object",
                properties: {
                    "name": {
                        type: "string",
                        description:"The name of the task."
                    },
                    "due_date": {
                        type: "string",
                        description: "The due date of the task (ISO 8601 format) it must contain a time (this can be an estimate if no explicit time is provided)."
                    },
                    "task_description": {
                        type: "string",
                        description: "Supplementary info about what the task is about"
                    },
                    "reminder_info": {
                        type: "string",
                        description: "Supplementary info the user may have provided that can help create a reminder schedule"
                    }
                },
                required: ["name", "due_date"]
            }
        }
    }
    // update_task: {
    //     function: updateTaskTool,
    //     schema: {
    //         name: "update_task",
    //         description: "Updates an existing task’s name or due date.",
    //         parameters: {
    //             userId: { type: "string", required: true, description: "The unique ID of the user." },
    //             taskId: { type: "number", required: true, description: "The ID of the task to update." },
    //             newTaskName: { type: "string", required: false, description: "The new name of the task." },
    //             newDueDate: { type: "string", required: false, description: "The new due date of the task (ISO 8601 format)." }
    //         }
    //     }
    // },
    // update_reminder: {
    //     function: updateReminderTool,
    //     schema: {
    //         name: "update_reminder",
    //         description: "Updates an existing reminder for a task.",
    //         parameters: {
    //             userId: { type: "string", required: true, description: "The unique ID of the user." },
    //             taskId: { type: "number", required: true, description: "The ID of the task with the reminder." },
    //             newReminderTime: { type: "string", required: true, description: "The new reminder time (ISO 8601 format)." }
    //         }
    //     }
    // }
}

/**
 * Executes a tool dynamically based on its name.
 */
export async function executeTool(toolName: string, properties: any, user_id:string) {
    const tool = toolRegistry[toolName];

    if (!tool) {
        return { success: false, message: `Tool '${toolName}' not found.` };
    }

    return await tool.function(properties, user_id);
}

/**
 * Retrieves tool names for LLM context.
 */
export function getToolRegistry() {
    return Object.keys(toolRegistry);
}

/**
 * Retrieves full tool schema descriptions for LLM context.
 */
export function getToolSchema(): ToolSchema[] {
    return Object.values(toolRegistry).map(tool => tool.schema);
}

export function getToolByName(toolName: string): ToolSchema | null {
    const tool = toolRegistry[toolName];
    return tool.schema;
}
