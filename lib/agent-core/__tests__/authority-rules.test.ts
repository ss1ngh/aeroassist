import { describe, it, expect } from "vitest";
import { checkAuthority, AUTHORITY_RULES } from "../authority-rules";

describe("AUTHORITY_RULES", () => {
  it("has rules for all required action types", () => {
    const actionTypes = new Set(AUTHORITY_RULES.map((r) => r.actionType));
    expect(actionTypes.has("process_refund")).toBe(true);
    expect(actionTypes.has("rebook_flight")).toBe(true);
    expect(actionTypes.has("issue_voucher")).toBe(true);
    expect(actionTypes.has("issue_lounge_access")).toBe(true);
    expect(actionTypes.has("arrange_hotel")).toBe(true);
    expect(actionTypes.has("provide_information")).toBe(true);
    expect(actionTypes.has("escalate_to_agent")).toBe(true);
  });

  it("airline-caused cancellation: free rebooking is auto-allow", () => {
    const result = checkAuthority("rebook_flight", { fareDifference: 0 });
    expect(result.result).toBe("allow");
  });

  it("fare difference ≤ ₹1,500 requires confirmation", () => {
    const result = checkAuthority("rebook_flight", { fareDifference: 1000 });
    expect(result.result).toBe("require_confirmation");
  });

  it("fare difference > ₹1,500 escalates", () => {
    const result = checkAuthority("rebook_flight", { fareDifference: 2000 });
    expect(result.result).toBe("escalate");
  });

  it("airline-caused cancellation refund is auto-allow", () => {
    const result = checkAuthority("process_refund", {});
    expect(result.result).toBe("allow");
  });

  it("meal voucher ≤ ₹500 is auto-allow", () => {
    const result = checkAuthority("issue_voucher", { amount: 500 });
    expect(result.result).toBe("allow");
  });

  it("voucher amount > ₹500 requires confirmation", () => {
    const result = checkAuthority("issue_voucher", { amount: 800 });
    expect(result.result).toBe("require_confirmation");
  });

  it("lounge access for delay > 3h is auto-allow", () => {
    const result = checkAuthority("issue_lounge_access", {});
    expect(result.result).toBe("allow");
  });

  it("hotel accommodation for delay > 5h is auto-allow", () => {
    const result = checkAuthority("arrange_hotel", {});
    expect(result.result).toBe("allow");
  });

  it("provide_information is always auto-allow", () => {
    const result = checkAuthority("provide_information", {});
    expect(result.result).toBe("allow");
  });

  it("escalate_to_agent always escalates", () => {
    const result = checkAuthority("escalate_to_agent", {});
    expect(result.result).toBe("escalate");
  });

  it("unknown action type escalates by default", () => {
    const result = checkAuthority("unknown_action" as never, {});
    expect(result.result).toBe("escalate");
    expect(result.reason).toContain("No matching authority rule");
  });
});
