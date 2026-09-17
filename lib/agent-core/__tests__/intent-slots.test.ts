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
        customerName: "Alice Johnson",
        pnr: "ABC123",
        flightNumber: "AA100",
        reason: "airline_fault",
      });
      expect(result.success).toBe(true);
    });

    it("requires customerName", () => {
      const result = CancellationSlotsSchema.safeParse({
        pnr: "ABC123",
      });
      expect(result.success).toBe(false);
    });

    it("requires pnr", () => {
      const result = CancellationSlotsSchema.safeParse({
        customerName: "Alice",
        flightNumber: "AA100",
      });
      expect(result.success).toBe(false);
    });

    it("accepts data without optional fields", () => {
      const result = CancellationSlotsSchema.safeParse({
        customerName: "Alice",
        pnr: "ABC123",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("DelaySlotsSchema", () => {
    it("accepts valid delay data", () => {
      const result = DelaySlotsSchema.safeParse({
        customerName: "Bob Martinez",
        pnr: "DEF456",
        flightNumber: "UA300",
        currentDelayMinutes: 120,
      });
      expect(result.success).toBe(true);
    });

    it("requires customerName", () => {
      const result = DelaySlotsSchema.safeParse({
        pnr: "DEF456",
      });
      expect(result.success).toBe(false);
    });

    it("requires pnr", () => {
      const result = DelaySlotsSchema.safeParse({
        customerName: "Bob",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("RefundSlotsSchema", () => {
    it("accepts valid refund data", () => {
      const result = RefundSlotsSchema.safeParse({
        customerName: "Charlie Kim",
        pnr: "GHI789",
        reason: "Flight was cancelled by airline",
        refundType: "full",
        amount: 250,
      });
      expect(result.success).toBe(true);
    });

    it("requires customerName", () => {
      const result = RefundSlotsSchema.safeParse({
        pnr: "GHI789",
        reason: "cancelled",
      });
      expect(result.success).toBe(false);
    });

    it("requires pnr", () => {
      const result = RefundSlotsSchema.safeParse({
        customerName: "Charlie",
        reason: "cancelled",
      });
      expect(result.success).toBe(false);
    });

    it("requires reason", () => {
      const result = RefundSlotsSchema.safeParse({
        customerName: "Charlie",
        pnr: "GHI789",
      });
      expect(result.success).toBe(false);
    });

    it("accepts data with feedback", () => {
      const result = RefundSlotsSchema.safeParse({
        customerName: "Charlie",
        pnr: "GHI789",
        reason: "cancelled",
        feedback: "The check-in process was confusing",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("FareDifferenceSlotsSchema", () => {
    it("accepts valid fare difference data", () => {
      const result = FareDifferenceSlotsSchema.safeParse({
        customerName: "Alice Johnson",
        pnr: "JKL012",
        newFlightNumber: "DL500",
        fareDifference: 150,
      });
      expect(result.success).toBe(true);
    });

    it("requires customerName", () => {
      const result = FareDifferenceSlotsSchema.safeParse({
        pnr: "JKL012",
      });
      expect(result.success).toBe(false);
    });

    it("requires pnr", () => {
      const result = FareDifferenceSlotsSchema.safeParse({
        customerName: "Alice",
        fareDifference: 100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("GeneralInquirySlotsSchema", () => {
    it("accepts valid inquiry data", () => {
      const result = GeneralInquirySlotsSchema.safeParse({
        customerName: "Priya Nair",
        pnr: "SK4821X",
        question: "What is my booking status?",
        topic: "booking_status",
      });
      expect(result.success).toBe(true);
    });

    it("accepts data without optional topic", () => {
      const result = GeneralInquirySlotsSchema.safeParse({
        customerName: "Alice",
        pnr: "ABC123",
        question: "What is my booking status?",
      });
      expect(result.success).toBe(true);
    });

    it("requires question", () => {
      const result = GeneralInquirySlotsSchema.safeParse({
        customerName: "Alice",
        pnr: "ABC123",
        topic: "status",
      });
      expect(result.success).toBe(false);
    });

    it("requires customerName", () => {
      const result = GeneralInquirySlotsSchema.safeParse({
        pnr: "ABC123",
        question: "Is my flight delayed?",
      });
      expect(result.success).toBe(false);
    });

    it("requires pnr", () => {
      const result = GeneralInquirySlotsSchema.safeParse({
        customerName: "Alice",
        question: "Is my flight delayed?",
      });
      expect(result.success).toBe(false);
    });
  });
});
