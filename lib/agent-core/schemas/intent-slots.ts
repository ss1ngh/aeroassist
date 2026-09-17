import { z } from "zod";

/** Slot schema for cancellation intent. */
export const CancellationSlotsSchema = z.object({
  pnr: z.string().describe("Booking reference / PNR"),
  flightNumber: z.string().optional().describe("Flight number if known"),
  reason: z
    .enum(["airline_fault", "customer_request", "weather", "other"])
    .optional()
    .describe("Reason for cancellation"),
});

/** Slot schema for delay intent. */
export const DelaySlotsSchema = z.object({
  pnr: z.string().describe("Booking reference / PNR"),
  flightNumber: z.string().optional().describe("Flight number if known"),
  currentDelayMinutes: z
    .number()
    .optional()
    .describe("Current delay duration in minutes"),
});

/** Slot schema for refund intent. */
export const RefundSlotsSchema = z.object({
  pnr: z.string().describe("Booking reference / PNR"),
  refundType: z
    .enum(["full", "partial", "taxes_only"])
    .optional()
    .describe("Type of refund requested"),
  amount: z.number().optional().describe("Refund amount if known"),
});

/** Slot schema for fare difference intent. */
export const FareDifferenceSlotsSchema = z.object({
  pnr: z.string().describe("Booking reference / PNR"),
  newFlightNumber: z.string().optional().describe("Target flight number"),
  fareDifference: z.number().optional().describe("Fare difference amount"),
});

/** Slot schema for general inquiry. */
export const GeneralInquirySlotsSchema = z.object({
  topic: z.string().optional().describe("General topic of inquiry"),
  question: z.string().describe("The customer's question"),
});

/** Maps intent names to their Zod schemas. */
export const IntentSlotSchemas = {
  cancellation: CancellationSlotsSchema,
  delay: DelaySlotsSchema,
  refund: RefundSlotsSchema,
  fare_difference: FareDifferenceSlotsSchema,
  general_inquiry: GeneralInquirySlotsSchema,
} as const;

export type IntentSlotSchemaKey = keyof typeof IntentSlotSchemas;
