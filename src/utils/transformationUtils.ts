const getLocalInfo = require("phone-number-to-timezone").getLocalInfo;

export function getTzFromPhone (phoneNumber: string) {
    const phoneString = "+" + phoneNumber
    const areaCode = getLocalInfo(phoneString)
    console.log(areaCode.time.zone)
    return areaCode.time.zone
}
