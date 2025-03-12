import conversationService from "../services/conversationService";
import { callLLMOrchestration, callLLMToolFeedback } from "../services/llmService";
import {executeTool, getToolRegistry, getToolSchema, toolRegistry} from "../tools/toolRegistry";
import { storeMessage, storeExecutionLog } from "../database/supabaseActions";
import { sendMessage } from "../services/messageService";
import { cacheMessage, getCachedMessages } from "../lutils/redisActions";
import {WAIncomingMessage} from "../types/incomingWAObject/WAIncomingMessage";
import {cacheWhatsappMessage} from "../utils/redisActions";

export class AgentManager {
    async handleNewRequest(user_id: string, messageObject: WAIncomingMessage) {
        try {
            const message = messageObject.text?.body
            if (typeof message !== "string") {
                console.error("Invalid message: Expected a string but received", message);
                return; // Stop execution if the message is not a string
            }

            // Step 1: Orchestration
            const history = await conversationService.getRecentMessages(user_id);
            cacheWhatsappMessage(user_id, "user", message, messageObject.timestamp).catch(error => console.error("Error caching WhatsApp message:", error));

            const toolSchema = getToolSchema();
            const llmResponse = await callLLMOrchestration(message, history, toolSchema);

            const { tool, parameters, response } = llmResponse;


            // Step 2: LLM Response check
            if (tool === "none") {
                // No tool needed, just respond to user
                await sendMessage(userId, response);
                await storeMessage(userId, message, response);
                return;
            }

            // Step 3: Execute the tool
            const executionResult = await executeTool(tool, parameters, user_id);

            // Step 4: Pass execution result to LLM for confirmation
            const toolFeedback = await callLLMToolFeedback(message, history, tool, parameters, executionResult);

            const { next_action, response: finalResponse } = toolFeedback;

            // Step 5: Handle tool feedback
            if (next_action === "retry_tool") {
                return this.retryToolExecution(userId, tool, toolFeedback.parameters);
            } else {
                // Send final response to user (either success confirmation or clarification)
                await sendMessage(userId, finalResponse);
                await storeExecutionLog(userId, tool, executionResult, finalResponse);
            }

            // Step 6: Cache messages and sync to DB later
            await cacheMessage(userId, message, finalResponse);
        } catch (error) {
            console.error("Error in AgentManager:", error);
            await sendMessage(userId, "Sorry, something went wrong while processing your request.");
        }
    }

    async retryToolExecution(userId: string, tool: string, parameters: any) {
        try {
            // Retry tool execution with updated parameters
            const retryResult = await executeTool(tool, parameters);

            // Notify user if retry was successful
            await sendMessage(userId, `I've retried executing the tool and here is the result: ${retryResult.message}`);

            // Store retry logs
            await storeExecutionLog(userId, tool, retryResult, "Retried execution");

        } catch (error) {
            console.error("Error retrying tool execution:", error);
            await sendMessage(userId, "I attempted to retry, but something went wrong.");
        }
    }
}





