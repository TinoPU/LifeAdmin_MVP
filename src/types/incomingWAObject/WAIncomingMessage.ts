export interface WAIncomingMessage {
    id?: string;
    from: string;
    timestamp: string;
    type: string;
    text?: { body: string };
    image?: { id: string; mime_type: string; sha256?: string; caption?: string };
    video?: { id: string; mime_type: string; sha256?: string; caption?: string };
    document?: { id: string; mime_type: string; sha256?: string; filename?: string; caption?: string };
    audio?: { id: string; mime_type: string };
    sticker?: { id: string; mime_type: string; sha256?: string; animated?: boolean };
    interactive?: {
        type: string;
        button_reply?: { id: string; title: string };
        list_reply?: { id: string; title: string; description?: string };
    };
    context?: {
        forwarded?: boolean;
        frequently_forwarded?: boolean;
        from?: string;
        id?: string;
    };
    referral?: {
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
    };
    system?: {
        body: string;
        identity?: string;
        new_wa_id?: string;
        wa_id?: string;
        type: "customer_changed_number" | "customer_identity_changed";
        customer?: string;
    };
    identity?: {
        acknowledged?: boolean;
        created_timestamp?: string;
        hash?: string;
    };
    errors?: { code: number; title: string; message?: string; error_data?: { details: string } }[];
}
