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

export const embeddingQueue = new Queue("embeddings", {connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || "6379", 10)
    }});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await redisClient.quit();
    console.log('🔴 Redis disconnected');
    process.exit(0);
});

export default redisClient;