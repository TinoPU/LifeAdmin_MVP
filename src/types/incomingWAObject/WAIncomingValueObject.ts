import {WAIncomingMessage} from "./WAIncomingMessage";
import {WAIncomingStatusObject} from "./WAIncomingStatusObject";


export interface Contact {
    wa_id: string;
    user_id: string;
    profile: {
        name: string;
    };
}

interface ErrorData {
    details: string;
}

interface ErrorObject {
    code: number;
    title: string;
    message?: string;
    error_data?: ErrorData;
}


interface Metadata {
    display_phone_number: string;
    phone_number_id: string;
}

export interface ValueObject {
    contacts: Contact[];
    errors: ErrorObject[];
    messaging_product: string;
    messages: WAIncomingMessage[];
    metadata: Metadata;
    statuses: WAIncomingStatusObject[];
}

