interface Task {
    description: string;
    dueTime: string;
    status: string;
}

export async function createTask(description: string, dueTime: string): Promise<Task> {
    const newTask: Task = {
        description,
        dueTime,
        status: "pending",
    };

    // For now, we simply log the task and return it
    console.log("Task created:", newTask);
    return newTask;
}
