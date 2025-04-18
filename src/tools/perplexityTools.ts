


// Retrieve the Perplexity API key from environment variables
import {User} from "../types/db";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
if (!PERPLEXITY_API_KEY) {
    console.error("Error: PERPLEXITY_API_KEY environment variable is required");
    process.exit(1);
}

/**
 * Performs a chat completion by sending a request to the Perplexity API.
 * Appends citations to the returned message content if they exist.
 *
 * @returns {Promise<string>} The chat completion result with appended citations.
 * @throws Will throw an error if the API request fails.
 * @param properties
 * @param user
 */
export async function askPerplexity(
    properties: {
        messages: Array<{ role: string; content: string }>,
        model?: string
    }, user:User) {
    // Construct the API endpoint URL and request body
    const url = new URL("https://api.perplexity.ai/chat/completions");
    const body = {
        model: "sonar-pro", // Model identifier passed as parameter
        messages: properties.messages,
        max_tokens: 200,
        // Additional parameters can be added here if required (e.g., max_tokens, temperature, etc.)
        // See the Sonar API documentation for more details:
        // https://docs.perplexity.ai/api-reference/chat-completions
    };

    console.log("preparing search request")
    console.log("url: ", url)
    console.log("body: ", body)

    let response;
    try {
        response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
            },
            body: JSON.stringify(body),
        });
    } catch (error) {
        throw new Error(`Network error while calling Perplexity API: ${error}`);
    }


    // Check for non-successful HTTP status
    if (!response.ok) {
        let errorText;
        try {
            errorText = await response.text();
            console.log(errorText)
        } catch (parseError) {
            errorText = "Unable to parse error response";
        }
        throw new Error(
            `Perplexity API error: ${response.status} ${response.statusText}\n${errorText}`
        );

    }

    // Attempt to parse the JSON response from the API
    let data;
    try {
        data = await response.json();
        console.log(data)
    } catch (jsonError) {
        throw new Error(`Failed to parse JSON response from Perplexity API: ${jsonError}`);
    }


    // Directly retrieve the main message content from the response
    let messageContent = data.choices[0].message.content;

    // If citations are provided, append them to the message content
    if (data.citations && Array.isArray(data.citations) && data.citations.length > 0) {
        messageContent += "\n\nCitations:\n";
        data.citations.forEach((citation: string, index: number) => {
            messageContent += `[${index + 1}] ${citation}\n`;
        });
    }

    return Promise.resolve({
        success: true,
        message: messageContent
    });
}


