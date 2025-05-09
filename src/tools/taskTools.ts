import {createReminder, createTask, deleteTask, updateTask} from "../utils/supabaseActions";
import {Task, User} from "../types/db";


export async function createTaskTool(
    properties: {
        name: string,
        due_date: string,
        description ? : string,
        reminder_array? : number[]
    }, user: User, trace:any) {
    const missingFields = [];

    if (!properties.name) missingFields.push("name");
    if (!properties.due_date) missingFields.push("due_date");

    if (missingFields.length > 0) {
        return Promise.resolve({
            success: false,
            message: `Error: Missing required fields: ${missingFields.join(", ")}.`
        });
    }

    if (!user.id) {
        return Promise.resolve({
            success: false,
            message: `Error: Missing user, task cannot be performed right now.`
        });
    }

    const dueDate = new Date(properties.due_date).getTime() - (user.user_timezone ?? 1) * 60 * 60 * 1000;
    const dueDate_as_string = new Date(dueDate).toISOString();


    // Create Task
    const taskResponse = await createTask({
        name: properties.name,
        due_date: dueDate_as_string,
        task_description: properties.description || "",
        source: "whatsapp",
        user_id: user.id
    })

    if (!taskResponse) {
        trace.event({name: "taskTool.error"})
        return Promise.resolve({
            success: false,
            message: "Error: could not execute task, task response is null or undefined."
        })
    }
    if (!taskResponse.success) {
        trace.event({name: "taskTool.success"})
        return Promise.resolve({
            success: false,
            message: taskResponse.message
        })
    }

    if (properties.reminder_array) {
        let reminderResponses = [];
        for (const reminder of properties.reminder_array) {
            const reminderDate = new Date(dueDate - reminder * 60 * 1000).toISOString();
            const reminderResponse = createReminder({
                reminder_time: reminderDate,
                task_id: taskResponse.id,
                user_id: user.id

            });
            reminderResponses.push(reminderResponse);
        }

        return Promise.all(reminderResponses).then(async (responses) => {
            // Check the success of each reminder response
            for (const response of responses) {
                if (!response) {
                    throw new Error(`Failed to create reminder, supabase response: ${response}`)
                }
                if (!response.success) {
                    // Throw an error if any reminder creation fails
                    throw new Error(`Failed to create reminder: ${response.message}`);
                }
            }
            trace.event({name: "taskTool.update", metadata: responses});
            return Promise.resolve({
                success: true,
                message: "Task and Reminders created successfully"
            })
        }).catch((error) => {
            trace.event("taskTool.error", error.message);
            return {
                success: false,
                message: `Task created successfully, but at least one reminder failed: ${error.message}`
            };
        });
    } else {
        trace.event("taskTool.success");
        return Promise.resolve({
            success: true,
            message: "Task and Reminders created successfully"
        })
    }
}

export async function modifyTaskTool(
    properties: {
        task_id: string,
        method: string,
        task ? : Task,
        reminder_info ? : string
    }, user: User, trace:any) {
    if (properties.method === "DELETE") {
        await deleteTask(properties.task_id)
        trace.event({name: "modifyTaskTool.success", statusMessage: "Deleted task"})
        return
    }
    if (properties.method === "UPDATE") {
        if (!properties.task) {
            trace.event({name: "modifyTaskTool.error", statusMessage: "Missing Parameters"})
            return {
                success: false,
                message: `No task parameters provided`
            }
        }
        else {
            await updateTask(properties.task_id, properties.task)
            trace.event({name: "modifyTaskTool.success", statusMessage: "Updated task"})
            return
        }
    }
    else {
        trace.event({name: "modifyTaskTool.error"})
        return {
            success: false,
            message: `Method not supported: ${properties.method}`
        }
    }
}