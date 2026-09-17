import type { AgentStateType } from "../state";
import { IntentSlotSchemas } from "../schemas/intent-slots";

/**
 * Deterministic enforcement of required slots — NO LLM call.
 *
 * The extractSlots LLM sometimes hallucinates values (invents a PNR or name)
 * even when the customer never said them. This node checks each filled slot
 * value against the actual customer messages using string matching.
 *
 * This is the hard gate that ensures the agent always asks for real information.
 * Zero LLM cost, zero latency overhead.
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

  // Build a set of all customer messages (lowercased for matching)
  const customerMessages = state.messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  // Check each filled slot: does the value appear in the customer's messages?
  const cleanedSlots = { ...state.filledSlots };
  const hallucinated: string[] = [];

  for (const slot of slotsToVerify) {
    const value = String(state.filledSlots[slot]).trim();

    // Skip internal/computed fields (prefixed with _)
    if (slot.startsWith("_")) continue;

    // Check if the value (or a close variant) appears in the customer's messages
    const isGrounded = isValueGrounded(value, customerMessages);

    if (!isGrounded) {
      delete cleanedSlots[slot];
      hallucinated.push(slot);
    }
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

/**
 * Check if a value is grounded in the customer's messages.
 * Uses multiple strategies to catch common patterns:
 * - Exact match (case-insensitive)
 * - Partial match (for names like "Priya" in "Priya Nair")
 * - Alphanumeric match (for PNRs like "TR1190B")
 */
function isValueGrounded(value: string, messages: string): boolean {
  const lowerValue = value.toLowerCase();

  // Exact match
  if (messages.includes(lowerValue)) return true;

  // For multi-word values (like "Priya Nair"), check each word
  const words = lowerValue.split(/\s+/).filter((w) => w.length > 2);
  if (words.length > 1) {
    const allWordsFound = words.every((word) => messages.includes(word));
    if (allWordsFound) return true;
  }

  // For alphanumeric codes (PNRs), check with common separators removed
  // "TR1190B" should match "tr1190b" in the message
  if (/^[a-z0-9]+$/i.test(value)) {
    const stripped = messages.replace(/[\s\-_.]/g, "");
    if (stripped.includes(lowerValue)) return true;
  }

  return false;
}
