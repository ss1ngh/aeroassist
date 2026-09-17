import { ChatGroq } from "@langchain/groq";
import type { AgentStateType } from "../state";
import { ProposedActionSchema } from "../schemas/llm-schemas";
import { ALL_POLICIES } from "../policies";

function getModel() {
  return new ChatGroq({
    model: process.env.MODEL_NAME ?? "llama-3.3-70b-versatile",
    temperature: 0,
  });
}

/**
 * Propose an action based on the detected intent, filled slots, and service policies.
 * The static policy text is injected into the LLM system prompt for factual grounding.
 */
export async function proposeAction(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const model = getModel().withStructuredOutput(ProposedActionSchema);

  const conversationText = state.messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const result = await model.invoke([
    {
      role: "system",
      content: `You are an airline customer service agent. Based on the customer's intent and extracted slots, propose the appropriate action.

## Service Policies
${ALL_POLICIES}

## Current State
Intent: ${state.intent}
Filled slots: ${JSON.stringify(state.filledSlots)}
Sentiment level: ${state.sentiment}

## Instructions
- If intent is "cancellation" and reason is "airline_fault", propose a refund or rebooking.
- If intent is "delay", check delay duration and propose appropriate compensation.
- If intent is "refund", propose the correct refund type based on the policy.
- If intent is "fare_difference", calculate and propose rebooking with fare difference.
- If intent is "general_inquiry", provide information.
- If the situation is complex or the customer is very frustrated (sentiment > 0.7), consider escalation.

Propose exactly one action.`,
    },
    {
      role: "user",
      content: conversationText,
    },
  ]);

  return {
    proposedAction: {
      type: result.type,
      parameters: result.parameters,
      rationale: result.rationale,
    },
  };
}
