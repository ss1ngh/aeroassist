/**
 * Static airline service policies — exact rules from the assignment.
 * These are the source of truth for the agent's decision-making.
 *
 * Date context: Wednesday, 23 September 2026.
 */

export const CANCELLATION_POLICY = `
## Cancellation Rebooking Rule
If a flight is cancelled by the airline, the customer is entitled to:
- A free rebooking on the next available flight within 24 hours, OR
- A full refund — customer's choice.
`;

export const DELAY_POLICY = `
## Delay Compensation Rule
| Delay Duration       | Compensation                                    |
|----------------------|------------------------------------------------|
| Under 3 hours       | ₹500 meal voucher                              |
| More than 3 hours   | Meal voucher + lounge access                   |
| More than 5 hours   | Meal voucher + hotel accommodation (delayed hours only, NOT a full night) |
`;

export const REFUND_POLICY = `
## Refund Processing Rule
- Refunds for airline-caused cancellations are processed in full within 7 business days.
- Refunds are issued to the original payment method only.
- Refunds to a different payment method are PROHIBITED — must escalate to human agent.
`;

export const FARE_DIFFERENCE_POLICY = `
## Fare Difference Rule
- If a customer voluntarily chooses to rebook on a higher-fare flight (not airline-caused), they must pay the fare difference.
- Agents CANNOT waive fare differences above ₹1,500 without supervisor approval.
`;

export const LOYALTY_TIER_POLICY = `
## Loyalty Tier Rule
- Gold and Platinum tier customers get priority rebooking (first access to next-available seats).
- No additional compensation beyond the standard policy.
`;

export const ALLOWED_ACTIONS = `
## Allowed Actions for Agent
- Rebook the customer on the next available flight within 24 hours at no charge (airline-caused disruption).
- Issue meal vouchers and lounge access per the delay compensation rule.
- Arrange hotel accommodation for the delayed-hours portion, where the delay qualifies.
- Initiate a refund request for airline-caused cancellations.
- Provide the customer's own booking and flight status information.
`;

export const PROHIBITED_ACTIONS = `
## Prohibited Actions (MUST escalate to human agent)
- Approving any compensation beyond the stated policy amounts.
- Waiving a fare difference above ₹1,500.
- Making exceptions for non-airline-caused disruptions (e.g., customer missed the flight).
- Handling threats of legal action or formal complaints — escalate immediately.
- Processing refunds to a different payment method than the original.
`;

export const ALL_POLICIES = [
  CANCELLATION_POLICY,
  DELAY_POLICY,
  REFUND_POLICY,
  FARE_DIFFERENCE_POLICY,
  LOYALTY_TIER_POLICY,
  ALLOWED_ACTIONS,
  PROHIBITED_ACTIONS,
].join("\n\n");
