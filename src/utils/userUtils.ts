import {Contact} from "../types/incomingWAObject/WAIncomingValueObject";
import redisClient from "../database/redis";
import supabase from "../database/supabaseClient";
import {createNewUser} from "./supabaseActions";
import {User} from "../types/db";
import {UserContext} from "../types/agent";
import {formatDate} from "./transformationUtils";


export async function fetchUserId(contact: Contact) {
    const wa_user_id = contact.wa_id
    const redisKey = `user:${wa_user_id}`;

    // 1. Check if user_id is in Redis cache
    const cachedUserId = await redisClient.get(redisKey);
    if (cachedUserId) {
        console.log("Cache hit! Found user ID in Redis.");
        console.log(cachedUserId)
        return JSON.parse(cachedUserId) as User; // Return cached value immediately
    }

    // 2. Query database if cache is empty
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("wa_id", wa_user_id)
        .single();

    if (error || !data) {
        console.log("User not found in DB. Creating new user...");
        // 3. Create user if they don't exist
        const newUser = await createNewUser(contact);
        redisClient.set(redisKey, JSON.stringify(newUser), {EX: 86400}).catch()
        return newUser as User;
    }
    // 4. Store user_id in Redis for future requests
    await redisClient.set(redisKey, JSON.stringify(data), {EX: 86400}); // Expires in 24 hours
    return data;
}


export function constructUserContext (user: User) {

    const timeNow = new Date()
    const userTime: string = new Date(timeNow.getTime() + (user.user_timezone ?? 0) * 60 * 60 * 1000).toISOString();

    const userContext: UserContext = {
        name: user.name,
        time_at_user_location: formatDate(userTime),
        language: user.language
    }

    return userContext
}