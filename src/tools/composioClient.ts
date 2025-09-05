import { Composio } from '@composio/core';
import { AnthropicProvider } from '@composio/anthropic';

// Initialize the SDK
export const composio = new Composio({
  apiKey: process.env.COMPOSIO, provider: new AnthropicProvider()
});