import { createClient } from 'redis';
import { Queue } from "bullmq";
import dotenv from "dotenv";
import {baseLogger} from "../services/loggingService";

dotenv.config()

const redisClient = createClient({
    url: process.env.REDIS_REDIS_URL, // Make sure this is set in .env
});

redisClient.on('error', (err) => baseLogger.error('Redis Client Error', {error: err}));

// Connect Redis once when the server starts
(async () => {
    try {
        await redisClient.connect();
        const foundKeys = [];
        for await (const key of redisClient.scanIterator()) {
            foundKeys.push(key);
        }
        await baseLogger.info("Redis connected", {keys: foundKeys})
        const clientList: string = await redisClient.sendCommand(['CLIENT', 'LIST']);
        await baseLogger.info('👥 Redis clients:\n', {clients:clientList});
        // await redisClient.flushAll()
        // console.log("db flushed")

    } catch (err) {
        await baseLogger.error('Redis connection error:', {error: err});
    }
})();
export const embeddingQueue = new Queue("embedding_tasks", { connection: {url: process.env.REDIS_REDIS_URL|| "" }});


// Handle graceful shutdown
process.on('SIGINT', async () => {
    await redisClient.quit();
    await baseLogger.info('Redis disconnected');
    process.exit(0);
});

export default redisClient;