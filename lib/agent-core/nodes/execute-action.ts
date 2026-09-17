import type { AgentStateType } from "../state";

/**
 * Mock-execute the proposed action. In a real system this would call airline APIs.
 * Event recording is handled at the graph invocation layer (Phase 4).
 */
export async function executeAction(state: AgentStateType): Promise<Partial<AgentStateType>> {
  if (!state.proposedAction || state.authorityResult !== "allow") {
    return {};
  }

  const { type, parameters } = state.proposedAction;

  // Mock execution — in production, this would call real airline APIs
  mockExecuteAction(type, parameters);

  return {};
}

function mockExecuteAction(
  type: string,
  parameters: Record<string, unknown>,
): Record<string, unknown> {
  switch (type) {
    case "process_refund":
      return {
        status: "processed",
        refundId: `REF-${Date.now()}`,
        amount: parameters.amount ?? 0,
      };
    case "rebook_flight":
      return {
        status: "rebooked",
        newPnr: `NEW-${Date.now()}`,
        flightNumber: parameters.newFlightNumber ?? "TBD",
      };
    case "issue_voucher":
      return {
        status: "issued",
        voucherId: `VOUCH-${Date.now()}`,
        amount: parameters.amount ?? 0,
      };
    default:
      return { status: "completed" };
  }
}
