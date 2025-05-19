export interface modelConfig {
    model: string,
    max_tokens: number,
    temperature: number
}

export const defaultModelConfig = {
    model: "claude-3-7-sonnet-20250219",
    max_tokens: 5000,
    temperature: 0.8,
};



