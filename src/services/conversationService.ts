import redisClient from '../database/redis';

class ConversationService {
    async getRecentMessages(user_id: string) {
        const redisKey = `conversation:${user_id}`;
        const recentMessages = await redisClient.lRange(redisKey, 0, 9);
        return recentMessages.reverse() // Reverse for chronological order
    }

    async isStillLatestUserMessage(user_id: string, message: string) {
        const redisKey = `latestMessage:${user_id}`
        const recentMessages = await redisClient.lRange(redisKey, 0, 0);
        const latestMessage = recentMessages[0];
        console.log(message, latestMessage)
        return message === latestMessage;
    }
}

export default new ConversationService();
