import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import {ToolResult, ToolSchema} from "../tools/toolRegistry";

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
        const responseText = msg.content
            .filter((block: any) => block.type === "text") // Ensure it's a text block
            .map((block: any) => block.text) // Extract text
            .join(" "); // Join all text blocks into one string
        return responseText;
    } catch (error) {
        console.log(error)
        return
    }
}

export async function callLLMOrchestration(userMessage: string, history: any[], toolSchema:any[]) {
    try {
        const exampleString: string = `<examples>\n<example>\n<CONVERSATION_HISTORY>\nuser:active\nagent:Hesch mi grad aktiviert? 😄 Bin ready zum helfe mit dim supabase setup! Wottsch immer no wüsse, wie Reminders/Tasks erstellsch? Säg mer eifach wieviel Details du scho hesch, denn chani besser helfe.\nuser:Wie chani amne agent wie dir möglichkeit geh tasks und reminders i minere supabase kreiere?\nagent:Ey, mega idee! 😎 Für reminders in supabase müesstisch wahrscheinlich en API-Verbindig ufsetze. Chönnt dir bi de implementation helfe, aber bruch details vo dim setup. Hesch scho en schema im Chopf oder söllemer das zäme usdenke?\nuser:bisch no wach\nuser: oder so\nagent:Klar bin i no wach! 😊 Für mich gits kei Schlafensziit. Was lauft? Immerno am tüftle mit supabase oder eifach chli am plaudere?\nuser: wie gahts so?\n</CONVERSATION_HISTORY>\n<TOOL_SCHEMA>\ncreate_task: {\n        function: createTaskTool,\n        schema: {\n            name: "create_task",\n            description: "Creates a new task with a due date and a description and generates a reminder schedule.",\n            input_schema: {\n                type: "object",\n                properties: {\n                    \"name\": {\n                        type: \"string\",\n                        description: \"The name of the task.\"\n                    },\n                    \"due_date\": {\n                        type: \"string\",\n                        description: \"The due date of the task (ISO 8601 format) it must contain a time (this can be an estimate if no explicit time is provided).\"\n                    },\n                    \"task_description\": {\n                        type: \"string\",\n                        description: \"Supplementary info about what the task is about\"\n                    },\n                    \"reminder_info\": {\n                        type: \"string\",\n                        description: \"Supplementary info the user may have provided that can help create a reminder schedule\"\n                    }\n                },\n                required: [\"name\", \"due_date\"]\n            }\n        }\n    }\n</TOOL_SCHEMA>\n<ideal_output>\n{\n\"tool\": \"none\",\n\"parameters\": {},\n\"response\": \"Perfect! Looking forward to helping with your project planning tomorrow! 👌 Get some good rest tonight and we'll tackle it fresh!\"\n}\n</ideal_output>\n</example>\n</examples>\n`;
        const promptText: string = `Here is the conversation history for context:
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
            max_tokens: 1000,
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
        const prompt = `
        ### User’s Message:
        ${userMessage}

        ### Conversation History:
        ${JSON.stringify(history, null, 2)}

        ### Selected Tool:
        ${JSON.stringify(selectedTool, null,2)}

        ### Tool Parameters:
        ${JSON.stringify(parameters, null, 2)}

        ### Tool Execution Result:
        ${JSON.stringify(executionResult, null, 2)}

        ### Instructions:
        1. If the tool **failed** or **needs more details**, generate a clarification request for the user.
        2. If execution **was successful**, confirm it to the user.
        3. If execution **is uncertain**, ask the user how to proceed.

        ### Response Format (JSON):
        {
        "next_action": "retry_tool" | "ask_user" | "confirm_success",
        "new_parameters": { ... } (if retrying),
        "response": "..."
        }
        `;

        const msg = await anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 1000,
            temperature: 0.8,
            system: "Please adapt to the user's language (German, English, Swiss German, etc.) and write in a natural, casual chatting style. Keep responses short (1-2 lines). Write informally like a colleague, using incomplete sentences and common everyday expressions. Avoid perfect grammar and long explanations. Respond in the user's tone and style.",
            messages: [
                {
                    role: "user",
                    content: [{ type: "text", text: prompt }]
                }
            ]
        });

        const responseText = msg.content
            .filter(block => block.type === "text")
            .map(block => block.text)
            .join(" ");

        return JSON.parse(responseText);
    } catch (error) {
        console.error("Error in callLLMToolFeedback:", error);
        return { next_action: "ask_user", new_parameters: {}, response: "Ich kann mir grad nichts merken" };
    }
}

