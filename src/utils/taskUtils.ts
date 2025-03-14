import {Task, User} from "../types/db";
import {getTasksForUser} from "./supabaseActions";
import {TaskContextObject} from "../types/agent";


export async function constructTaskContext (user: User) {
    if (user.id) {
        const data = await getTasksForUser(user.id)
        if (data.data) {
            const tasks: Task[] = data.data
            const taskContext: TaskContextObject[] = []
            for (const task of tasks) {
                const taskObject: TaskContextObject = {
                    name: task.name,
                    task_description: task.task_description,
                    due_date: task.due_date,
                    status: task.status
                }
                taskContext.push(taskObject)
            }
            return taskContext
        }
        else {
            console.log(`Error fetching tasks for Users: ${data.message}`)
            return `Error fetching tasks for Users: ${data.message}`
        }
    } else {
        console.log("Error getting user Data, no User provided")
        return "Error getting user Data, no User provided"
    }
}