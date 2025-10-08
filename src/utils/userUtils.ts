import {Contact} from "../types/incomingWAObject/WAIncomingValueObject";
import {TelegramUser} from "../types/telegram/TelegramIncomingObject";
import redisClient from "../database/redis";
import supabase from "../database/supabaseClient";
import {createNewUser, createNewTelegramUser} from "./supabaseActions";
import {User} from "../types/db";
import {UserContext} from "../types/agent";
import {formatDate} from "./transformationUtils";
import {baseLogger} from "../services/loggingService";


export async function fetchUser(contact: Contact) {
    const wa_user_id = contact.wa_id
    const redisKey = `user:${wa_user_id}`;

    // 1. Check if user_id is in Redis cache
    const cachedUserId = await redisClient.get(redisKey);
    if (cachedUserId) {
        await baseLogger.info("User Id found in cache", {cachedUserId: cachedUserId})
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
        user_timezone: user.user_timezone,
        language: user.language
    }

    return userContext
}

export async function fetchTelegramUser(telegramUser: TelegramUser) {
    const telegram_id = telegramUser.id.toString();
    const redisKey = `user:telegram:${telegram_id}`;

    // 1. Check if user_id is in Redis cache
    const cachedUserId = await redisClient.get(redisKey);
    if (cachedUserId) {
        await baseLogger.info("Telegram User Id found in cache", {cachedUserId: cachedUserId})
        return JSON.parse(cachedUserId) as User; // Return cached value immediately
    }

    // 2. Query database if cache is empty
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("telegram_id", telegram_id)
        .single();

    if (error || !data) {
        console.log("Telegram User not found in DB. Creating new user...");
        // 3. Create user if they don't exist
        const newUser = await createNewTelegramUser(telegramUser);
        redisClient.set(redisKey, JSON.stringify(newUser), {EX: 86400}).catch()
        return newUser as User;
    }
    // 4. Store user_id in Redis for future requests
    await redisClient.set(redisKey, JSON.stringify(data), {EX: 86400}); // Expires in 24 hours
    return data;
}

export async function getUserByTelegramId(telegramId: string): Promise<User | null> {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("telegram_id", telegramId)
        .single();

    if (error || !data) {
        return null;
    }
    return data;
}