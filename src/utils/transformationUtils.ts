const getLocalInfo = require("phone-number-to-timezone").getLocalInfo;

export function getTzFromPhone (phoneNumber: string) {
    const phoneString = "+" + phoneNumber
    const areaCode = getLocalInfo(phoneString)
    const match = areaCode.time.zone.match(/GMT[ ]*([+-]?\d+)/);

    if (match) {
        return parseInt(match[1], 10);
    }
}
