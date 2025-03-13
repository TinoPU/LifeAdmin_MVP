const getLocalInfo = require("phone-number-to-timezone").getLocalInfo;

export function getTzFromPhone (phoneNumber: string) {
    const phoneString = "+" + phoneNumber
    const areaCode = getLocalInfo(phoneString)
    const match = areaCode.time.zone.match(/GMT[ ]*([+-]?\d+)/);

    if (match) {
        return parseInt(match[1], 10);
    }
}

export function formatDate(input: string | number): string {
    let date: Date;

    if (typeof input === "string") {
        // Assume it's an ISO 8601 string
        date = new Date(input);
    } else if (typeof input === "number") {
        // Handle both seconds (10-digit) and milliseconds (13-digit)
        date = input.toString().length === 10 ? new Date(input * 1000) : new Date(input);
    } else {
        throw new Error("Invalid input type. Must be an ISO string or Unix timestamp.");
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

