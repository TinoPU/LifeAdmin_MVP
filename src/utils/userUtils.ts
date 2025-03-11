import {Contact} from "../types/incomingWAObject/WAIncomingValueObject";
import redisClient from "../database/redis";
import supabase from "../database/supabaseClient";
import {createNewUser} from "./supabaseActions";


export async function fetchUserId(contact: Contact) {
    const wa_user_id = contact.wa_id
    const redisKey = `user:${wa_user_id}`;

    // 1. Check if user_id is in Redis cache
    const cachedUserId = await redisClient.get(redisKey);
    if (cachedUserId) {
        console.log("Cache hit! Found user ID in Redis.");
        return cachedUserId; // Return cached value immediately
    }

    // 2. Query database if cache is empty
    const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("wa_id", wa_user_id)
        .single();

    if (error || !data) {
        console.log("User not found in DB. Creating new user...");
        // 3. Create user if they don't exist
        const newUser = await createNewUser(contact);
        return newUser.id;
    }
    // 4. Store user_id in Redis for future requests
    await redisClient.set(redisKey, data.id, {EX: 86400}); // Expires in 24 hours
    return data.id;
}