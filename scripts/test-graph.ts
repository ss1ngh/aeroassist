/**
 * Test script that runs a dummy conversation through the agent graph.
 *
 * Usage:
 *   npx tsx scripts/test-graph.ts
 *
 * Requires:
 *   - GROQ_API_KEY set in .env (or environment)
 *   - DATABASE_URL pointing to a running Postgres instance
 *
 * The script will:
 *   1. Create a test conversation through the full graph
 *   2. Print the agent's response and internal state
 *   3. If LangSmith is configured, traces will appear in the LangSmith dashboard
 */

import "dotenv/config";
import { invokeAgent } from "../lib/agent-core/invoke";
import type { Message } from "../lib/agent-core/state";

const TEST_CONVERSATION_ID = `test-conv-${Date.now()}`;
const TEST_CUSTOMER_ID = "cmu5lu3jt0000hqxwiklsfz6n"; // Alice Johnson (platinum)

const TEST_MESSAGES: Message[] = [
  {
    role: "user",
    content: "My flight AA100 from London to New York was cancelled! I need help rebooking or getting a refund.",
    timestamp: new Date().toISOString(),
  },
];

async function main() {
  console.log("=== Agent Graph Test ===");
  console.log(`Conversation ID: ${TEST_CONVERSATION_ID}`);
  console.log(`Customer ID: ${TEST_CUSTOMER_ID}`);
  console.log("");

  try {
    console.log("Invoking agent graph...");
    const result = await invokeAgent({
      conversationId: TEST_CONVERSATION_ID,
      customerId: TEST_CUSTOMER_ID,
      messages: TEST_MESSAGES,
    });

    console.log("");
    console.log("=== Result ===");
    console.log(`Intent: ${result.intent}`);
    console.log(`Sentiment: ${result.sentiment}`);
    console.log(`Response: ${result.response}`);
    console.log(`Proposed Action: ${result.proposedAction?.type ?? "none"}`);
    console.log(`Authority Result: ${result.authorityResult}`);
    console.log(`Should Escalate: ${result.shouldEscalate}`);
    if (result.escalationReason) {
      console.log(`Escalation Reason: ${result.escalationReason}`);
    }

    console.log("");
    console.log("=== Trace ===");
    console.log("If LANGCHAIN_TRACING_V2=true and LANGCHAIN_API_KEY is set,");
    console.log("the full execution trace is visible in LangSmith dashboard.");
    console.log(`Search for conversationId: ${TEST_CONVERSATION_ID}`);
  } catch (error) {
    console.error("");
    console.error("=== Error ===");
    console.error("Graph execution failed:");
    console.error(error instanceof Error ? error.message : error);
    console.error("");
    console.error("Common causes:");
    console.error("  - GROQ_API_KEY not set or invalid");
    console.error("  - DATABASE_URL not reachable");
    console.error("  - Model not available on Groq free tier");
    process.exit(1);
  }
}

main();
