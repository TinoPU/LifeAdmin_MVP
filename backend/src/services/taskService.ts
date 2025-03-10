import supabase from "../database/client"
import {Task, UUID} from "../types/db";

export const createTask = async (task: Omit<Task, "id">) => {
    const { data, error } = await supabase.from("tasks").insert([task]).select();
    if (error) throw error;
    return data;
};

export const getTasksForUser = async (userId: UUID) => {
    const { data, error } = await supabase.from("tasks").select("*").eq("user_id", userId);
    if (error) throw error;
    return data;
};
