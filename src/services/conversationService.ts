import redisClient from '../database/redis';
import generateUserMessageResponse from './llmService';

class ConversationService {
    async getRecentMessages(user_id: string) {
        const redisKey = `conversation:${user_id}`;
        const recentMessages = await redisClient.lRange(redisKey, 0, 9);
        return recentMessages.reverse().map(msg => JSON.parse(msg)); // Reverse for chronological order
    }
    async generateResponse(user_id: string) {
        const conversationHistory = await this.getRecentMessages(user_id); // Fetch context
        return generateUserMessageResponse(conversationHistory.toString());
    }
}

export default new ConversationService();
