import type { ActionType, AuthorityResult } from "./state";

/**
 * A single authority rule: given an action type and parameter constraints,
 * determines whether the agent can auto-execute, needs confirmation, or must escalate.
 */
export interface AuthorityRule {
  actionType: ActionType;
  /** If set, the rule applies only when this parameter matches. */
  paramKey?: string;
  /** If set, the rule applies only when the parameter value is <= this threshold. */
  maxParamValue?: number;
  result: AuthorityResult;
  reason: string;
}

/**
 * Data-driven authority rule table — exact rules from the assignment.
 * Rules are evaluated top-to-bottom; first match wins.
 */
export const AUTHORITY_RULES: AuthorityRule[] = [
  // ── Cancellation rebooking (free within 24h, airline-caused) ──
  {
    actionType: "rebook_flight",
    paramKey: "fareDifference",
    maxParamValue: 0,
    result: "allow",
    reason: "Airline-caused cancellation: free rebooking within 24h",
  },

  // ── Fare difference above ₹1,500 → escalate ──
  {
    actionType: "rebook_flight",
    paramKey: "fareDifference",
    maxParamValue: 1500,
    result: "require_confirmation",
    reason: "Fare difference ≤ ₹1,500: require customer confirmation",
  },
  {
    actionType: "rebook_flight",
    result: "escalate",
    reason: "Fare difference > ₹1,500: escalate to supervisor",
  },

  // ── Refunds (airline-caused cancellations: full within 7 days) ──
  {
    actionType: "process_refund",
    result: "allow",
    reason: "Airline-caused cancellation: full refund within 7 business days to original payment method",
  },

  // ── Meal vouchers (₹500) ──
  {
    actionType: "issue_voucher",
    paramKey: "amount",
    maxParamValue: 500,
    result: "allow",
    reason: "Meal voucher ≤ ₹500: auto-execute per delay compensation rule",
  },
  {
    actionType: "issue_voucher",
    result: "require_confirmation",
    reason: "Voucher amount exceeds policy: require confirmation",
  },

  // ── Lounge access (delay > 3h) ──
  {
    actionType: "issue_lounge_access",
    result: "allow",
    reason: "Lounge access for delay > 3 hours: auto-execute per policy",
  },

  // ── Hotel accommodation (delay > 5h: delayed hours only, not full night) ──
  {
    actionType: "arrange_hotel",
    result: "allow",
    reason: "Hotel for delay > 5 hours: arrange for delayed hours only per policy",
  },

  // ── Information queries ──
  {
    actionType: "provide_information",
    result: "allow",
    reason: "Information queries: always auto-execute",
  },

  // ── Legal threats / formal complaints → always escalate ──
  {
    actionType: "escalate_to_agent",
    result: "escalate",
    reason: "Legal threats or formal complaints: escalate immediately",
  },
];

/**
 * Evaluate the authority rules against a proposed action.
 * Returns the first matching rule's result, or "escalate" if no rule matches.
 */
export function checkAuthority(
  actionType: ActionType,
  parameters: Record<string, unknown>,
): { result: AuthorityResult; reason: string } {
  for (const rule of AUTHORITY_RULES) {
    if (rule.actionType !== actionType) continue;

    if (rule.paramKey) {
      const paramValue = parameters[rule.paramKey];
      if (paramValue === undefined || paramValue === null) continue;
      if (typeof paramValue !== "number") continue;
      if (rule.maxParamValue !== undefined && paramValue > rule.maxParamValue) continue;
    }

    return { result: rule.result, reason: rule.reason };
  }

  // Default: escalate unknown actions
  return { result: "escalate", reason: "No matching authority rule: escalating by default" };
}
