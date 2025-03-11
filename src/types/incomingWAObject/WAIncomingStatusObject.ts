interface ErrorData {
    details: string;
}

interface ErrorObject {
    code: number;
    title: string;
    message?: string;
    error_data?: ErrorData;
}

interface Conversation {
    id: string;
    originobject: string;
    type: 'authentication' | 'marketing' | 'utility' | 'service' | 'referral_conversion';
    expiration_timestamp?: string; // Only present for messages with a 'sent' status
}

interface PricingObject {
    billable: boolean;
    category: 'authentication' | 'authentication-international' | 'marketing' | 'utility' | 'service' | 'referral_conversion';
    pricing_model: 'CBP';
}

export interface WAIncomingStatusObject {
    biz_opaque_callback_data: string;
    conversation: Conversation;
    errors: ErrorObject[];
    id: string;
    pricingobject: PricingObject;
    recipient_id: string;
    status: 'delivered' | 'read' | 'sent';
    timestamp: number; // Unix timestamp
}
