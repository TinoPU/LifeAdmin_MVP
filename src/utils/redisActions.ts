import redisClient from "../database/redis";
import {User} from "../types/db";
import {formatDate} from "./transformationUtils";


export async function cacheWhatsappMessage(user: User, actor: string, message: string, timestamp: string) {

    const redisKey = `conversation:${user.id}`;
    await redisClient.lPush(redisKey, `${formatDate(timestamp)} ${actor}: ${message}`);
    await redisClient.lTrim(redisKey, 0, 9); // Keep last 10 messages

}