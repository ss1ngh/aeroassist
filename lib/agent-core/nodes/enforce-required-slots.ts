import { ChatGroq } from "@langchain/groq";
import type { AgentStateType } from "../state";
import { IntentSlotSchemas } from "../schemas/intent-slots";

function getModel() {
  return new ChatGroq({
    model: process.env.MODEL_NAME ?? "qwen/qwen3.8-27b",
    temperature: 0,
  });
}

/**
 * Deterministic enforcement of required slots.
 *
 * The extractSlots LLM sometimes hallucinates values (invents a PNR or name)
 * even when the customer never said them. This node uses a second LLM call
 * as a verifier: it compares each filled slot value against the actual
 * conversation and strips any that aren't grounded in the customer's messages.
 *
 * This is the hard gate that ensures the agent always asks for real information.
 */
export async function enforceRequiredSlots(state: AgentStateType): Promise<Partial<AgentStateType>> {
  if (!state.intent || !state.filledSlots || Object.keys(state.filledSlots).length === 0) {
    return {};
  }

  const slotSchema = IntentSlotSchemas[state.intent];
  if (!slotSchema) return {};

  const shape = (slotSchema as unknown as { shape: Record<string, unknown> }).shape;
  const requiredSlots = Object.keys(shape).filter((key) => {
    const field = shape[key];
    return !(field && typeof field === "object" && "isOptional" in field && field.isOptional);
  });

  // Only check required slots that have values
  const slotsToVerify = requiredSlots.filter(
    (slot) => state.filledSlots[slot] !== undefined && state.filledSlots[slot] !== null && state.filledSlots[slot] !== "",
  );

  if (slotsToVerify.length === 0) {
    // All required slots are empty — compute missing list
    const missing = requiredSlots.filter(
      (slot) => !state.filledSlots[slot] || state.filledSlots[slot] === "",
    );
    return { missingSlots: missing };
  }

  // Build the conversation text for verification
  const conversationText = state.messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  // Ask the verifier LLM: did the CUSTOMER actually say these values?
  const model = getModel();
  const slotList = slotsToVerify
    .map((slot) => `- "${slot}" = "${state.filledSlots[slot]}"`)
    .join("\n");

  const result = await model.invoke([
    {
      role: "system",
      content: `You are a verification assistant. You will be given a list of slot values that an extraction system claims the CUSTOMER provided, and the full conversation history.

Your job: for each slot, determine if the CUSTOMER explicitly stated that value in their messages.

RULES:
- A value is GROUNDED if the customer's message contains that exact value or a clear synonym.
- A value is HALLUCINATED if the customer never mentioned it, even indirectly.
- Names must appear in the customer's messages to be grounded.
- PNRs/codes must appear in the customer's messages to be grounded.
- If the customer said "my name is Priya" then "Priya" is grounded.
- If the customer said nothing about their name, any name value is HALLUCINATED.

Return a JSON object with two arrays:
- "grounded": slot names where the value IS supported by the customer's messages
- "hallucinated": slot names where the value is NOT supported (invented by the system)

Slot values to verify:
${slotList}

Conversation:
${conversationText}`,
    },
    {
      role: "user",
      content: "Verify each slot value. Return JSON with 'grounded' and 'hallucinated' arrays.",
    },
  ]);

  // Parse the response
  let hallucinated: string[] = [];

  try {
    const content = typeof result.content === "string" ? result.content : JSON.stringify(result.content);
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      hallucinated = parsed.hallucinated ?? [];
    }
  } catch {
    // If parsing fails, be conservative: treat all as hallucinated
    hallucinated = slotsToVerify;
  }

  // Build cleaned slots: only keep grounded values
  const cleanedSlots = { ...state.filledSlots };
  for (const slot of hallucinated) {
    delete cleanedSlots[slot];
  }

  // Recompute missing slots
  const missing = requiredSlots.filter(
    (slot) => cleanedSlots[slot] === undefined || cleanedSlots[slot] === null || cleanedSlots[slot] === "",
  );

  return {
    filledSlots: cleanedSlots,
    missingSlots: missing,
  };
}
