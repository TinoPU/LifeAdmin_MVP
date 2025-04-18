import conversationService from "../services/conversationService";
import { callLLMOrchestration, callLLMToolFeedback } from "../services/llmService";
import {executeTool, getToolByName, getToolSchema} from "../tools/toolRegistry";
import { storeMessage } from "../utils/supabaseActions";
import { sendMessage } from "../services/messageService";
import {WAIncomingMessage} from "../types/incomingWAObject/WAIncomingMessage";
import {cacheWhatsappMessage} from "../utils/redisActions";
import {Message} from "../types/message";
import {User} from "../types/db";
import {AgentContext} from "../types/agent";
import {constructContext} from "../utils/agentUtils";

export class AgentManager {
    async handleNewRequest(user: User, parent_message_id: string, messageObject: WAIncomingMessage) {
        try {
            if (!user.id) {
                return "No user provided"
            }

            const message = messageObject.text?.body
            if (typeof message !== "string") {
                console.error("Invalid message: Expected a string but received", message);
                return; // Stop execution if the message is not a string
            }

            // Step 1: Orchestration
            const history = await conversationService.getRecentMessages(user.id);
            cacheWhatsappMessage(user, "user", message, messageObject.timestamp).catch(error => console.error("Error caching WhatsApp message:", error));

            const context: AgentContext = await constructContext(user)

            const toolSchema = getToolSchema();
            const llmResponse = await callLLMOrchestration(message,context, history, toolSchema);
            const { tool, parameters, response } = llmResponse;

            // Step 2: LLM Response check
            if (tool === "none") {
                // No tool needed, just respond to user
                await sendMessage(messageObject.from, response);
                const timeNow = new Date().toISOString();
                const db_messageObject: Message = {
                    actor: "agent",
                    message: response,
                    user_id: user.id,
                    parent_message_id: parent_message_id,
                    message_sent_at: timeNow
                }
                await storeMessage(db_messageObject);
                return;
            }
            // Step 3: Execute the tool
            const executionResult = await executeTool(tool, parameters, user);
            console.log("Task executed with result: ", executionResult)

            //Hot fix -> skip 2nd call on tool success #TODO: implement test and trial

            const tool_description = getToolByName(tool) || tool

            // Step 4: Pass execution result to LLM for confirmation
            const toolFeedback = await callLLMToolFeedback(message,context.userContext, history, tool_description, parameters, executionResult);
            let {next_action: next_action, response: finalResponse, new_parameters = {}} = toolFeedback;

            console.log("tool feedback: ", toolFeedback)

            // Step 5: Handle tool feedback
            if (next_action === "retry_tool") {
                let retry_count = 0
                while (retry_count < 3) {
                    if (retry_count == 1) {
                        sendMessage(messageObject.from, "wart kurz...").catch(() => {})
                        const timeNow = new Date().toISOString();
                        const db_messageObject: Message = {
                            actor: "agent",
                            message: "wart kurz...",
                            user_id: user.id,
                            parent_message_id: parent_message_id,
                            message_sent_at: timeNow
                        }
                        storeMessage(db_messageObject).catch(() => {})
                    }
                    const execution_retry_result = await executeTool(tool, new_parameters,  user)
                    // Get new tool feedback to determine if another retry is needed
                    const toolFeedbackRetry = await callLLMToolFeedback(
                        message,
                        context.userContext,
                        history,
                        tool_description,
                        new_parameters,
                        execution_retry_result
                    );
                    const { next_action: updated_next_action, new_parameters: updated_parameters, response: updated_response} = toolFeedbackRetry;
                    // If next action is no longer retrying, break the loop
                    if (updated_next_action !== "retry_tool") {
                        finalResponse = updated_response
                        break;
                    }
                    new_parameters = updated_parameters || {};
                    retry_count += 1
                }
            }

            // Send final response to user (either success confirmation or clarification)
            await sendMessage(messageObject.from, finalResponse);
            //await storeExecutionLog(userId, tool, executionResult, finalResponse);
            const timeNow = new Date().toISOString();
            const db_messageObject: Message = {
                actor: "agent",
                message: finalResponse,
                user_id: user.id,
                parent_message_id: parent_message_id,
                message_sent_at: timeNow
            }
            await storeMessage(db_messageObject)
            return finalResponse
        } catch (error) {
            console.error("Error in AgentManager:", error);
            await sendMessage(messageObject.from, "Ne da bin ich raus");
            return "Ne da bin ich raus"
        }
    }
}





