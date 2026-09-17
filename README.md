# AeroAssist — Airline Disruption Support Agent

AI-powered customer service agent for airline disruptions. Built as a 4-hour MVP using Next.js, LangGraph.js, and Groq (free tier).

## Setup

### Prerequisites
- Node.js 18+
- Docker (for Postgres)
- A [Groq API key](https://console.groq.com/) (free tier)
- Optional: [LangSmith API key](https://smith.langchain.com/) for observability

### 1. Start Postgres

```bash
docker compose up -d
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

Required:
- `GROQ_API_KEY` — your Groq API key (free tier works)
- `DATABASE_URL` — already set for Docker Postgres

Optional:
- `LANGCHAIN_API_KEY` — for LangSmith tracing
- `LANGCHAIN_PROJECT` — defaults to "aeroassist"

### 4. Run migrations and seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
app/
  api/
    chat/route.ts              # POST — invoke agent, stream response, write events
    conversations/[id]/events/ # GET  — event log for a conversation
  chat/page.tsx                # Chat UI
  admin/page.tsx               # Conversation list
  admin/[conversationId]/      # Event timeline
lib/
  agent-core/
    graph.ts                   # LangGraph StateGraph with conditional edges
    state.ts                   # Graph state shape (Annotation)
    invoke.ts                  # Graph invocation with LangSmith metadata
    authority-rules.ts         # Data-driven authority rule table
    policies.ts                # Static airline service rules
    nodes/
      classify-intent.ts       # LLM — intent + sentiment
      extract-slots.ts         # LLM — structured slot extraction
      propose-action.ts        # LLM — action proposal (policies injected)
      check-authority.ts       # Pure code — rule table lookup
      execute-action.ts        # Pure code — mock action execution
      generate-response.ts     # LLM — natural language response
    schemas/
      intent-slots.ts          # Zod schemas per intent
      llm-schemas.ts           # Zod schemas for LLM structured output
  db/index.ts                  # PrismaClient singleton
prisma/
  schema.prisma                # Customer, Booking, Conversation, Event
  seed.ts                      # 3 customers, 6 bookings
```

### Graph Flow

```
START → classifyIntent → extractSlots → proposeAction → checkAuthority
  → (allow) → executeAction → generateResponse → END
  → (confirm) → generateResponse → END
  → (escalate) → generateResponse → END
```

## Scope Cuts (4-Hour MVP)

- **No Redis** — conversation state in Postgres only
- **No RAG/pgvector** — policy documents injected directly into LLM context
- **No auth/multi-tenancy** — admin view is unauthenticated
- **No monorepo** — single Next.js app, folder structure for separation
- **No real airline APIs** — actions are mock-executed

## Example Conversations

### 1. Cancelled Flight (auto-allow refund)

```
User: My flight AA100 from London to New York was cancelled!
Agent: I'm sorry about the cancellation. I can see your booking ABC123.
       Since this was airline-initiated, you're entitled to a full refund
       of $450. I've processed this — you'll see the refund in 5-10
       business days. Would you also like to rebook on the next available
       flight?
```

### 2. Delayed Flight (requires confirmation)

```
User: My flight UA300 is delayed by 3 hours
Agent: I can see your flight UA300 from Chicago to Miami is delayed.
       Since the delay is over 2 hours, you're entitled to meal vouchers.
       I can issue a $50 meal voucher for you now. Shall I proceed?
User: Yes please
Agent: Done! A $50 meal voucher has been issued. You'll receive it via
       email shortly.
```

### 3. Large Refund (escalation)

```
User: I need a refund for my business class booking DEF456, it was $2,500
Agent: I understand you're requesting a refund for your business class
       booking. Since this amount exceeds our auto-processing threshold,
       I'm connecting you with a specialist who can assist further.
       They'll be with you shortly.
```

## LangSmith Traces

If you've set `LANGCHAIN_API_KEY` in your `.env`:

1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Select the "aeroassist" project (or your configured `LANGCHAIN_PROJECT`)
3. Each graph execution appears as a trace showing:
   - Node transitions (classifyIntent → extractSlots → ...)
   - LLM inputs/outputs at each step
   - Latency per node
   - The injected policy text in the `proposeAction` step

To test without the chat UI:

```bash
npm run test:graph
```

This runs a dummy cancellation conversation through the full graph and prints the trace location.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest unit tests |
| `npm run test:graph` | Run test conversation through agent graph |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with test data |
| `npm run db:reset` | Reset and re-seed database |
| `npm run db:studio` | Open Prisma Studio |
