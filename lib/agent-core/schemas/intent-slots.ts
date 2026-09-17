import { z } from "zod";

/** Slot schema for cancellation intent. */
export const CancellationSlotsSchema = z.object({
  customerName: z.string().describe("Customer's full name"),
  pnr: z.string().describe("Booking reference / PNR"),
  flightNumber: z.string().optional().describe("Flight number if known"),
  origin: z.string().optional().describe("Departure airport (IATA code)"),
  destination: z.string().optional().describe("Arrival airport (IATA code)"),
  reason: z
    .enum(["airline_fault", "customer_request", "weather", "other"])
    .optional()
    .describe("Reason for cancellation"),
});

/** Slot schema for delay intent. */
export const DelaySlotsSchema = z.object({
  customerName: z.string().describe("Customer's full name"),
  pnr: z.string().describe("Booking reference / PNR"),
  flightNumber: z.string().optional().describe("Flight number if known"),
  origin: z.string().optional().describe("Departure airport (IATA code)"),
  destination: z.string().optional().describe("Arrival airport (IATA code)"),
  currentDelayMinutes: z
    .number()
    .optional()
    .describe("Current delay duration in minutes"),
});

/** Slot schema for refund intent. */
export const RefundSlotsSchema = z.object({
  customerName: z.string().describe("Customer's full name"),
  pnr: z.string().describe("Booking reference / PNR"),
  flightNumber: z.string().optional().describe("Flight number if known"),
  reason: z.string().describe("Why the customer wants a refund"),
  refundType: z
    .enum(["full", "partial", "taxes_only"])
    .optional()
    .describe("Type of refund requested"),
  amount: z.number().optional().describe("Refund amount if known"),
  feedback: z
    .string()
    .optional()
    .describe("Customer feedback or reviews about their experience"),
});

/** Slot schema for fare difference intent. */
export const FareDifferenceSlotsSchema = z.object({
  customerName: z.string().describe("Customer's full name"),
  pnr: z.string().describe("Booking reference / PNR"),
  newFlightNumber: z.string().optional().describe("Target flight number"),
  fareDifference: z.number().optional().describe("Fare difference amount"),
});

/** Slot schema for general inquiry. */
export const GeneralInquirySlotsSchema = z.object({
  customerName: z.string().optional().describe("Customer's full name if provided"),
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
