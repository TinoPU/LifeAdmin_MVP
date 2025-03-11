import {Message} from "../types/message";
import redisClient from "../database/redis";


export async function cacheWhatsappMessage(user_id: string, actor: string, message: string, timestamp: string ) {

    const redisKey = `conversation:${user_id}`;
    await redisClient.lPush(redisKey, JSON.stringify({ role: actor, message: message, timestamp: timestamp }));
    await redisClient.lTrim(redisKey, 0, 9); // Keep last 10 messages

}