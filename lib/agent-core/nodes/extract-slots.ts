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
    // ZodOptional fields have an `isOptional` method or are wrapped in ZodOptional
    return !(field && typeof field === "object" && "isOptional" in field && field.isOptional);
  });

  const model = getModel().withStructuredOutput(SlotExtractionSchema);

  const conversationText = state.messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const result = await model.invoke([
    {
      role: "system",
      content: `Extract structured slots from this airline customer service conversation.
The customer's intent is: ${state.intent}.
Already filled slots: ${JSON.stringify(state.filledSlots)}.
Extract any new slot values from the conversation. For missing slots, list only the ones not yet filled.
If the PNR/booking reference is mentioned, extract it.`,
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
