import { ChatGroq } from "@langchain/groq";
import type { AgentStateType } from "../state";
import { ResponseSchema } from "../schemas/llm-schemas";

function getModel() {
  return new ChatGroq({
    model: process.env.MODEL_NAME ?? "llama-3.3-70b-versatile",
    temperature: 0.3,
  });
}

/**
 * Generate the final natural-language response to the customer.
 * Incorporates the proposed action result and any escalation status.
 */
export async function generateResponse(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const model = getModel().withStructuredOutput(ResponseSchema);

  let systemPrompt: string;

  if (state.shouldEscalate) {
    systemPrompt = `You are an airline customer service agent. The situation requires escalation to a human agent.
Reason: ${state.escalationReason}
Inform the customer that you're connecting them to a specialist who can help further. Be empathetic and professional.`;
  } else if (state.authorityResult === "require_confirmation") {
    systemPrompt = `You are an airline customer service agent. You have a proposed action that needs customer confirmation.
Action: ${state.proposedAction?.type}
Details: ${JSON.stringify(state.proposedAction?.parameters)}
Rationale: ${state.proposedAction?.rationale}
Ask the customer to confirm they want to proceed.`;
  } else if (state.proposedAction) {
    systemPrompt = `You are an airline customer service agent. You have completed an action for the customer.
Action: ${state.proposedAction.type}
Result: The action has been processed successfully.
Inform the customer of what was done and any next steps.`;
  } else {
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
