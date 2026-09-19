# AeroAssist — Airline Disruption Support Agent

LIVE DEPLOYMENT LINK : https://aeroassist-sigma.vercel.app/

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

---

## Features

- **Stateless Chat** — Agent has zero customer data. Must always ask for name + PNR before helping. No "signed in" assumptions.
- **Intent Classification** — Detects cancellation, delay, refund, fare difference, or general inquiry with a sentiment/frustration score (0–1)
- **Structured Slot Extraction** — Extracts PNR, flight number, reason, etc. from natural language using Zod-validated schemas
- **Hallucination Prevention** — Deterministic `enforceRequiredSlots` node strips any values the LLM invents that aren't grounded in the customer's messages
- **Database Validation** — Validates PNR against real bookings in PostgreSQL before acting. One PNR can cover multiple flight segments.
- **Policy-Grounded Actions** — Injects static airline service rules (exact assignment spec) into the LLM context for factual, policy-compliant responses
- **Authority Rule Engine** — Data-driven rule table decides: auto-execute, require confirmation, or escalate to a human agent
- **Confirmation Flow** — Agent presents proposed action and asks for YES/NO confirmation before executing
- **Streaming Responses** — Real-time SSE streaming from the agent graph to the browser
- **Full Audit Trail** — Every state transition (message, intent, proposed action, executed action, escalation) is logged as an Event row
- **Admin Dashboard** — Conversation list with status badges and per-conversation event timeline
- **Prompt Registry** — All LLM prompts centralized in one module (`lib/agent-core/prompts/`). Edit once, propagates everywhere.
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
│   │   ├── policies.ts             # Static airline service rules (exact assignment spec)
│   │   ├── prompts/
│   │   │   └── index.ts            # Centralized prompt registry — all LLM prompts in one module
│   │   ├── nodes/
│   │   │   ├── classify-intent.ts  # LLM — classifies intent + sentiment score
│   │   │   ├── extract-slots.ts    # LLM — extracts structured slots per intent schema
│   │   │   ├── enforce-required-slots.ts  # Deterministic — strips hallucinated slot values
│   │   │   ├── validate-booking.ts # Prisma — validates PNR against database, enriches slots
│   │   │   ├── propose-action.ts   # LLM — proposes action with policies injected into prompt
│   │   │   ├── check-authority.ts  # Pure code — evaluates authority rules (no LLM)
│   │   │   ├── execute-action.ts   # Pure code — mock-executes actions (refund, rebook, voucher)
│   │   │   └── generate-response.ts# LLM — produces natural-language reply to customer
│   │   ├── schemas/
│   │   │   ├── intent-slots.ts     # Zod schemas for each intent's required/optional slots
│   │   │   └── llm-schemas.ts      # Zod schemas for LLM structured output
│   │   └── __tests__/
│   │       ├── authority-rules.test.ts  # 12 tests for authority rule table
│   │       └── intent-slots.test.ts     # 21 tests for slot schemas
│   └── db/
│       └── index.ts                # PrismaClient singleton (handles Next.js hot reload)
│
├── prisma/
│   ├── schema.prisma               # Customer, Booking, Conversation, Event models
│   ├── seed.ts                     # Seeds 3 customers + 4 bookings (exact assignment data)
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

**5. Run database migrations and seed**

```bash
npx prisma db push --force-reset
npx prisma db seed
```

This creates the tables and seeds:
- **3 customers**: Priya Nair (Gold), Arvind Kulkarni (Silver), Meher Kaur (Platinum)
- **4 bookings**: 1 cancelled, 2 delayed, 1 on-time, matching the assignment scenarios

**6. Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quick Reset

If something breaks, reset the database to a clean state:

```bash
npx prisma db push --force-reset && npx prisma db seed
```

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
| pnr | String | Booking reference (one PNR can have multiple segments) |
| flightNumber | String | e.g. `SK-204` |
| origin | String | IATA code, e.g. `DEL` |
| destination | String | IATA code, e.g. `GOI` |
| scheduledDeparture | DateTime | Scheduled departure time |
| status | String | `on_time` \| `delayed` \| `cancelled` \| `rebooked` |
| fareClass | String | `economy` \| `premium_economy` \| `business` \| `first` |

Unique constraint: `[pnr, flightNumber]` — one PNR can cover multiple flight segments.

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

### Seeded Data

| Customer | Tier | PNR | Flight | Route | Status |
|----------|------|-----|--------|-------|--------|
| Priya Nair | Gold | SK4821X | SK-204 | DEL → GOI | cancelled |
| Priya Nair | Gold | SK4821X | SK-204R | GOI → DEL | on_time |
| Arvind Kulkarni | Silver | TR1190B | SK-118 | BOM → BLR | delayed |
| Meher Kaur | Platinum | WL7742 | SK-305 | DEL → HYD | delayed |

### Useful Commands

```bash
npx prisma db push --force-reset   # Reset database to schema
npx prisma db seed                 # Re-seed with assignment data
npx prisma db studio               # Open Prisma Studio (browser-based DB viewer)
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
  "conversationId": "optional-conversation-id"
}
```

- `conversationId` — If omitted, a new one is generated
- The agent is **stateless** — it has no customer data and must ask for name + PNR

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

The agent is built as a LangGraph `StateGraph` with 8 nodes and conditional edges.

### Graph Flow

```
START
  │
  ▼
┌─────────────────┐
│  classifyIntent  │  LLM: intent + sentiment score
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  extractSlots    │  LLM: structured slot extraction
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│ enforceRequiredSlots │  Deterministic: strips hallucinated values
└────────┬─────────────┘
         │
    missingSlots > 0?
    ┌────┴────┐
    │ YES     │ NO
    ▼         ▼
┌────────┐  ┌──────────────┐
│generate│  │validateBooking│  Prisma: PNR lookup + name verification
│Response│  └──────┬───────┘
│(ask)   │    PNR valid?
└───┬────┘    ┌────┴────┐
    │         │ NO      │ YES
    ▼         ▼         ▼
  END     ┌────────┐  ┌──────────────┐
          │generate│  │ proposeAction │  LLM: action + policies
          │Response│  └──────┬───────┘
          │(ask)   │         │
          └───┬────┘         ▼
              │        ┌──────────────┐
            END        │ checkAuthority│  Pure code: rule table
                       └──────┬───────┘
                              │
                    authorityResult?
                    ┌─────┼─────────┐
                    │     │         │
                allow  confirm   escalate
                    │     │         │
                    ▼     ▼         ▼
              ┌─────────┐ ┌────────┐ ┌────────┐
              │execute  │ │generate│ │generate│
              │Action   │ │Response│ │Response│
              └────┬────┘ │(ask)   │ │(escalate│
                   │      └───┬────┘ └───┬────┘
                   ▼          │          │
              ┌────────┐      │          │
              │generate│      │          │
              │Response│      │          │
              └───┬────┘      │          │
                  │           │          │
                  ▼           ▼          ▼
                 END         END        END
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

### Prompt Registry

All LLM prompts are centralized in `lib/agent-core/prompts/index.ts`. Key functions:

| Function | Used by node | Purpose |
|----------|-------------|---------|
| `classifyIntentPrompt()` | classifyIntent | Intent + sentiment classification |
| `extractSlotsPrompt()` | extractSlots | Structured slot extraction |
| `enforceSlotsPrompt()` | enforceRequiredSlots | Hallucination verification (currently unused — deterministic) |
| `proposeActionPrompt()` | proposeAction | Action proposal with policies |
| `selectResponsePrompt()` | generateResponse | Routes to correct response mode |

Shared constant: `NO_CUSTOMER_DATA` — tells the LLM it has zero customer info. Edit once, propagates to all nodes.

---

## Authority Rules

The `checkAuthority` node (pure code, no LLM) evaluates the proposed action against a data-driven rule table in `lib/agent-core/authority-rules.ts`.

### Rules (first match wins)

| Action | Condition | Result | Reason |
|--------|-----------|--------|--------|
| `rebook_flight` | fareDifference = 0 | **allow** | Airline-caused cancellation: free rebooking |
| `rebook_flight` | fareDifference ≤ ₹1,500 | **require_confirmation** | Confirm fare difference |
| `rebook_flight` | fareDifference > ₹1,500 | **escalate** | Escalate to supervisor |
| `process_refund` | — | **allow** | Airline-caused: full refund within 7 days |
| `issue_voucher` | amount ≤ ₹500 | **allow** | Meal voucher per delay policy |
| `issue_voucher` | amount > ₹500 | **require_confirmation** | Confirm with customer |
| `issue_lounge_access` | — | **allow** | Delay > 3 hours |
| `arrange_hotel` | — | **allow** | Delay > 5 hours (delayed hours only) |
| `provide_information` | — | **allow** | Always auto-execute |
| `escalate_to_agent` | — | **escalate** | Legal threats / formal complaints |

### Results

- **`allow`** — Action is mock-executed immediately, `action_executed` event is written
- **`require_confirmation`** — Agent asks the customer to confirm; no action taken until confirmed
- **`escalate`** — Conversation status set to `escalated`; agent informs customer they're being transferred

---

## Service Policies

Static airline policy text is defined in `lib/agent-core/policies.ts` — exact rules from the assignment spec. Injected into the LLM system prompt during the `proposeAction` step.

### Included Policies

1. **Cancellation Rebooking Rule** — Free rebooking on next available flight within 24h, or full refund (customer's choice)
2. **Delay Compensation Rule** — Under 3h: ₹500 meal voucher. Over 3h: voucher + lounge access. Over 5h: voucher + hotel (delayed hours only, not full night)
3. **Refund Processing Rule** — Full refund within 7 business days to original payment method only
4. **Fare Difference Rule** — Agent cannot waive fare differences above ₹1,500 without supervisor approval
5. **Loyalty Tier Rule** — Gold/Platinum get priority rebooking, no additional compensation

### Allowed Actions

- Rebook on next available flight within 24h (airline-caused)
- Issue meal vouchers and lounge access per delay policy
- Arrange hotel accommodation for delayed hours (delay > 5h)
- Initiate refund request for airline-caused cancellations
- Provide booking and flight status information

### Prohibited Actions (must escalate)

- Approving compensation beyond stated policy amounts
- Waiving fare difference above ₹1,500
- Making exceptions for non-airline-caused disruptions
- Handling threats of legal action or formal complaints
- Processing refunds to a different payment method

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

- **Node transitions** — classifyIntent → extractSlots → enforceRequiredSlots → validateBooking → proposeAction → checkAuthority → (executeAction) → generateResponse
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

### Unit Tests (33 tests)

```bash
npm run test          # Run once
npm run test:watch    # Watch mode
```

**Authority rules** (`lib/agent-core/__tests__/authority-rules.test.ts`):
- 12 tests covering all action types, threshold boundaries, edge cases
- Verifies: airline-caused cancellation rebooking = allow
- Verifies: fare difference thresholds (₹1,500), voucher limits (₹500)
- Verifies: lounge access, hotel accommodation, information always allowed
- Verifies: unknown actions escalate by default

**Intent slot schemas** (`lib/agent-core/__tests__/intent-slots.test.ts`):
- 21 tests across all 5 intent schemas
- Validates required fields (PNR, customerName, reason always required)
- Validates optional fields (flight number, delay minutes, refund type)
- Confirms schema rejection of invalid data

### Graph Test

```bash
npm run test:graph
```

End-to-end test that invokes the full agent graph with a scripted cancellation conversation. Prints intent, sentiment, response, and action details. Validates the graph compiles and executes without errors.

---

## Example Conversations

### 1. Delayed Flight — Full Flow

```
User: My flight is delayed
Agent: I need some information before I can help you.
       Could you please provide your full name and your booking reference (PNR number)?

User: My name is Arvind Kulkarni and my PNR is TR1190B
Agent: [Validates PNR against database → finds SK-118 BOM→BLR, delayed]
       How can I help you with this? (rebooking, compensation, meal voucher, hotel...)

User: I want compensation for the delay
Agent: Based on your booking and our policies, I can take the following action:
       Action: issue_voucher
       Details: { "amount": 500, "type": "meal_voucher" }
       Would you like me to proceed? Please confirm with YES or NO.

User: Yes
Agent: Done! A ₹500 meal voucher has been issued to your account.
       Is there anything else we could have done better, or any other way I can help?
```

### 2. Cancelled Flight — Refund

```
User: Hi
Agent: Could you please provide your full name and your booking reference (PNR number)?

User: Priya Nair, SK4821X
Agent: [Validates → finds SK-204 DEL→GOI, cancelled]
       How can I help you with this? (rebooking, refund, compensation...)

User: I want a full refund
Agent: Action: process_refund
       Details: { "amount": "full", "method": "original_payment" }
       Would you like me to proceed? YES or NO?

User: yes
Agent: Done! A full refund has been initiated. It will be processed within 7
       business days to your original payment method.
```

### 3. Escalation — Legal Threat

```
User: This is unacceptable, I'm going to file a formal complaint and consider legal action
Agent: I hear you, and I'm sorry this has been such a frustrating experience.
       I want to make sure this gets the right attention — I'm escalating this to
       our specialist support team right now, and they'll reach out to you directly.
```

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
| `npx prisma db push --force-reset` | Reset database to schema |
| `npx prisma db seed` | Seed database with assignment data |
| `npx prisma db studio` | Open Prisma Studio (browser DB viewer) |
