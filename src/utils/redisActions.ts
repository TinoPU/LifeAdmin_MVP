import redisClient from "../database/redis";
import {User} from "../types/db";
import {formatDate} from "./transformationUtils";
import {Artifact} from "../types/artifacts";
import {baseLogger} from "../services/loggingService";
import {Context} from "node:vm";
export async function cacheWhatsappMessage(user: User, actor: string, message: string, timestamp: string) {

    const redisKey = `conversation:${user.id}`;
    await redisClient.lPush(redisKey, `${formatDate(timestamp)} ${actor}: ${message}`);
    await redisClient.lTrim(redisKey, 0, 9); // Keep last 10 messages

}

export async function cacheTelegramMessage(user: User, actor: string, message: string, timestamp: string) {

    const redisKey = `conversation:${user.id}`;
    await redisClient.lPush(redisKey, `${formatDate(timestamp)} ${actor}: ${message}`);
    await redisClient.lTrim(redisKey, 0, 9); // Keep last 10 messages

}

export async function cacheLatestUserMessage(user: User, message:string) {
    const redisKey = `latestMessage:${user.id}`
    await redisClient.lPush(redisKey, message)
    await redisClient.lTrim(redisKey, 0, 0)
}

export async function cacheArtifact(artifact: Artifact) {
    const redisKey: string = `artifact:${artifact.agent_name}:${artifact.user_id}`
    await redisClient.lPush(redisKey, JSON.stringify(artifact, null, 2))
    await redisClient.lTrim(redisKey, 0, 3);
}

export async function getArtifactsFromCache(agent_name: string, user_id: string) {
    const redisKey = `artifact:${agent_name}:${user_id}`;
    try {
        return await redisClient.lRange(redisKey, 0, 3);
    } catch (err) {
        await baseLogger.error("Error fetching from Redis:", err as Context);
        throw err;
    }
}