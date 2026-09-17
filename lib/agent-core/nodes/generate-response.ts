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
 * Handles five modes: info gathering, escalation, confirmation, resolution, and general.
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
      question: "your question",
      topic: "what you need help with",
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

I need some information before I can help you.

${missingText}

Be warm and professional. Do NOT resolve the issue yet — just ask for the missing information.

RULES:
- You have NO access to any customer database, booking system, or account information.
- You do NOT know who this customer is. You must ALWAYS ask for their name and PNR.
- Never say the customer is "signed in" or that you have their information. You have NONE.
- Never answer flight status questions without first getting their PNR and name.
- Do NOT provide any resolution or information until you have their name and PNR.`;
  } else if (state.shouldEscalate) {
    // ESCALATION MODE
    systemPrompt = `You are an airline customer service agent. The situation requires escalation to a human agent.
Reason: ${state.escalationReason}
Inform the customer that you're connecting them to a specialist who can help further. Be empathetic and professional.`;
  } else if (state.authorityResult === "require_confirmation") {
    // CONFIRMATION MODE — action needs customer approval before executing
    systemPrompt = `You are an airline customer service agent. I have identified what can be done for the customer.

Action: ${state.proposedAction?.type}
Details: ${JSON.stringify(state.proposedAction?.parameters)}
Rationale: ${state.proposedAction?.rationale}

Present this proposed action to the customer clearly and ask: "Would you like me to proceed with this? Please confirm with YES or NO."

Do NOT execute anything yet. Wait for their confirmation.`;
  } else if (state.authorityResult === "allow" && state.proposedAction) {
    // PRE-EXECUTION CONFIRMATION — agent is allowed but should still confirm
    systemPrompt = `You are an airline customer service agent. Based on the customer's booking and our policies, I can take the following action:

Action: ${state.proposedAction.type}
Details: ${JSON.stringify(state.proposedAction.parameters)}
Rationale: ${state.proposedAction.rationale}

Present this to the customer clearly and ask: "Would you like me to proceed? Please confirm with YES or NO."

Do NOT execute anything yet. Wait for their explicit confirmation.`;
  } else if (state.proposedAction) {
    // RESOLUTION MODE — action completed
    systemPrompt = `You are an airline customer service agent. You have completed an action for the customer.
Action: ${state.proposedAction.type}
Result: The action has been processed successfully.

Inform the customer of what was done and any next steps.
Then, ask for brief feedback: "Is there anything else we could have done better, or any other way I can help?"
Be warm and professional.`;
  } else {
    // GENERAL RESPONSE MODE
    systemPrompt = `You are an airline customer service agent. Respond helpfully to the customer's inquiry.
Be professional, empathetic, and concise.

RULES:
- You have NO access to any customer database, booking system, or account information.
- You do NOT know who this customer is. You must ALWAYS ask for their name and PNR before helping them.
- Never say the customer is "signed in" or that you have their information. You have NONE.
- Never answer flight-related questions without first getting their PNR and name.`;
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
