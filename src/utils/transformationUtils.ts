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

