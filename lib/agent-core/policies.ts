/**
 * Static airline service policies injected into LLM context.
 * These rules are the source of truth for the agent's decision-making.
 */

export const CANCELLATION_POLICY = `
## Flight Cancellation Policy

### Customer Rights
- If your flight is cancelled by the airline, you are entitled to:
  1. A full refund to your original form of payment, OR
  2. Rebooking on the next available flight at no additional cost, OR
  3. Rebooking on a later date that suits your schedule.

### Refund Eligibility
- Full refund: Always available when airline cancels the flight.
- Partial refund: Not applicable for airline-initiated cancellations.
- Refund processing time: 5-10 business days for credit/debit cards; 20-25 business days for cash purchases.

### Rebooking Rules
- Rebooking is free of charge when the airline cancels.
- If the replacement flight results in a fare difference, the customer pays nothing for downgrades and gets a voucher for upgrades.
- Customers may request a specific alternative flight subject to availability.

### Compensation
- EU flights (EC 261): €250-€600 depending on distance.
- US domestic flights: No federal compensation requirement, but airline may offer vouchers.
- Compensation is separate from refund/rebooking rights.
`;

export const DELAY_POLICY = `
## Flight Delay Policy

### Delay Categories
- Minor delay (under 2 hours): Gate updates provided, no meal vouchers required.
- Moderate delay (2-4 hours): Meal vouchers provided if delay exceeds mealtime.
- Major delay (4+ hours): Meal vouchers, hotel accommodation if overnight, and rebooking options.
- Extended delay (8+ hours): Full refund option becomes available.

### Customer Entitlements by Delay Duration
| Delay Duration | Meals | Hotel | Rebooking | Refund |
|----------------|-------|-------|-----------|--------|
| < 2 hours      | No    | No    | On request | No |
| 2-4 hours      | Yes   | No    | On request | No |
| 4-8 hours      | Yes   | If overnight | Free | On request |
| 8+ hours       | Yes   | Yes   | Free      | Yes |

### Proactive Actions
- Automatic rebooking if delay causes missed connection.
- SMS/push notifications at each delay threshold.
- Loyalty tier customers (Gold/Platinum): priority rebooking and lounge access during delays.
`;

export const REFUND_POLICY = `
## Refund Policy

### Refund Types
1. **Full Refund**: Available when airline cancels or significantly changes the flight (>2 hours).
2. **Partial Refund**: Available for voluntary downgrades or service failures.
3. **No Refund**: Non-refundable fares after 24-hour cooling-off period (except airline fault).

### 24-Hour Cooling-Off Rule
- All bookings made 7+ days before departure can be cancelled within 24 hours for a full refund.
- Applies to all fare classes.

### Refund Processing
- Credit/debit card: 5-10 business days.
- Cash purchase: 20-25 business days.
- Travel voucher: Instant issuance.

### Refund Amounts by Scenario
| Scenario | Refund Amount | Processing Time |
|----------|---------------|-----------------|
| Airline cancellation | 100% | 5-10 business days |
| Significant schedule change (>2h) | 100% | 5-10 business days |
| Voluntary cancellation (refundable fare) | 100% minus fees | 5-10 business days |
| Voluntary cancellation (non-refundable) | Taxes only | 5-10 business days |
| Service failure | Up to 100% | Case-by-case |
`;

export const FARE_DIFFERENCE_POLICY = `
## Fare Difference Policy

### When Fare Differences Apply
- Rebooking to a different flight may result in a fare difference.
- Fare difference = New fare - Original fare (at time of original booking).

### Fare Difference Rules
| Scenario | Customer Pays | Airline Pays |
|----------|--------------|--------------|
| Airline cancellation rebooking | Nothing | N/A |
| Schedule change rebooking (>2h) | Nothing | N/A |
| Customer-requested change | Fare difference | N/A |
| Downgrade rebooking | Nothing | Refund of difference |
| Upgrade rebooking | Fare difference | N/A |

### Payment Methods for Fare Difference
- Credit/debit card on file.
- Travel voucher balance.
- New payment method at time of rebooking.

### Fare Class Restrictions
- Economy to Economy: Standard fare difference applies.
- Economy to Premium/Business/First: Full fare difference + upgrade fee.
- Business/First to Economy: Refund of fare difference.
- Award tickets: Redeem miles for difference; no cash payment option.
`;

export const LOYALTY_TIER_POLICY = `
## Loyalty Tier Benefits During Disruptions

### Tier Levels
- **Silver**: Base tier, standard benefits.
- **Gold**: Enhanced priority and additional perks.
- **Platinum**: Maximum priority and premium benefits.

### Disruption Benefits by Tier
| Benefit | Silver | Gold | Platinum |
|---------|--------|------|----------|
| Priority rebooking | Standard queue | Jump queue | First priority |
| Lounge access during delay | Purchase only | Complimentary | Complimentary |
| Hotel accommodation | Airline discretion | Guaranteed | Guaranteed + premium |
| Meal vouchers | Standard | Enhanced | Enhanced + dining |
| Compensation multiplier | 1x | 1.5x | 2x |
| Dedicated support line | No | Yes | Yes + personal agent |

### Escalation Thresholds by Tier
- Silver: Auto-escalate if disruption > 8 hours or customer requests.
- Gold: Auto-escalate if disruption > 4 hours or customer requests.
- Platinum: Auto-escalate if disruption > 2 hours or customer requests.

### Proactive Actions by Tier
- Gold+: Automatic lounge pass during delays > 2 hours.
- Platinum: Personal agent callback within 30 minutes of disruption notification.
`;

export const ALL_POLICIES = [
  CANCELLATION_POLICY,
  DELAY_POLICY,
  REFUND_POLICY,
  FARE_DIFFERENCE_POLICY,
  LOYALTY_TIER_POLICY,
].join("\n\n");
