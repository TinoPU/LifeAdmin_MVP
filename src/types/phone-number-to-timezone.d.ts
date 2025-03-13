declare module 'phone-number-to-timezone' {
    export interface TimeInfo {
        text: string;
        location: string;
        valid: boolean;
        dst: boolean;
        dstnow: boolean;
        offset: number;
        type: string;
        country_info: {
            name: string;
            code: string;
            capital: string;
            offset: number;
            dst: boolean;
            start_month: number;
            start_week: number;
            start_offset: boolean;
            start_day: number;
            end_month: number;
            end_week: number;
            end_day: number;
        };
        time: {
            zone: string;
            hour: string;
            mins: string;
            meridian: string | boolean;
            display: string;
        };
    }

    export function getLocalInfo(phoneNumber: string): TimeInfo;
}
