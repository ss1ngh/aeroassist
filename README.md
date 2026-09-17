# AeroAssist — Airline Disruption Support Agent

An AI-powered customer service agent that handles airline disruptions (cancellations, delays, refunds, fare differences) using a LangGraph state machine, Groq LLM (free tier), and a full audit trail.

Built as a production-quality MVP with Next.js 14 App Router, TypeScript strict mode, PostgreSQL, and LangSmith observability.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Reference](#api-reference)
- [Agent Architecture](#agent-architecture)
- [Authority Rules](#authority-rules)
- [Service Policies](#service-policies)
- [Frontend](#frontend)
- [Admin Audit View](#admin-audit-view)
- [Observability (LangSmith)](#observability-langsmith)
- [Testing](#testing)
- [Example Conversations](#example-conversations)
- [Scope Cuts](#scope-cuts)

---

## Features

- **Intent Classification** — Detects cancellation, delay, refund, fare difference, or general inquiry with a sentiment/frustration score (0–1)
- **Structured Slot Extraction** — Extracts PNR, flight number, refund amount, etc. from natural language using Zod-validated schemas
- **Policy-Grounded Actions** — Injects static airline service rules into the LLM context for factual, policy-compliant responses
- **Authority Rule Engine** — Data-driven rule table decides: auto-execute, require confirmation, or escalate to a human agent
- **Streaming Responses** — Real-time SSE streaming from the agent graph to the browser
- **Full Audit Trail** — Every state transition (message, intent, proposed action, executed action, escalation) is logged as an Event row
- **Admin Dashboard** — Conversation list with status badges and per-conversation event timeline
- **LangSmith Traces** — Full execution traces with node transitions, LLM I/O, and latency

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Agent Orchestration | LangGraph.js (`@langchain/langgraph` v1.4.15) |
| LLM | Groq free tier (`qwen/qwen3.8-27b`) via `@langchain/groq` |
| Structured Output | Zod v4 schemas with `.withStructuredOutput()` |
| Database | PostgreSQL 16 (Docker) via Prisma 6.19 |
| Streaming | Vercel AI SDK v7 (`ai` + `@ai-sdk/react`) |
| Observability | LangSmith (`@langchain/core` tracing) |
| Testing | Vitest 4 |
| Language | TypeScript 5 strict mode |

---

## Project Structure

```
aeroassist/
├── app/                            # Next.js App Router
│   ├── api/
│   │   ├── chat/route.ts           # POST — invoke agent, stream response, write events
│   │   └── conversations/
│   │       └── [id]/
│   │           └── events/route.ts # GET — full event log for a conversation
│   ├── chat/page.tsx               # Chat UI with message bubbles + streaming
│   ├── admin/
│   │   ├── page.tsx                # Conversation list with status badges
│   │   └── [conversationId]/
│   │       └── page.tsx            # Event timeline for one conversation
│   ├── layout.tsx                  # Root layout (Geist font, Tailwind)
│   ├── page.tsx                    # Landing page with links to chat + admin
│   └── globals.css                 # Tailwind base styles
│
├── lib/                            # Framework-agnostic business logic
│   ├── agent-core/
│   │   ├── graph.ts                # LangGraph StateGraph — wires all nodes with conditional edges
│   │   ├── state.ts                # Graph state shape via LangGraph Annotation
│   │   ├── invoke.ts               # Graph invocation wrapper with LangSmith metadata tagging
│   │   ├── authority-rules.ts      # Data-driven authority rule table + checkAuthority()
│   │   ├── policies.ts             # Static airline service rules (5 policies as raw text)
│   │   ├── nodes/
│   │   │   ├── classify-intent.ts  # LLM — classifies intent + sentiment score
│   │   │   ├── extract-slots.ts    # LLM — extracts structured slots per intent schema
│   │   │   ├── propose-action.ts   # LLM — proposes action with policies injected into prompt
│   │   │   ├── check-authority.ts  # Pure code — evaluates authority rules (no LLM)
│   │   │   ├── execute-action.ts   # Pure code — mock-executes actions (refund, rebook, voucher)
│   │   │   └── generate-response.ts# LLM — produces natural-language reply to customer
│   │   ├── schemas/
│   │   │   ├── intent-slots.ts     # Zod schemas for each intent's required/optional slots
│   │   │   └── llm-schemas.ts      # Zod schemas for LLM structured output (classification, extraction, action, response)
│   │   └── __tests__/
│   │       ├── authority-rules.test.ts  # 13 tests for authority rule table
│   │       └── intent-slots.test.ts     # 11 tests for slot schemas
│   └── db/
│       └── index.ts                # PrismaClient singleton (handles Next.js hot reload)
│
├── prisma/
│   ├── schema.prisma               # Customer, Booking, Conversation, Event models
│   ├── seed.ts                     # Seeds 3 customers + 6 bookings
│   └── migrations/                 # Auto-generated Prisma migrations
│
├── scripts/
│   └── test-graph.ts               # Runs a dummy conversation through the full graph
│
├── docker-compose.yml              # Postgres 16 Alpine with named volume
├── .env.example                    # Required environment variables template
├── .prettierrc                     # Prettier config
├── tsconfig.json                   # TypeScript strict mode config
├── tailwind.config.ts              # Tailwind CSS config
└── package.json                    # Dependencies + npm scripts
```

---

## Local Setup

### Prerequisites

| Requirement | Version | Notes |
|------------|---------|-------|
| Node.js | 18+ | Tested with v24 |
| Docker | Any | For PostgreSQL |
| Groq API key | Free tier | Sign up at [console.groq.com](https://console.groq.com/) |
| LangSmith API key | Free tier (optional) | Sign up at [smith.langchain.com](https://smith.langchain.com/) |

### Step-by-Step

**1. Clone the repository**

```bash
git clone <repo-url>
cd aeroassist
```

**2. Start PostgreSQL via Docker**

```bash
docker compose up -d
```

This starts a Postgres 16 container on `localhost:5432` with:
- User: `aeroassist`
- Password: `aeroassist`
- Database: `aeroassist`
- Named volume `pgdata` for persistence

Verify it's running:

```bash
docker compose ps
# Should show "aeroassist-db-1" with status "Up"
```

**3. Install dependencies**

```bash
npm install
```

This also runs `prisma generate` automatically via the `postinstall` script.

**4. Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` and fill in your API keys:

```
DATABASE_URL="postgresql://aeroassist:aeroassist@localhost:5432/aeroassist?schema=public"
GROQ_API_KEY="gsk_your_key_here"
MODEL_NAME="qwen/qwen3.8-27b"
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY="ls_your_key_here"
LANGCHAIN_PROJECT="aeroassist"
```

**5. Run database migrations**

```bash
npm run db:migrate
```

This creates the `Customer`, `Booking`, `Conversation`, and `Event` tables.

**6. Seed the database**

```bash
npm run db:seed
```

This creates:
- **3 customers**: Alice Johnson (platinum), Bob Martinez (gold), Charlie Kim (silver)
- **6 bookings**: 3 cancelled, 2 delayed, 1 on-time, covering different routes and fare classes

**7. Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `GROQ_API_KEY` | Yes | — | Groq API key from [console.groq.com](https://console.groq.com/) |
| `MODEL_NAME` | No | `qwen/qwen3.8-27b` | Groq model identifier |
| `LANGCHAIN_TRACING_V2` | No | `true` | Enable LangSmith tracing |
| `LANGCHAIN_API_KEY` | No | — | LangSmith API key for trace visibility |
| `LANGCHAIN_PROJECT` | No | `aeroassist` | LangSmith project name |

---

## Database

### Schema

**Customer**
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Full name |
| email | String (unique) | Email address |
| loyaltyTier | String | `silver` \| `gold` \| `platinum` |
| createdAt | DateTime | Auto-set on creation |

**Booking**
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| customerId | String (FK) | References Customer |
| pnr | String (unique) | Booking reference |
| flightNumber | String | e.g. `AA100` |
| origin | String | IATA code, e.g. `LHR` |
| destination | String | IATA code, e.g. `JFK` |
| scheduledDeparture | DateTime | Scheduled departure time |
| status | String | `on_time` \| `delayed` \| `cancelled` \| `rebooked` |
| fareClass | String | `economy` \| `premium_economy` \| `business` \| `first` |

**Conversation**
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| customerId | String (FK) | References Customer |
| status | String | `active` \| `resolved` \| `escalated` |
| createdAt | DateTime | Auto-set on creation |

**Event** (append-only audit log)
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| conversationId | String (FK) | References Conversation |
| type | String | `message` \| `slot_extracted` \| `action_proposed` \| `action_executed` \| `escalated` |
| payload | Json | Event-specific data |
| actor | String | `user` \| `agent` \| `system` |
| createdAt | DateTime | Auto-set on creation |

### Useful Commands

```bash
npm run db:migrate    # Run pending migrations
npm run db:seed       # Re-seed the database
npm run db:reset      # Drop all tables, re-migrate, re-seed
npm run db:studio     # Open Prisma Studio (browser-based DB viewer)
```

---

## API Reference

### POST `/api/chat`

Invoke the agent graph and stream the response.

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "My flight was cancelled" }
  ],
  "conversationId": "optional-conversation-id",
  "customerId": "optional-customer-id"
}
```

- `conversationId` — If omitted, a new one is generated
- `customerId` — If omitted or invalid, falls back to the first available customer

**Response:** SSE stream (`text/event-stream`)

```
data: {"type":"text-delta","delta":"I'm sorry to hear that...","id":"msg-..."}

data: [DONE]
```

**Events written to database:**
1. `message` (actor: user) — the incoming user message
2. `slot_extracted` (actor: system) — detected intent, sentiment, filled/missing slots
3. `action_proposed` (actor: agent) — proposed action type, parameters, authority result
4. `action_executed` (actor: agent) — if authority result is `allow`
5. `escalated` (actor: system) — if authority result is `escalate`
6. `message` (actor: agent) — the final response text

---

### GET `/api/conversations/[id]/events`

Retrieve the full event log for a conversation.

**Response:**
```json
[
  {
    "id": "...",
    "conversationId": "...",
    "type": "message",
    "payload": { "content": "My flight was cancelled", "role": "user" },
    "actor": "user",
    "createdAt": "2026-09-17T..."
  },
  {
    "id": "...",
    "conversationId": "...",
    "type": "slot_extracted",
    "payload": { "intent": "cancellation", "sentiment": 0.6, "filledSlots": {...}, "missingSlots": [...] },
    "actor": "system",
    "createdAt": "2026-09-17T..."
  }
]
```

---

## Agent Architecture

The agent is built as a LangGraph `StateGraph` with 6 nodes and conditional edges.

### Graph Flow

```
                    ┌──────────────┐
                    │    START     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ classifyIntent│  LLM: intent + sentiment score
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ extractSlots  │  LLM: structured slot extraction
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ proposeAction │  LLM: action + policies injected
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ checkAuthority│  Pure code: rule table lookup
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐  ┌──▼───┐  ┌────▼─────┐
       │ executeAction│  │      │  │          │
       │  (allow)     │  │      │  │          │
       └──────┬──────┘  │      │  │          │
              │         │      │  │          │
              └─────────┼──────┼──┼──────────┘
                        │      │  │
                 ┌──────▼──────▼──▼──────┐
                 │   generateResponse     │  LLM: natural-language reply
                 └──────────┬────────────┘
                            │
                     ┌──────▼──────┐
                     │     END     │
                     └─────────────┘
```

### Graph State

Defined in `lib/agent-core/state.ts` using LangGraph `Annotation`:

| Field | Type | Description |
|-------|------|-------------|
| messages | Message[] | Full conversation history |
| intent | Intent \| null | Detected customer intent |
| sentiment | number | Frustration level (0–1) |
| filledSlots | Record | Extracted slot values |
| missingSlots | string[] | Slots still needed |
| proposedAction | ProposedAction \| null | Action the agent wants to take |
| authorityResult | AuthorityResult \| null | `allow` \| `require_confirmation` \| `escalate` |
| shouldEscalate | boolean | Whether to escalate |
| escalationReason | string \| null | Why escalation is needed |
| response | string \| null | Final response text |
| conversationId | string \| null | Current conversation ID |
| customerId | string \| null | Current customer ID |

---

## Authority Rules

The `checkAuthority` node (pure code, no LLM) evaluates the proposed action against a data-driven rule table in `lib/agent-core/authority-rules.ts`.

### Rules (first match wins)

| Action | Condition | Result | Reason |
|--------|-----------|--------|--------|
| `process_refund` | amount ≤ $200 | **allow** | Auto-execute per policy |
| `process_refund` | amount ≤ $1,000 | **require_confirmation** | Confirm with customer |
| `process_refund` | amount > $1,000 | **escalate** | Escalate to human agent |
| `rebook_flight` | fareDifference ≤ $0 | **allow** | No cost difference |
| `rebook_flight` | fareDifference ≤ $500 | **require_confirmation** | Confirm fare difference |
| `rebook_flight` | fareDifference > $500 | **escalate** | High cost escalation |
| `issue_voucher` | amount ≤ $100 | **allow** | Auto-issue |
| `issue_voucher` | amount > $100 | **require_confirmation** | Confirm with customer |
| `provide_information` | — | **allow** | Always auto-execute |
| `escalate_to_agent` | — | **escalate** | Always escalate |

### Results

- **`allow`** — Action is mock-executed immediately, `action_executed` event is written
- **`require_confirmation`** — Agent asks the customer to confirm; no action taken until confirmed
- **`escalate`** — Conversation status set to `escalated`; agent informs customer they're being transferred

---

## Service Policies

Static airline policy text is defined in `lib/agent-core/policies.ts` and injected into the LLM system prompt during the `proposeAction` step. This ensures factual, policy-grounded responses without RAG or vector search.

### Included Policies

1. **Cancellation Policy** — Customer rights, refund eligibility, rebooking rules, EU/US compensation
2. **Delay Policy** — Delay categories (< 2h, 2–4h, 4–8h, 8+h), entitlements by duration, loyalty tier perks
3. **Refund Policy** — Refund types (full/partial/taxes-only), 24-hour cooling-off, processing times
4. **Fare Difference Policy** — When fare differences apply, payment methods, fare class restrictions
5. **Loyalty Tier Benefits** — Silver/Gold/Platinum perks during disruptions, escalation thresholds, proactive actions

---

## Frontend

### Chat UI (`/chat`)

- Message bubbles: user (blue, right-aligned) vs agent (white, left-aligned with avatar)
- Typing indicator with animated bouncing dots
- Quick-reply suggestion chips for common scenarios
- Real-time SSE streaming — text appears as the agent generates it
- Error handling with user-friendly fallback message
- Responsive design with Tailwind CSS

### Landing Page (`/`)

- Links to chat and admin views
- Clean, centered layout

---

## Admin Audit View

### Conversation List (`/admin`)

- Table of all conversations with: ID, customer name, loyalty tier, status badge, event count
- Status badges: active (green), resolved (blue), escalated (red)
- "View Timeline" link per conversation
- **"Demo Only — No Authentication"** banner

### Event Timeline (`/admin/[conversationId]`)

- Vertical timeline with color-coded dots:
  - Blue = message
  - Purple = slot extracted
  - Yellow = action proposed
  - Green = action executed
  - Red = escalated
- Event type badges with formatted payload display
- Customer info header (name, loyalty tier, status)
- **"Demo Only — No Authentication"** banner

---

## Observability (LangSmith)

### Setup

1. Get a free API key at [smith.langchain.com](https://smith.langchain.com/)
2. Add to `.env`:
   ```
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY="ls_your_key_here"
   LANGCHAIN_PROJECT="aeroassist"
   ```

### What You'll See

Each graph execution produces a trace in LangSmith showing:

- **Node transitions** — classifyIntent → extractSlots → proposeAction → checkAuthority → (executeAction) → generateResponse
- **LLM inputs/outputs** — the full system prompt (including injected policies) and the structured output at each step
- **Latency per node** — identify bottlenecks
- **Metadata tags** — `conversationId` and `customerId` for grouping traces

### Viewing Traces

1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Select the **aeroassist** project
3. Click any trace to see the full execution graph

### Test Script

```bash
npm run test:graph
```

Runs a dummy cancellation conversation through the full graph. Requires valid `GROQ_API_KEY`. Prints the trace location for LangSmith verification.

---

## Testing

### Unit Tests (24 tests)

```bash
npm run test          # Run once
npm run test:watch    # Watch mode
```

**Authority rules** (`lib/agent-core/__tests__/authority-rules.test.ts`):
- 13 tests covering all action types, threshold boundaries, edge cases
- Verifies: refund ≤ $200 = allow, $200–$1000 = confirm, > $1000 = escalate
- Verifies: rebooking with no fare difference = allow, with difference = confirm/escalate
- Verifies: voucher thresholds, information always allowed, unknown actions escalate

**Intent slot schemas** (`lib/agent-core/__tests__/intent-slots.test.ts`):
- 11 tests across all 5 intent schemas
- Validates required fields (PNR always required)
- Validates optional fields (flight number, delay minutes, refund type)
- Confirms schema rejection of invalid data

### Graph Test

```bash
npm run test:graph
```

End-to-end test that invokes the full agent graph with a scripted cancellation conversation. Prints intent, sentiment, response, and action details. Validates the graph compiles and executes without errors.

---

## Example Conversations

### 1. Cancelled Flight (auto-allow refund ≤ $200)

```
User: My flight DL500 from SFO to Denver was cancelled
Agent: I'm very sorry to hear that your flight DL500 from SFO to Denver was
       cancelled. I understand how frustrating this must be. I can see your
       booking and since this was airline-initiated, you're entitled to a
       full refund. I've processed a refund of $180 — you'll see it in your
       account within 5-10 business days. Would you also like me to rebook
       you on the next available flight?
```

### 2. Delayed Flight (requires confirmation)

```
User: My flight UA300 is delayed by 3 hours
Agent: I can see your flight UA300 from Chicago to Miami is currently
       delayed by approximately 3 hours. Since the delay exceeds 2 hours,
       you're entitled to meal vouchers. I can issue a $75 meal voucher
       for you right now. Would you like me to proceed?
User: Yes please
Agent: Done! A $75 meal voucher has been issued. You'll receive it via
       email shortly. Is there anything else I can help you with?
```

### 3. Large Refund (escalation)

```
User: I need a refund for my business class booking ABC123, the ticket was $2,500
Agent: I understand you're requesting a refund of $2,500 for your business
       class booking. Since this amount exceeds our auto-processing threshold,
       I'm connecting you with a specialist who can assist you further and
       ensure everything is handled properly. Please hold on for a moment.
```

### 4. General Inquiry

```
User: What are my options if my flight gets cancelled?
Agent: If your flight is cancelled by the airline, you have three main options:
       1. Full refund to your original form of payment (processed in 5-10
          business days)
       2. Rebooking on the next available flight at no additional cost
       3. Rebooking on a later date that suits your schedule
       Additionally, if you're flying in the EU, you may be entitled to
       compensation of €250–€600 depending on the distance. Would you like
       help with any of these options?
```

---

## Scope Cuts (4-Hour MVP)

| Feature | Status | Reason |
|---------|--------|--------|
| Redis session store | Cut | Postgres handles state for this MVP |
| RAG / pgvector for policies | Cut | Policies injected directly into LLM context (only 5 rules) |
| Authentication / multi-tenancy | Cut | Admin view is demo-only, unauthenticated |
| Monorepo / workspaces | Cut | Single Next.js app, folder structure for separation |
| Real airline API integration | Cut | Actions are mock-executed; production would call real APIs |
| Multi-turn slot filling | Partial | Slots extracted per turn; missing slots prompt follow-up but no persistent slot accumulation across turns |
| Conversation history in DB | Cut | Current turn only; full history would require message persistence |

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest unit tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:graph` | Run test conversation through agent graph |
| `npm run postinstall` | Generate Prisma client (runs automatically on `npm install`) |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with test data |
| `npm run db:reset` | Drop all tables, re-migrate, re-seed |
| `npm run db:studio` | Open Prisma Studio (browser DB viewer) |
