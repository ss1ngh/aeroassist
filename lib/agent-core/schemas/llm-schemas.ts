import { z } from "zod";

/** Classification result returned by the LLM. */
export const ClassificationSchema = z.object({
  intent: z.enum([
    "cancellation",
    "delay",
    "refund",
    "fare_difference",
    "general_inquiry",
  ]),
  sentiment: z
    .number()
    .min(0)
    .max(1)
    .describe("Frustration level from 0 (calm) to 1 (very frustrated)"),
  reasoning: z.string().optional().describe("Brief reasoning for the classification"),
});

/** Slot extraction result returned by the LLM. */
export const SlotExtractionSchema = z.object({
  filledSlots: z.record(z.string(), z.unknown()).describe("Extracted slot values"),
  missingSlots: z.array(z.string()).describe("Slot names still needed"),
});

/** Proposed action result returned by the LLM. */
export const ProposedActionSchema = z.object({
  type: z.enum([
    "process_refund",
    "rebook_flight",
    "issue_voucher",
    "issue_lounge_access",
    "arrange_hotel",
    "provide_information",
    "escalate_to_agent",
  ]),
  parameters: z.record(z.string(), z.unknown()).describe("Action parameters"),
  rationale: z.string().describe("Why this action is appropriate"),
});

/** Response generation result returned by the LLM. */
export const ResponseSchema = z.object({
  response: z.string().describe("Natural-language reply to the customer"),
});
