import { ChatGroq } from "@langchain/groq";
import type { AgentStateType } from "../state";
import { ResponseSchema } from "../schemas/llm-schemas";

function getModel() {
  return new ChatGroq({
    model: process.env.MODEL_NAME ?? "qwen/qwen3.8-27b",
    temperature: 0.3,
  });
}

/**
 * Generate the final natural-language response to the customer.
 * Handles four modes: info gathering, escalation, confirmation, resolution, and feedback.
 */
export async function generateResponse(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const model = getModel().withStructuredOutput(ResponseSchema);

  let systemPrompt: string;

  if (state.missingSlots.length > 0) {
    // INFO GATHERING MODE — ask for missing required information
    const slotDescriptions: Record<string, string> = {
      customerName: "your full name",
      pnr: "your booking reference (PNR number)",
      flightNumber: "your flight number",
      origin: "the departure airport",
      destination: "the arrival airport",
      reason: "the reason for your request",
      refundType: "the type of refund you prefer (full, partial, or taxes only)",
      amount: "the refund amount if you know it",
      newFlightNumber: "the flight number you'd like to change to",
      feedback: "any feedback or suggestions about your experience",
    };

    const missingDescriptions = state.missingSlots
      .map((slot) => slotDescriptions[slot] || slot)
      .filter(Boolean);

    let missingText: string;
    if (missingDescriptions.length === 1) {
      missingText = `Could you please provide ${missingDescriptions[0]}?`;
    } else if (missingDescriptions.length === 2) {
      missingText = `Could you please provide ${missingDescriptions[0]} and ${missingDescriptions[1]}?`;
    } else {
      const last = missingDescriptions.pop()!;
      missingText = `Could you please provide ${missingDescriptions.join(", ")}, and ${last}?`;
    }

    systemPrompt = `You are an airline customer service agent. The customer has a ${state.intent || "general"} issue.
I need some information before I can help resolve this.

${missingText}

Be warm and professional. Briefly explain why you need this information if it helps the customer understand.
Do NOT resolve the issue yet — just ask for the missing information.`;
  } else if (state.shouldEscalate) {
    // ESCALATION MODE
    systemPrompt = `You are an airline customer service agent. The situation requires escalation to a human agent.
Reason: ${state.escalationReason}
Inform the customer that you're connecting them to a specialist who can help further. Be empathetic and professional.`;
  } else if (state.authorityResult === "require_confirmation") {
    // CONFIRMATION MODE
    systemPrompt = `You are an airline customer service agent. You have a proposed action that needs customer confirmation.
Action: ${state.proposedAction?.type}
Details: ${JSON.stringify(state.proposedAction?.parameters)}
Rationale: ${state.proposedAction?.rationale}
Ask the customer to confirm they want to proceed.`;
  } else if (state.proposedAction) {
    // RESOLUTION MODE — action completed, now also ask for feedback
    systemPrompt = `You are an airline customer service agent. You have completed an action for the customer.
Action: ${state.proposedAction.type}
Result: The action has been processed successfully.

Inform the customer of what was done and any next steps.
Then, ask for brief feedback: "Is there anything else we could have done better, or any other way I can help?"
Be warm and professional.`;
  } else {
    // GENERAL RESPONSE MODE
    systemPrompt = `You are an airline customer service agent. Respond helpfully to the customer's inquiry.
Be professional, empathetic, and concise.`;
  }

  const result = await model.invoke([
    { role: "system", content: systemPrompt },
    ...state.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ]);

  return { response: result.response };
}
