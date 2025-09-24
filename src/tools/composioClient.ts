import {Composio, OpenAIProvider} from '@composio/core';
import { AnthropicProvider } from '@composio/anthropic';
import OpenAI from "openai";


// Initialize the SDK
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new OpenAIProvider(),
});

export { composio };


