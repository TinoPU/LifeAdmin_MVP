import redisClient from "../database/redis";
import {User} from "../types/db";


export async function cacheWhatsappMessage(user: User, actor: string, message: string, timestamp: string) {

    const redisKey = `conversation:${user.id}`;
    await redisClient.lPush(redisKey, JSON.stringify({ timestamp: timestamp, role: actor, message: message },null, 2));
    await redisClient.lTrim(redisKey, 0, 9); // Keep last 10 messages

}