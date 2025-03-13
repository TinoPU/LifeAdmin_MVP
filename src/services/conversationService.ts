import redisClient from '../database/redis';

class ConversationService {
    async getRecentMessages(user_id: string) {
        const redisKey = `conversation:${user_id}`;
        const recentMessages = await redisClient.lRange(redisKey, 0, 9);
        return recentMessages.reverse() // Reverse for chronological order
    }
}

export default new ConversationService();
