import {createTaskTool, modifyTaskTool} from "./taskTools";
import {User} from "../types/db";
import {askPerplexity} from "./perplexityTools";

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

export const toolRegistry: Record<string, {
    function: ToolFunction;
    schema: ToolSchema;
}> = {
    create_task: {
        function: createTaskTool,
        schema: {
            name: "create_task",
            description: "Creates a new task in the database with a due date and a description. The function also allows to create reminders for the user. Multiple reminders can be created, each must be represented as a number in minutes before a task is due. Important tasks should have more reminders than non important tasks, but no task should have more than 5.",
            input_schema: {
                type: "object",
                properties: {
                    "name": {
                        type: "string",
                        description: "The name of the task."
                    },
                    "due_date": {
                        type: "string",
                        description: "The due date of the task (ISO 8601 format without timezone) it must contain a time (this can be an estimate if no explicit time is provided)."
                    },
                    "task_description": {
                        type: "string",
                        description: "Supplementary info about what the task is about"
                    },
                    "reminder_array": {
                        type: "array",
                        description: "An array of integers. Each integer represents one reminder in minutes before a task is due. The maximum reminders are 5."
                    }
                },
                required: ["name", "due_date"]
            }
        }
    },
    modify_or_delete_task: {
        function: modifyTaskTool,
        schema: {
            name: "modify_or_delete_task",
            description: "This function updates or deletes tasks based on the specified method in parameters. If the method is: UPDATE ,then a task object is required according to the schema in parameters.task",
            input_schema: {
                type: "object",
                properties: {
                    task_id: {type: "string", description: "The unique ID of the task."},
                    method: {
                        type: "string",
                        description: "The method for whether a task should be updated or deleted",
                        enum: ["UPDATE", "DELETE"]
                    },
                    task: {
                        type: "object",
                        description: "All fields available for updating a task. Only fields that need to be updated should be added in the output, the rest should be ignored.",
                        properties: {
                            name: {type: "string", description: "The new name of the task"},
                            task_description: {type: "string", description: "The new description of the task"},
                            due_date: {type: "string", description: "The new due date of the task in ISO 8601"},
                            status: {type: "string", description:"The updated status of the task", enum: ["pending", "completed", "canceled"]}}
                        },
                    },
                required: ["task_id", "method"]
            }
        }
    },
    search_web_with_perplexity: {
        function: askPerplexity,
        schema: {
            name: "search_web_with_perplexity",
            description:
                "Engages in a conversation using the Sonar API. Which can search the web " +
                "Accepts an array of messages (each with a role and content) " +
                "and returns a ask completion response from the Perplexity model including citations from internet sources",
            input_schema: {
                type: "object",
                properties: {
                    messages: {
                        type: "array",
                        description: "Array of conversation messages",
                        items: [{
                                role: {
                                    type: "string",
                                    description: "Role of the message (e.g., system, user, assistant)",
                                },
                                content: {
                                    type: "string",
                                    description: "The content of the message",
                                },
                            }],
                        },
                    },
                required: ["messages"],
            },
        },
    }
}
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

/**
 * Executes a tool dynamically based on its name.
 */
export async function executeTool(toolName: string, properties: any, user:User, trace:any) {
    const tool = toolRegistry[toolName];

    if (!tool) {
        return { success: false, message: `Tool '${toolName}' not found.` };
    }

    return await tool.function(properties, user, trace);
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
