import { Composio } from '@composio/core';
import { AnthropicProvider } from '@composio/anthropic';
import Anthropic from '@anthropic-ai/sdk';
import { User } from '../types/db';

// Initialize the SDK
export const composio = new Composio({
  apiKey: process.env.COMPOSIO,
});

const toolconfig_dict: Record<string, string> = {
    "GMAIL": "ac_IqSbnGGgCbXh",
    }

function getToolConfig(tool: string) {
    return toolconfig_dict[tool];
}