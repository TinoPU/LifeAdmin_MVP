"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
async function createTask(description, dueTime) {
    const newTask = {
        description,
        dueTime,
        status: "pending",
    };
    // For now, we simply log the task and return it
    console.log("Task created:", newTask);
    return newTask;
}
