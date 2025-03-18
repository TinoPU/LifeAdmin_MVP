import { createClient } from 'redis';
import { Queue } from "bullmq";
import dotenv from "dotenv";

dotenv.config()

const redisClient = createClient({
    url: process.env.REDIS_REDIS_URL, // Make sure this is set in .env
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Connect Redis once when the server starts
(async () => {
    try {
        await redisClient.connect();
        console.log('🔗 Connected to Redis');
        // await redisClient.flushAll()
        // console.log("db flushed")

    } catch (err) {
        console.error('❌ Redis connection error:', err);
    }
})();
export const embeddingQueue = new Queue("embedding_tasks", { connection: {url: process.env.REDIS_REDIS_URL|| "" }});


// Handle graceful shutdown
process.on('SIGINT', async () => {
    await redisClient.quit();
    console.log('🔴 Redis disconnected');
    process.exit(0);
});

export default redisClient;