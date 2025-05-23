import conversationService from "../services/conversationService";
import { storeMessage } from "../utils/supabaseActions";
import { sendMessage } from "../services/messageService";
import {WAIncomingMessage} from "../types/incomingWAObject/WAIncomingMessage";
import {cacheWhatsappMessage} from "../utils/redisActions";
import {Message, Session} from "../types/message";
import {User} from "../types/db";
import {AgentProps, ExecutionContext, OrchestratorResponse, UserContext} from "../types/agent";
import {constructExecutionContext} from "../utils/agentUtils";
import {langfuse} from "../services/loggingService";
import {getSession} from "../utils/chatUtils";
import {constructUserContext} from "../utils/userUtils";
import {OrchestratorAgent} from "../agents/orchestratorAgent";
import {agentFunctionMap} from "../agents/agentRegistry";
import {ResponseAgent, responseAgentCard} from "../agents/responseAgent";

export class AgentManager {
    async handleNewRequest(user: User, parent_message_id: string, messageObject: WAIncomingMessage, logger: any) {
        logger.info("Handling new Request", {requestObject: messageObject})
        const session: Session = await getSession(user)
        const executionContext: ExecutionContext = constructExecutionContext()
        const trace = langfuse.trace({ name: "agent.handleNewRequest", userId: user.id, sessionId: session.id.toString(), input: messageObject.text?.body });
        trace.event({ name: "request.received", input: { text: messageObject.text?.body } });

        try {
            if (!user.id) {
                return "No user provided"
            }
            executionContext.user_id = user.id
            executionContext.session_id = session.id
            const message = messageObject.text?.body
            if (typeof message !== "string") {
                logger.error("Invalid message: Expected a string but received", {message: message});
                return "Invalid Message type received"; // Stop execution if the message is not a string
            }

            // Step 1: Orchestration
            const history = await conversationService.getRecentMessages(user.id);
            cacheWhatsappMessage(user, "user", message, messageObject.timestamp).catch(error => logger.error("Error caching WhatsApp message:", error));
            const user_context:UserContext = constructUserContext(user)
            let orchestrator_response: OrchestratorResponse = await OrchestratorAgent(message,executionContext, history,user_context, trace)
            logger.info("Orchestration Complete")
            trace.event({ name: "orchestration.completed", output: orchestrator_response });
            console.log("orchestrator done")
            if (! await conversationService.isStillLatestUserMessage(user.id, message)) {
                trace.event({
                    name: "execution.stop",
                    level: "DEFAULT",
                    metadata: {reason: "Newer User Message found, response no longer up to date."}
                })
                logger.info("Request handle complete", {traceId: trace.id })
                return
            }

            const agentPromises: Promise<void>[] = [];
            // Step 2: Call Agents
            executionContext.agentStatus = {}
            for (let agentChoice in orchestrator_response.agents ){
                const agentFn = agentFunctionMap[agentChoice];
                logger.info("Calling Agents", {agents: orchestrator_response.agents})
                console.log("starting to call agents")
                if (!agentFn) {
                    logger.warn(`No function found for agent: ${JSON.stringify(agentChoice)}`, {available_agents: Object.keys(agentFunctionMap).map(k => JSON.stringify(k))})
                    continue;
                }
                executionContext.agentStatus[agentChoice] = { status: "pending" };

                if (agentChoice === responseAgentCard.name) {
                    continue; // defer Response Agent
                }
                const agentprompt = orchestrator_response.agents[agentChoice].task;
                const agentProps: AgentProps = {
                    user_message: message,
                    context: executionContext,
                    history: history,
                    prompt: agentprompt,
                    trace:trace,
                    user: user
                }
                const agentPromise = agentFn(agentProps)
                    .then((result) => {
                        executionContext.agentStatus[agentChoice] = { status: "success", result };
                    })
                    .catch((error) => {
                        executionContext.agentStatus[agentChoice] = { status: "failed", error };
                    });
                agentPromises.push(agentPromise);
                console.log("pushed agent promise")
                console.log("execution context:", executionContext)
                trace.event({ name: "Agent Called", metadata: agentChoice});
            }
            await Promise.allSettled(agentPromises);
            trace.event({name: "orchestration.agent.all", statusMessage: "All agents prepared"})
            console.log("all promises settled")
            const allOthersSucceeded = Object.entries(executionContext.agentStatus).every(([name, state]) => {
                return name === responseAgentCard.name || state.status === "success";
            });
            logger.info("Agent Status completed", {agentStatus: executionContext.agentStatus})
            console.log("all succeded: ", allOthersSucceeded)
            console.log("execution Context ", executionContext)
            trace.event({name:"Agents Checked - Execution Context", metadata: executionContext})

            if (! await conversationService.isStillLatestUserMessage(user.id, message)) {
                trace.event({
                    name: "execution.stop",
                    level: "DEFAULT",
                    metadata: {reason: "Newer User Message found, response no longer up to date."}
                })
                logger.info("Request handle complete", {traceId: trace.id })
                return
            }

            if (allOthersSucceeded) {
                const response = await ResponseAgent({user_message:message, context:executionContext, trace:trace, history:history, user:user })
                if (response.response) {
                    if (! await conversationService.isStillLatestUserMessage(user.id, message)) {
                        trace.event({
                            name: "execution.stop",
                            level: "DEFAULT",
                            metadata: {reason: "Newer User Message found, response no longer up to date."}
                        })
                        logger.info("Request handle complete", {traceId: trace.id })
                        return
                    }
                    await sendMessage(messageObject.from, response.response, logger, "Response Agent");
                    const timeNow = new Date().toISOString();
                    await cacheWhatsappMessage(user, "agent", response.response, timeNow)
                    const db_messageObject: Message = {
                        actor: "agent",
                        message: response.response,
                        user_id: user.id,
                        parent_message_id: parent_message_id,
                        message_sent_at: timeNow,
                        session_id: session.id
                    }
                    await storeMessage(db_messageObject)
                    trace.event({ name: "agent.completed", output: response.response });
                    trace.update({output: response.response})
                    logger.info("Request handle complete", {traceId: trace.id })
                }
            }

        } catch (error) {
            logger.error("Error in AgentManager", {error: error});
            await sendMessage(messageObject.from, "Ne da bin ich raus", logger, "AgentManager Error");
            trace.event({ name: "agent.error", output: { message: error } });
            return "Ne da bin ich raus"
        } finally {
            // ensure flush in Vercel
            await langfuse.shutdownAsync();
        }
    }
}





