export interface UUID extends String {}

export interface WAContext {
    forwarded?: boolean;
    frequently_forwarded?: boolean;
    from?: string;
    id?: string;
    referred_product?: {
        catalog_id: string;
        product_retailer_id: string;
    };
}

export interface WAAudio {
    id: string;
    mime_type: string;
}

export interface WAButton {
    payload: string;
    text: string;
}

export interface WADocument {
    caption?: string;
    filename?: string;
    sha256?: string;
    mime_type: string;
    id: string;
}

export interface WAError {
    code: number;
    title: string;
    message?: string;
    error_data?: {
        details: string;
    };
}

export interface WAIdentity {
    acknowledged?: boolean;
    created_timestamp?: string;
    hash?: string;
}

export interface WAImage {
    caption?: string;
    sha256: string;
    id: string;
    mime_type: string;
}

export interface WAInteractive {
    type: string,
    button_reply?: {
            id: string;
            title: string; };
    list_reply?: {
            id: string;
            title: string;
            description?: string;};
}

export interface WAOrder {
    catalog_id: string;
    text?: string;
    product_items: {
        product_retailer_id: string;
        quantity: string;
        item_price: string;
        currency: string;
    }[];
}

export interface WAReferral {
    source_url?: string;
    source_type?: string;
    source_id?: string;
    headline?: string;
    body?: string;
    media_type?: string;
    image_url?: string;
    video_url?: string;
    thumbnail_url?: string;
    ctwa_clid?: string;
}

export interface WASticker {
    mime_type: string;
    sha256: string;
    id: string;
    animated?: boolean;
}

export interface WASystem {
    body: string;
    identity?: string;
    new_wa_id?: string;
    wa_id?: string;
    type: "customer_changed_number" | "customer_identity_changed";
    customer?: string;
}

export interface WAText {
    body: string;
}

export interface WAVideo {
    caption?: string;
    sha256: string;
    id: string;
    mime_type: string;
}


export interface wa_media {
    id?: string,
    media_id?: string,
    type?: string,
    created_at?: string,
    message_id: string,
    mime_type: string,
    sha256: string,
    caption: string,
    filename: string,
    animated: boolean
}

export interface wa_metadata {
    id?: UUID,
    created_at?: string,
    message_id: string,
    context?: WAContext,
    errors?: WAError[],
    referral?: WAReferral,
    interactive?: WAInteractive,
    system?: WASystem,
    identity?: WAIdentity
}

export interface Message {
    id?: UUID;
    created_at?: string;
    session_id?: UUID;
    conversation_id?: UUID;
    user_id: UUID;
    message: string;
    response?: string;
    actor: string;
    parent_message_id?: UUID;
    message_sent_at: string;
    response_sent_at?: string;
    is_reminder?: boolean;

    // WhatsApp-specific fields
    wa_id?: string;
    type?: string;
}

export interface Session {
    id: UUID,
    user_id: UUID,
    session_start: string,
    session_end?: string,
    status?: string,
    topic?: string,
    centroid_vector?: number[],
    last_message_id?: UUID,
    message_count?: number,
}