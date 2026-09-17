import { describe, it, expect } from "vitest";
import {
  CancellationSlotsSchema,
  DelaySlotsSchema,
  RefundSlotsSchema,
  FareDifferenceSlotsSchema,
  GeneralInquirySlotsSchema,
} from "../schemas/intent-slots";

describe("Intent Slot Schemas", () => {
  describe("CancellationSlotsSchema", () => {
    it("accepts valid cancellation data", () => {
      const result = CancellationSlotsSchema.safeParse({
        pnr: "ABC123",
        flightNumber: "AA100",
        reason: "airline_fault",
      });
      expect(result.success).toBe(true);
    });

    it("requires pnr", () => {
      const result = CancellationSlotsSchema.safeParse({
        flightNumber: "AA100",
      });
      expect(result.success).toBe(false);
    });

    it("accepts data without optional fields", () => {
      const result = CancellationSlotsSchema.safeParse({
        pnr: "ABC123",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("DelaySlotsSchema", () => {
    it("accepts valid delay data", () => {
      const result = DelaySlotsSchema.safeParse({
        pnr: "DEF456",
        flightNumber: "UA300",
        currentDelayMinutes: 120,
      });
      expect(result.success).toBe(true);
    });

    it("requires pnr", () => {
      const result = DelaySlotsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("RefundSlotsSchema", () => {
    it("accepts valid refund data", () => {
      const result = RefundSlotsSchema.safeParse({
        pnr: "GHI789",
        refundType: "full",
        amount: 250,
      });
      expect(result.success).toBe(true);
    });

    it("requires pnr", () => {
      const result = RefundSlotsSchema.safeParse({
        refundType: "partial",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("FareDifferenceSlotsSchema", () => {
    it("accepts valid fare difference data", () => {
      const result = FareDifferenceSlotsSchema.safeParse({
        pnr: "JKL012",
        newFlightNumber: "DL500",
        fareDifference: 150,
      });
      expect(result.success).toBe(true);
    });

    it("requires pnr", () => {
      const result = FareDifferenceSlotsSchema.safeParse({
        fareDifference: 100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("GeneralInquirySlotsSchema", () => {
    it("accepts valid inquiry data", () => {
      const result = GeneralInquirySlotsSchema.safeParse({
        question: "What is my booking status?",
        topic: "booking_status",
      });
      expect(result.success).toBe(true);
    });

    it("requires question", () => {
      const result = GeneralInquirySlotsSchema.safeParse({
        topic: "status",
      });
      expect(result.success).toBe(false);
    });
  });
});
