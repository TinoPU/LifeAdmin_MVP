import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import {ToolResult, ToolSchema} from "../tools/toolRegistry";
import {Task} from "../types/db";

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

export async function callLLMOrchestration(userMessage: string, history: any[], toolSchema:any[]) {
    try {
        const exampleString: string = `<examples>\n<example>\n<CONVERSATION_HISTORY>\nuser:active\nagent:Hesch mi grad aktiviert? 😄 Bin ready zum helfe mit dim supabase setup! Wottsch immer no wüsse, wie Reminders/Tasks erstellsch? Säg mer eifach wieviel Details du scho hesch, denn chani besser helfe.\nuser:Wie chani amne agent wie dir möglichkeit geh tasks und reminders i minere supabase kreiere?\nagent:Ey, mega idee! 😎 Für reminders in supabase müesstisch wahrscheinlich en API-Verbindig ufsetze. Chönnt dir bi de implementation helfe, aber bruch details vo dim setup. Hesch scho en schema im Chopf oder söllemer das zäme usdenke?\nuser:bisch no wach\nuser: oder so\nagent:Klar bin i no wach! 😊 Für mich gits kei Schlafensziit. Was lauft? Immerno am tüftle mit supabase oder eifach chli am plaudere?\nuser: wie gahts so?\n</CONVERSATION_HISTORY>\n<TOOL_SCHEMA>\ncreate_task: {\n        function: createTaskTool,\n        schema: {\n            name: "create_task",\n            description: "Creates a new task with a due date and a description and generates a reminder schedule.",\n            input_schema: {\n                type: "object",\n                properties: {\n                    \"name\": {\n                        type: \"string\",\n                        description: \"The name of the task.\"\n                    },\n                    \"due_date\": {\n                        type: \"string\",\n                        description: \"The due date of the task (ISO 8601 format) it must contain a time (this can be an estimate if no explicit time is provided).\"\n                    },\n                    \"task_description\": {\n                        type: \"string\",\n                        description: \"Supplementary info about what the task is about\"\n                    },\n                    \"reminder_info\": {\n                        type: \"string\",\n                        description: \"Supplementary info the user may have provided that can help create a reminder schedule\"\n                    }\n                },\n                required: [\"name\", \"due_date\"]\n            }\n        }\n    }\n</TOOL_SCHEMA>\n<ideal_output>\n{\n\"tool\": \"none\",\n\"parameters\": {},\n\"response\": \"Perfect! Looking forward to helping with your project planning tomorrow! 👌 Get some good rest tonight and we'll tackle it fresh!\"\n}\n</ideal_output>\n</example>\n</examples>\n`;
        const promptText: string = `Here is the conversation history for context:
<latest_message>
${userMessage}
</latest_message>
<conversation_history>
${JSON.stringify(history, null, 2)}
</conversation_history>

You are an AI assistant designed to manage a user's tasks and reminders through a chat interface. You should adapt your language to match the user's (German, English, Swiss German, etc.) and write in a casual, natural chatting style. Keep your messages short (1-2 lines) and informal, like a colleague. Use incomplete sentences and typical everyday expressions. Avoid perfect grammar and long explanations. React to the tone and style of the user.

The following schema describes the tools available to you:
<tool_schema>
${JSON.stringify(toolSchema, null, 2)}
</tool_schema>

Your task is to analyze the user's message and determine whether a tool should be used or if you should respond naturally. If a tool is needed, you must extract all relevant parameters.

Please follow these steps:

1. Analyze the user's message.
2. Determine if a tool should be used (create_task, set_reminder, or none).
3. If a tool is needed, extract all relevant parameters.
4. If no tool applies, formulate a natural response.
5. Structure your output as JSON.

Before providing your final response, wrap your analysis and decision-making process in <analysis> tags. In this section:
1. Summarize the user's message.
2. Consider each tool option (create_task, set_reminder, none) and list pros and cons for using it.
3. For the chosen tool (if any), list out each required parameter and note whether it's present in the user input.
4. If no tool is chosen, note key points to address in the natural response.

Your final output must be in the following JSON format:

{
  "tool": "create_task" | "set_reminder" | "none",
  "parameters": { ... },
  "response": "..."
}

Example (purely structural, do not copy content):
{
  "tool": "create_task",
  "parameters": {
    "task_name": "...",
    "due_date": "...",
    "priority": "..."
  },
  "response": "..."
}

Remember to always provide structured JSON output as requested by the user. Respond with this Output and only this output. Do not provide anything else`

        const msg = await anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 5000,
            temperature: 0.8,
            system: "Never respond with anything in additional to the JSON.",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            "type": "text",
                            text: exampleString
                        },
                        {
                            type: "text",
                            text: promptText
                        }
                    ]
                },
                {
                    "role": "assistant",
                    "content": [
                        {
                            "type": "text",
                            "text": "Requested JSON Output: {"
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
        console.error("Error in callLLMOrchestration:", error);
        return { tool: "none", parameters: {}, response: "Sorry, ich bin grad AFK" };
    }
}


export async function callLLMToolFeedback(userMessage: string, history: any[], selectedTool: ToolSchema | string, parameters:any[], executionResult:ToolResult) {
    try {
        const prompt: string = `You are an AI assistant designed to help users by executing tools and providing responses in a conversational context. Your task is to process the given information, determine the appropriate action, and respond in a structured JSON format.
Here's the information you need to consider:
<latest_message>
${userMessage}
</latest_message>

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
   - If successful: confirm the success to the user
   - If uncertain: ask the user how to proceed
4. Formulate your response according to the determined action.
5. Structure your response in the required JSON format.

Show your thought process inside <analysis> tags:
1. Quote relevant parts of the conversation history and execution result.
2. Analyze the tool execution status and explain your reasoning.
3. Explicitly state the chosen action and explain why.
4. Draft a brief response (aim for 10-20 words) in the user's language and style.

Output Format:
Your final output must be a JSON object with the following structure:

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

export async function generateReminderMessage(task: Task) {
    try {
        const reminderPrompt = `You are an AI assistant tasked with reminding a user about a task. You will be given task information and the user's preferred language. Your goal is to create a short, casual reminder that feels natural and friendly.

Here's the task information:
<task>
${JSON.stringify(task, null, 2)}
</task>

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