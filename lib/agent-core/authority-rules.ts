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
 * Data-driven authority rule table.
 * Rules are evaluated top-to-bottom; first match wins.
 */
export const AUTHORITY_RULES: AuthorityRule[] = [
  // Refunds
  {
    actionType: "process_refund",
    paramKey: "amount",
    maxParamValue: 200,
    result: "allow",
    reason: "Refund <= $200: auto-execute per policy",
  },
  {
    actionType: "process_refund",
    paramKey: "amount",
    maxParamValue: 1000,
    result: "require_confirmation",
    reason: "Refund $200-$1000: require customer confirmation",
  },
  {
    actionType: "process_refund",
    result: "escalate",
    reason: "Refund > $1000: escalate to human agent",
  },

  // Rebooking
  {
    actionType: "rebook_flight",
    paramKey: "fareDifference",
    maxParamValue: 0,
    result: "allow",
    reason: "No fare difference: auto-execute rebooking",
  },
  {
    actionType: "rebook_flight",
    paramKey: "fareDifference",
    maxParamValue: 500,
    result: "require_confirmation",
    reason: "Rebooking with fare difference <= $500: require confirmation",
  },
  {
    actionType: "rebook_flight",
    result: "escalate",
    reason: "Rebooking with fare difference > $500: escalate",
  },

  // Vouchers
  {
    actionType: "issue_voucher",
    paramKey: "amount",
    maxParamValue: 100,
    result: "allow",
    reason: "Voucher <= $100: auto-execute",
  },
  {
    actionType: "issue_voucher",
    result: "require_confirmation",
    reason: "Voucher > $100: require confirmation",
  },

  // Information and escalation
  {
    actionType: "provide_information",
    result: "allow",
    reason: "Information queries: always auto-execute",
  },
  {
    actionType: "escalate_to_agent",
    result: "escalate",
    reason: "Explicit escalation: always escalate",
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
