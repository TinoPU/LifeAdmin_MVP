## LifeAdmin MVP

An agentic, chat-first personal task assistant. Users interact via WhatsApp and Telegram. The system orchestrates specialized agents (Task, Websearch, Email, Calendar, Maps etc.), persists tasks/reminders in Supabase, observes with Langfuse, and caches context with Redis.

## Quick Start

### Prerequisites
- Node 18+ / npm
- Supabase project (Postgres + anon/service keys)
- Redis instance
- Vercel (optional, for deployment)
- Accounts/credentials for external providers you use (WhatsApp Business Cloud API, Telegram Bot, Composio)

### Setup
1) Install dependencies
```bash
npm i
```

2) Environment variables (.env)
```env
# Server
PORT=4000
NODE_ENV=development

# WhatsApp Business Cloud
WA_URL=https://graph.facebook.com/v21.0
WA_PHONE_ID=your_phone_number_id
WA_TOKEN=your_wa_access_token

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
# Optional: restrict bot to a single user id
ALLOWED_TELEGRAM_ID=123456789

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis
REDIS_URL=redis://localhost:6379

# Langfuse (Observability)
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_SECRET_KEY=...
LANGFUSE_HOST=https://cloud.langfuse.com

# Anthropic
ANTHROPIC_API_KEY=...

# Composio (tool integrations)
COMPOSIO_API_KEY=...
```

3) Build and run locally
```bash
npm run build
npm start
# or hot-reload
npm run dev
```

## Endpoints
- `GET /` Health/welcome
- `POST /api/webhooks` WhatsApp webhook (incoming messages and Supabase reminder webhook at `/api/webhooks/supabase`)
- `POST /api/telegram` Telegram webhook (incoming updates)
- `GET /api/telegram` Health for Telegram route

## Architecture

### Overview
- Express server (`src/app.ts`, `src/server.ts`)
- Agents
  - Orchestrator Agent decides which agents run for a user message
  - Task Agent creates/updates tasks and reminders (Supabase)
  - Websearch Agent fetches current information (Perplexity tools)
  - Email Agent (Composio) performs Gmail actions
  - Response Agent synthesizes final replies
- Services & Utilities
  - Supabase actions for `users`, `tasks`, `reminders`
  - Redis caching for conversation context and latest messages
  - Langfuse tracing/prompts for LLM calls
  - Message senders (WhatsApp, Telegram)

### File Map (selected)
- `src/app.ts`, `src/server.ts` – HTTP server and routes
- `src/api/webhooks.ts` – WhatsApp + Supabase reminder webhook
- `src/api/telegram.ts` – Telegram webhook
- `src/assistant/agentManager.ts` – Executes orchestration flow (orchestrator → agents → response)
- `src/agents/` – Agents (task, response, websearch, orchestrator, composio/email)
- `src/tools/` – Tool registries and provider wrappers (Perplexity, Composio)
- `src/services/` – LLM service, logging, message sending, conversation service
- `src/utils/` – Supabase helpers, user utils, redis actions

## Agents

### Orchestrator Agent
- Takes user message + context and returns a map of agents to run with reasons and tasks.
- Output feeds AgentManager to run agents sequentially/parallel as needed.

### Task Agent
- Creates/updates/deletes tasks and schedules reminders in Supabase.
- Exposes a tool schema the LLM can call (e.g., `create_task`).

### Websearch Agent
- Uses Perplexity tools to retrieve current information with citations.
- Returns structured results for the Response Agent.

### Response Agent
- Produces the final chat message, grounded by agent results and artifacts.

### Composio Executor
- Generalistic Executor for MCP Servers via Composio. 

### Email Agent (Composio example)
- Checks user’s Composio Gmail connection; initiates OAuth if missing.
- Loads Gmail tools via Composio, calls Anthropic with tools, then executes tool calls through Composio provider.
- File: `src/agents/ComposioAgents/emailAgent.ts`

## Observability

Langfuse is used for:
- Prompt templates (`langfuse.getPrompt`)
- Traces/spans on agents and tool calls
- Shutdown/flush hooks to ensure logs are shipped on serverless

## Running Locally
```bash
npm run dev     # start dev server (ts-node-dev)
npm run build   # compile TypeScript
npm start       # run compiled JS from dist/
```

## Deploying on Vercel
- `vercel.json` configured to route all traffic to `src/server.ts`
- Make sure environment variables are set on Vercel dashboard
- If builds stall, simplify `vercel.json`, ensure no missing envs, and avoid heavy installs

## Troubleshooting

- Missing envs: 500s or long builds – verify `.env`/Vercel envs (Anthropic, Langfuse, Composio, Supabase, Redis)
- Peer dependency conflicts (Composio/Anthropic): upgrade `@anthropic-ai/sdk` to `^0.52`
```bash
npm i @anthropic-ai/sdk@^0.52
```
- Telegram type errors comparing id to env: parse env to number
```ts
if (process.env.ALLOWED_TELEGRAM_ID && telegramUser.id !== parseInt(process.env.ALLOWED_TELEGRAM_ID)) {
  return;
}
```
- TypeScript catch error is unknown (tests): cast `error as any`
```ts
console.error('Error:', (error as any).response?.data || (error as any).message);
```

## Roadmap Hints
- Planner + Orchestrator (DAG execution, timeouts, retries)
- Artifacts + referential grounding for follow-ups (links, indices)
- Execution instances (pause/resume on auth or user disambiguation)
- More agents (Calendar/Notion) via Composio

---
Maintained in `src/` with TypeScript. PRs and issues welcome.

