import { Composio } from '@composio/core';
import { AnthropicProvider } from '@composio/anthropic';


// Initialize the SDK
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new AnthropicProvider(),
});

export { composio };


