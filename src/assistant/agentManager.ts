import conversationService from "../services/conversationService";
import { callLLMOrchestration, callLLMToolFeedback } from "../services/llmService";
import {executeTool, getToolByName, getToolSchema} from "../tools/toolRegistry";
import { storeMessage } from "../utils/supabaseActions";
import { sendMessage } from "../services/messageService";
import {WAIncomingMessage} from "../types/incomingWAObject/WAIncomingMessage";
import {cacheWhatsappMessage} from "../utils/redisActions";
import {Message, Session} from "../types/message";
import {User} from "../types/db";
import {AgentContext} from "../types/agent";
import {constructContext} from "../utils/agentUtils";
import {langfuse} from "../services/loggingService";
import {getSession} from "../utils/chatUtils";

export class AgentManager {
    async handleNewRequest(user: User, parent_message_id: string, messageObject: WAIncomingMessage, logger: any) {
        logger.info("Handling new Request", {requestObject: messageObject})
        const trace = langfuse.trace({ name: "agent.handleNewRequest", userId: user.id });
        trace.event({ name: "request.received", input: { text: messageObject.text?.body } });

        try {
            if (!user.id) {
                return "No user provided"
            }

            const message = messageObject.text?.body
            if (typeof message !== "string") {
                logger.error("Invalid message: Expected a string but received", message);
                return "Invalid Message type received"; // Stop execution if the message is not a string
            }

            // Step 1: Orchestration
            const session: Session = await getSession(user)
            const history = await conversationService.getRecentMessages(user.id);
            cacheWhatsappMessage(user, "user", message, messageObject.timestamp).catch(error => logger.error("Error caching WhatsApp message:", error));
            const context: AgentContext = await constructContext(user)
            const toolSchema = getToolSchema();
            await langfuse.getPrompt("LLMOrchestration", undefined, {
                type: "chat",
            });

            const llmResponse = await callLLMOrchestration(message,context, history, toolSchema, trace);
            const { tool, parameters, response } = llmResponse;
            trace.event({ name: "orchestration.completed", output: llmResponse });

            if (! await conversationService.isStillLatestUserMessage(user.id, message)) {
                trace.event({
                    name: "execution.stop",
                    level: "DEFAULT",
                    metadata: {reason: "Newer User Message found, response no longer up to date."}
                })
                logger.info("Request handle complete", {traceId: trace.id })
                return
            }

            // Step 2: LLM Response check
            if (tool === "none") {
                // No tool needed, just respond to user
                await sendMessage(messageObject.from, response, logger, "Direct Response - No tools needed");
                const timeNow = new Date().toISOString();
                const db_messageObject: Message = {
                    actor: "agent",
                    message: response,
                    user_id: user.id,
                    parent_message_id: parent_message_id,
                    message_sent_at: timeNow,
                    session_id: session.id
                }
                await storeMessage(db_messageObject);
                trace.event({ name: "agent.completed", output: response });
                logger.info("Request handle complete", {traceId: trace.id })
                return response;
            }
            // Step 3: Execute the tool
            const executionSpan = trace.span({ name: "tool.execute", input: {tool, parameters, user} });
            const executionResult = await executeTool(tool, parameters, user, trace);
            executionSpan.end({ output: executionResult });

            //Hot fix -> skip 2nd call on tool success #TODO: implement test and trial

            const tool_description = getToolByName(tool) || tool

            // Step 4: Pass execution result to LLM for confirmation
            const feedbackSpan = trace.span({ name: "ToolFeedback.request", input: executionResult });
            const toolFeedback = await callLLMToolFeedback(message,context.userContext, history, tool_description, parameters, executionResult, trace);
            let {next_action: next_action, response: finalResponse, new_parameters = {}} = toolFeedback;
            feedbackSpan.end({output: toolFeedback})
            // Step 5: Handle tool feedback
            if (next_action === "retry_tool") {
                let retry_count = 0
                while (retry_count < 3) {
                    if (retry_count == 1) {
                        sendMessage(messageObject.from, "wart kurz...", logger, "retrying tool").catch(() => {})
                        const timeNow = new Date().toISOString();
                        const db_messageObject: Message = {
                            actor: "agent",
                            message: "wart kurz...",
                            user_id: user.id,
                            parent_message_id: parent_message_id,
                            message_sent_at: timeNow,
                            session_id: session.id
                        }
                        storeMessage(db_messageObject).catch(() => {})
                    }
                    const retry_span = trace.span({ name: "retry", input: {tool, new_parameters, user} });
                    const execution_retry_result = await executeTool(tool, new_parameters,  user, trace)
                    retry_span.end({ output: execution_retry_result })
                    // Get new tool feedback to determine if another retry is needed
                    const toolFeedbackRetry = await callLLMToolFeedback(
                        message,
                        context.userContext,
                        history,
                        tool_description,
                        new_parameters,
                        execution_retry_result,
                        trace
                    );
                    const { next_action: updated_next_action, new_parameters: updated_parameters, response: updated_response} = toolFeedbackRetry;
                    // If next action is no longer retrying, break the loop
                    if (updated_next_action !== "retry_tool") {
                        finalResponse = updated_response
                        trace.event({ name: "agent.completed", output: finalResponse });
                        break;
                    }
                    new_parameters = updated_parameters || {};
                    retry_count += 1
                }
            }

            if (! await conversationService.isStillLatestUserMessage(user.id, message)) {
                trace.event({
                    name: "execution.stop",
                    level: "DEFAULT",
                    metadata: {reason: "Newer User Message found, response no longer up to date."}
                })
                logger.info("Request handle complete", {traceId: trace.id })
                return
            }
            // Send final response to user (either success confirmation or clarification)
            await sendMessage(messageObject.from, finalResponse, logger, "final response");
            //await storeExecutionLog(userId, tool, executionResult, finalResponse);
            const timeNow = new Date().toISOString();
            const db_messageObject: Message = {
                actor: "agent",
                message: finalResponse,
                user_id: user.id,
                parent_message_id: parent_message_id,
                message_sent_at: timeNow,
                session_id: session.id
            }
            await storeMessage(db_messageObject)
            trace.event({ name: "agent.completed", output: finalResponse });
            logger.info("Request handle complete", {traceId: trace.id })
            return finalResponse
        } catch (error) {
            logger.error("Error in AgentManager:", error);
            await sendMessage(messageObject.from, "Ne da bin ich raus", logger, "AgentManager Error");
            trace.event({ name: "agent.error", output: { message: error } });
            return "Ne da bin ich raus"
        } finally {
            // ensure flush in Vercel
            await langfuse.shutdownAsync();
        }
    }
}





