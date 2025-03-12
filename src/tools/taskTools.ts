

export async function createTaskTool(
    parameters: {
        name: string,
        due_date: string,
        description ? : string,
        reminder_info ? : string
    }) {
    const missingFields = [];

    if (!parameters.name) missingFields.push("name");
    if (!parameters.due_date) missingFields.push("due_date");

    if (missingFields.length > 0) {
        return Promise.resolve({
            success: false,
            message: `Error: Missing required fields: ${missingFields.join(", ")}.`
        });
    }









    return Promise.resolve({
        success: true,
        message: "done"})
}