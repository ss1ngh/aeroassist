import { ChatGroq } from "@langchain/groq";
import type { AgentStateType } from "../state";
import { IntentSlotSchemas } from "../schemas/intent-slots";
import { SlotExtractionSchema } from "../schemas/llm-schemas";

function getModel() {
  return new ChatGroq({
    model: process.env.MODEL_NAME ?? "qwen/qwen3.8-27b",
    temperature: 0,
  });
}

/**
 * Extract structured slots from the conversation based on the detected intent.
 * Returns filled slots and a list of missing required slots.
 *
 * IMPORTANT: The LLM must ONLY extract values the customer explicitly stated.
 * It must NEVER invent, guess, or assume values. If a value is not mentioned,
 * it must be left out of filledSlots so it appears in missingSlots.
 */
export async function extractSlots(state: AgentStateType): Promise<Partial<AgentStateType>> {
  if (!state.intent) {
    return { filledSlots: {}, missingSlots: [] };
  }

  const slotSchema = IntentSlotSchemas[state.intent];
  if (!slotSchema) {
    return { filledSlots: {}, missingSlots: [] };
  }

  const shape = (slotSchema as unknown as { shape: Record<string, unknown> }).shape;
  const requiredSlots = Object.keys(shape).filter((key) => {
    const field = shape[key];
    return !(field && typeof field === "object" && "isOptional" in field && field.isOptional);
  });

  const model = getModel().withStructuredOutput(SlotExtractionSchema);

  const conversationText = state.messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const result = await model.invoke([
    {
      role: "system",
      content: `You are extracting information from an airline customer service conversation.

CRITICAL RULES:
- ONLY extract values the customer EXPLICITLY stated in their message.
- NEVER invent, guess, assume, or hallucinate values. If the customer did not say it, do NOT include it.
- NEVER make up a PNR, name, flight number, or any other detail.
- If the customer says "I need a refund" without giving their name, PNR, or flight details, those slots are MISSING.
- The filledSlots object should ONLY contain keys where the customer explicitly provided the value.
- The missingSlots array should contain ALL required fields the customer has NOT yet provided.

The customer's intent is: ${state.intent}.
Required fields for this intent: ${requiredSlots.join(", ")}
Already filled slots from previous turns: ${JSON.stringify(state.filledSlots)}.

Extract ONLY what the customer explicitly said in their latest message. If they haven't provided required information, leave it missing.`,
    },
    {
      role: "user",
      content: conversationText,
    },
  ]);

  const mergedSlots = { ...state.filledSlots, ...result.filledSlots };
  const stillMissing = requiredSlots.filter(
    (slot) => mergedSlots[slot] === undefined || mergedSlots[slot] === null || mergedSlots[slot] === "",
  );

  return {
    filledSlots: mergedSlots,
    missingSlots: stillMissing,
  };
}
