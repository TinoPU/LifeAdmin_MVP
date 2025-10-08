const getLocalInfo = require("phone-number-to-timezone").getLocalInfo;

export function getTzFromPhone (phoneNumber: string) {
    const phoneString = "+" + phoneNumber
    const areaCode = getLocalInfo(phoneString)
    const match = areaCode.time.zone.match(/GMT[ ]*([+-]?\d+)/);

    if (match) {
        return parseInt(match[1], 10);
    }
}

export function formatDate(input: string): string {
    let date: Date;

    // Check if input is a Unix timestamp (all digits, 10 or more characters)
    if (/^\d+$/.test(input)) {
        const timestamp = Number(input);
        if (input.length === 10) {
            // Convert from seconds to milliseconds
            date = new Date(timestamp * 1000);
        } else if (input.length === 13) {
            // Already in milliseconds
            date = new Date(timestamp);
        } else {
            throw new Error(`Invalid timestamp format: ${input}`);
        }
    }
    // Handle ISO date strings
    else {
        const parsedDate = Date.parse(input);
        if (isNaN(parsedDate)) {
            throw new Error(`Invalid date string provided: ${input}`);
        }
        date = new Date(parsedDate);
    }

    // Check if the date is valid
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid time value for timestamp: ${input}`);
    }

    // Convert to local time
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

    // Format date: DD.MM.YYYY
    const datePart = new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);

    // Format time: HH:MM:SS
    const timePart = new Intl.DateTimeFormat("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(date);

    return `[${datePart}, ${timePart}]`;
}

export function formatGmailMessages(result: any) {
    const messages = result?.data?.messages;
    if (Array.isArray(messages)) {
        const MAX_LENGTH = 2000;
        result.data.messages = messages.map((msg: any) => {
            let body = msg.messageText || msg.preview?.body || "";
            const links = extractLinks(msg.messageText || "");

            if (body.length > MAX_LENGTH) {
                body = msg.preview?.body ? msg.preview.body : body.slice(0, MAX_LENGTH) + "...";
            }

            if (links.length > 0) {
                body += "\n\nLinks:\n" + links.map((link: string) => `- ${link}`).join("\n");
            }

            return {
                messageId: msg.messageId,
                sender: msg.sender,
                subject: msg.subject,
                body,
            };
        });
    }
    return result;
}



export function formatSingleGmailMessage(result: any) {
    const message = result?.data;
    if (message && typeof message === 'object') {
        const MAX_LENGTH = 2000;
        let body = message.messageText || message.preview?.body || "";

        const links = extractLinks(message.messageText || "");

        if (body.length > MAX_LENGTH) {
            body = message.preview?.body ? message.preview.body : body.slice(0, MAX_LENGTH) + "...";
        }

        if (links.length > 0) {
            body += "\n\nLinks:\n" + links.map((link: string) => `- ${link}`).join("\n");
        }

        result.data = {
            messageId: message.messageId,
            sender: message.sender,
            subject: message.subject,
            body,
            threadId: message.threadId,
            to: message.to,
            attachments: message.attachmentList?.map((att: any) => ({
                filename: att.filename,
                mimeType: att.mimeType,
                attachmentId: att.attachmentId,
            })) || [],
        };
    }
    return result;
}

export function extractLinks(text: string): string[] {
    if (!text) return [];

    // Regex to match URLs (http, https, and www)
    const urlRegex = /https?:\/\/[^\s<>\[\]"]+|www\.[^\s<>\[\]"]+/gi;
    const matches = text.match(urlRegex) || [];

    // Remove duplicates and return
    return [...new Set(matches)];
}

export function cleanStringList(input: string | string[]): string {
    return Array.isArray(input) ? input.join("\n") : input;
}

