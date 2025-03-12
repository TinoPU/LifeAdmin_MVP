import {createReminder, createTask} from "../utils/supabaseActions";
import {response} from "express";


export async function createTaskTool(
    properties: {
        name: string,
        due_date: string,
        description ? : string,
        reminder_info ? : string
    }, user_id: string) {
    const missingFields = [];

    if (!properties.name) missingFields.push("name");
    if (!properties.due_date) missingFields.push("due_date");

    if (missingFields.length > 0) {
        return Promise.resolve({
            success: false,
            message: `Error: Missing required fields: ${missingFields.join(", ")}.`
        });
    }

    // Create Task
    const taskResponse = await createTask({
        name: properties.name,
        due_date: properties.due_date,
        task_description: properties.description || "",
        source: "whatsapp",
        user_id: user_id
    })

    if (!taskResponse) {
        return Promise.resolve({
            success: false,
            message: "Error: could not execute task, task response is null or undefined."
        })
    }
    if (!taskResponse.success) {
        return Promise.resolve({
            success: false,
            message: taskResponse.message
        })
    }

    let reminders = []
    // Add reminders #TODO: add dynamic reminder schedule at some point
    const reminder_3h = new Date(new Date(properties.due_date).getTime() - 3 * 60 * 60 * 1000).toISOString();
    const reminder_1d = new Date(new Date(properties.due_date).getTime() - 24 * 60 * 60 * 1000).toISOString();

    reminders.push([reminder_1d, reminder_3h]);

    let reminderResponses = [];

    for (const reminder of reminders[0]) {
        const reminderResponse = createReminder({
            reminder_time: reminder,
            task_id: taskResponse.id,
            user_id: user_id
        });
        reminderResponses.push(reminderResponse);
    }

    return Promise.all(reminderResponses).then(async (responses) => {
        if (responses.length <= 1) {
            throw new Error(`Failed to create reminders, supabase responses: ${responses}`)
        }
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
        console.log("All reminders created:", responses);
        return Promise.resolve({
            success: true,
            message: "Task and Reminders created successfully"
        })
    }).catch((error) => {
        console.error("Error creating reminders:", error.message);
        return {
            success: false,
            message: `Task created successfully, but at least one reminder failed: ${error.message}`
        };
    });
}