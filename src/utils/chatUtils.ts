import {User} from "../types/db";
import {Session} from "../types/message";
import redisClient from "../database/redis";
import supabase from "../database/supabaseClient";
import {baseLogger} from "../services/loggingService";

export async function getSession(user: User): Promise<Session> {

    const redisKey = `session:${user.id}`
    const cachedSession = await redisClient.get(redisKey);
    if (cachedSession) {
        await redisClient.expire(redisKey, 86400)
        return JSON.parse(cachedSession)
    } else {
        const sessionInfo = {
            user_id: user.id,
            session_start: new Date().toISOString(),
            status: "active",
            message_count: 0,

        }
        const {data, error} = await supabase.from("sessions").insert(sessionInfo).select('*').single()
        await redisClient.set(redisKey, JSON.stringify(data))
        await redisClient.expire(redisKey, 86400)
        if (error) {
           await baseLogger.error("Error creating session", {error: error})
        }
        return data
    }
}
