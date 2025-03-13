import { createClient } from 'redis';
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

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await redisClient.quit();
    console.log('🔴 Redis disconnected');
    process.exit(0);
});

export default redisClient;