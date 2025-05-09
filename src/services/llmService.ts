import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import {ToolResult, ToolSchema} from "../tools/toolRegistry";
import {Task} from "../types/db";
import {AgentContext, UserContext} from "../types/agent";
import {langfuse} from "./loggingService";
import {defaultModelConfig} from "../config/modelConfig";


dotenv.config()

const anthropic = new Anthropic();

export async function generateUserMessageResponse(userMessage: string) {
    try {
        const msg = await anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 1000,
            temperature: 1,
            system: "Bitte passe dich der Sprache des Nutzers an (Deutsch, Englisch, Schweizerdeutsch, etc.) und schreibe in einem lockeren, natürlichen Chatting-Stil. Halte deine Nachrichten kurz (1-2 Zeilen). Schreib informell wie ein Kollege, mit unvollständigen Sätzen und typischen Alltagsausdrücken. Vermeide perfekte Grammatik und lange Erklärungen. Reagiere auf den Ton und Stil des Nutzers.",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: userMessage
                        }
                    ]
                }
            ]
        });
        return msg.content
            .filter((block: any) => block.type === "text") // Ensure it's a text block
            .map((block: any) => block.text) // Extract text
            .join(" "); // Join all text blocks into one string
    } catch (error) {
        console.log(error)
        return
    }
}

export async function callLLMOrchestration(userMessage: string, context:AgentContext, history: any[], toolSchema:any[], trace: any) {
    try {
        const chatPrompt = await langfuse.getPrompt("LLMOrchestration", undefined, {
            type: "chat",
        });
        const compiledChatPrompt = chatPrompt.compile({
            userMessage: userMessage,
            history: JSON.stringify(history, null, 2),
            userContext: JSON.stringify(context.userContext, null, 2),
            taskContext: JSON.stringify(context.taskContext, null, 2),
            toolSchema: JSON.stringify(toolSchema, null, 2)
        });


        const messages: {role: "user" | "assistant", content: string}[] = compiledChatPrompt.map(m => {
            return {
                role: (m.role === 'user' ? 'user' : 'assistant'),
                content: m.content,
            };
        });

        const gen = trace.generation({
            name: "orchestration.call",
            model: defaultModelConfig.model,
            modelParameters: { ...defaultModelConfig },
            input: compiledChatPrompt,
            prompt: chatPrompt
        });



        const msg = await anthropic.messages.create({
            ...defaultModelConfig,
            messages: messages
        });
        const responseText = msg.content
            .filter(block => block.type === "text")
            .map(block => block.text)
            .join(" ");

        gen.end(({ output: responseText}));
        return JSON.parse("{" + responseText);
    } catch (error) {
        console.error("Error in callLLMOrchestration:", error);
        return { tool: "none", parameters: {}, response: "Sorry, ich bin grad AFK" };
    }
}


export async function callLLMToolFeedback(userMessage: string, userContext:UserContext, history: any[], selectedTool: ToolSchema | string, parameters:any[], executionResult:ToolResult) {
    try {
        const prompt: string = `You are an AI assistant designed to help users by executing tools and providing responses in a conversational context. Your task is to process the given information, determine the appropriate action, and respond in a structured JSON format.
Here's the information you need to consider:
<latest_message>
${userMessage}
</latest_message>

Here is additional info about the user for you: 
<userContext>
${JSON.stringify(userContext, null, 2)}
</userContext>

<conversation_history>
${JSON.stringify(history, null, 2)}
</conversation_history>

<selected_tool>
${JSON.stringify(selectedTool, null, 2)}
</selected_tool>

<tool_parameters>
${JSON.stringify(parameters, null, 2)}
</tool_parameters>

<execution_result>
${JSON.stringify(executionResult, null, 2)}
</execution_result>

Instructions:
1. Adapt to the user's language (German, English, Swiss German, etc.) and maintain a casual, friendly tone throughout your thought process.
2. Keep your final response short (1-2 lines) and informal, as if chatting with a colleague.
3. Use incomplete sentences and common everyday expressions where appropriate.
4. Avoid perfect grammar and long explanations in your final response.
5. Match the user's tone and style in your response.

Process:
1. Analyze the user's message, conversation history, selected tool, tool parameters, and execution result.
2. Determine the status of the tool execution: failed, successful, or uncertain.
3. Based on the status, decide on the next action:
   - If failed or needs more details: generate a clarification request
   - If successful: Respond to the user with the new info
   - If uncertain: ask the user how to proceed
   - If you can fix the error: retry the tool with updated parameters.
4. Formulate your response according to the determined action.
5. Structure your response in the required JSON format ensuring all string values are enclosed in double quotes and contain no unescaped quotes inside.

Show your thought process inside <analysis> tags:
1. Quote relevant parts of the conversation history and execution result.
2. Analyze the tool execution status and explain your reasoning.
3. Explicitly state the chosen action and explain why.
4. Draft a brief response (aim for 10-20 words) in the user's language and style.

Output Format:
Your final output must be a JSON object with the following structure ensuring all string values are enclosed in double quotes and contain no unescaped quotes inside:

{
  "next_action": "retry_tool" | "ask_user" | "confirm_success",
  "new_parameters": { ... } (include only if next_action is "retry_tool"),
  "response": "..." (your 1-2 line response in the user's language and style)
}

Remember, the output should contain ONLY the JSON object, with no additional text before or after.`


        const msg = await anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 5000,
            temperature: 1,
            messages: [
                {
                    role: "user",
                    content: [{
                        type: "text",
                        text: prompt }]
                },
                {
                    "role": "assistant",
                    "content": [
                        {
                            "type": "text",
                            "text": "The Output JSON is: {"
                        }
                        ]
                }
            ]
        });

        const responseText = msg.content
            .filter(block => block.type === "text")
            .map(block => block.text)
            .join(" ");
        console.log("model response: ",responseText)
        return JSON.parse("{" + responseText);
    } catch (error) {
        console.error("Error in callLLMToolFeedback:", error);
        return { next_action: "ask_user", new_parameters: {}, response: "Ich kann mir grad nichts merken" };
    }
}

export async function generateReminderMessage(task: Task, userContext: UserContext, history:any[]) {
    try {
        const reminderPrompt = `You are an AI assistant tasked with reminding a user about a task. You will be given task information and the user's preferred language. Your goal is to create a short, casual reminder that feels natural and friendly.

Here's the task information:
<task>
${JSON.stringify(task, null, 2)}
</task>

Here is additional info about the user for you: 
<userContext>
${JSON.stringify(userContext, null, 2)}
</userContext>

Here is the conversation history for context
<conversation_history>
${JSON.stringify(history, null, 2)}
</conversation_history>

Follow these steps to create the reminder:

1. Analyze the task information, focusing on the name, due_date, and any other relevant details.

2. Adapt your language to match the user's preferred language. If you're not fluent in the specified language, use a casual version of English or the closest language you're comfortable with.

3. Craft your response in a casual, friendly tone. Imagine you're chatting with a colleague or friend.

4. Keep your reminder short (1-2 lines) and informal. Use incomplete sentences and common everyday expressions where appropriate.

5. Avoid perfect grammar and long explanations. Match the user's likely tone and style.

6. If the due date is today or tomorrow, create a sense of urgency without being stressful.

Here are some examples of good reminders:

English: "Hey! Don't forget about [task name] today."
German: "Du, [task name] steht heute an!"
Swiss German: "Sali! Vergiss [task name] hüt nöd."`;
        const msg = await anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 20000,
            temperature: 1,
            messages: [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": reminderPrompt
                        }
                    ]
                }
            ]
        });
        return msg.content
            .filter((block: any) => block.type === "text") // Ensure it's a text block
            .map((block: any) => block.text) // Extract text
            .join(" "); // Join all text blocks into one string
    } catch (error) {
        console.log(error)
        return
    }
}