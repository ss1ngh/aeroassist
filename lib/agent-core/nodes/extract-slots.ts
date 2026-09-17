import { ChatGroq } from "@langchain/groq";
import type { AgentStateType } from "../state";
import { IntentSlotSchemas } from "../schemas/intent-slots";
import { SlotExtractionSchema } from "../schemas/llm-schemas";
import { extractSlotsPrompt } from "../prompts";

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
    return !(field && typeof field === "object" && "isOptional" in field && field.isOptional);
  });

  const model = getModel().withStructuredOutput(SlotExtractionSchema);

  const conversationText = state.messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const result = await model.invoke([
    {
      role: "system",
      content: extractSlotsPrompt(state.intent, requiredSlots, state.filledSlots),
    },
    { role: "user", content: conversationText },
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
