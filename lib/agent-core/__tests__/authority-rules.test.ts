import { describe, it, expect } from "vitest";
import { checkAuthority, AUTHORITY_RULES } from "../authority-rules";

describe("AUTHORITY_RULES", () => {
  it("has rules for all action types", () => {
    const actionTypes = new Set(AUTHORITY_RULES.map((r) => r.actionType));
    expect(actionTypes.has("process_refund")).toBe(true);
    expect(actionTypes.has("rebook_flight")).toBe(true);
    expect(actionTypes.has("issue_voucher")).toBe(true);
    expect(actionTypes.has("provide_information")).toBe(true);
    expect(actionTypes.has("escalate_to_agent")).toBe(true);
  });

  it("refund <= $200 is auto-allow", () => {
    const result = checkAuthority("process_refund", { amount: 150 });
    expect(result.result).toBe("allow");
  });

  it("refund $200-$1000 requires confirmation", () => {
    const result = checkAuthority("process_refund", { amount: 500 });
    expect(result.result).toBe("require_confirmation");
  });

  it("refund > $1000 escalates", () => {
    const result = checkAuthority("process_refund", { amount: 1500 });
    expect(result.result).toBe("escalate");
  });

  it("rebooking with no fare difference is auto-allow", () => {
    const result = checkAuthority("rebook_flight", { fareDifference: 0 });
    expect(result.result).toBe("allow");
  });

  it("rebooking with fare difference <= $500 requires confirmation", () => {
    const result = checkAuthority("rebook_flight", { fareDifference: 300 });
    expect(result.result).toBe("require_confirmation");
  });

  it("rebooking with fare difference > $500 escalates", () => {
    const result = checkAuthority("rebook_flight", { fareDifference: 700 });
    expect(result.result).toBe("escalate");
  });

  it("voucher <= $100 is auto-allow", () => {
    const result = checkAuthority("issue_voucher", { amount: 75 });
    expect(result.result).toBe("allow");
  });

  it("voucher > $100 requires confirmation", () => {
    const result = checkAuthority("issue_voucher", { amount: 200 });
    expect(result.result).toBe("require_confirmation");
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

  it("refund without amount parameter skips amount-based rules", () => {
    const result = checkAuthority("process_refund", {});
    expect(result.result).toBe("escalate");
  });
});
