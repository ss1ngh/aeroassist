import type { AgentStateType } from "../state";
import { checkAuthority as evaluateAuthority } from "../authority-rules";

/**
 * Check the proposed action against the authority rule table.
 * Pure code — no LLM call. Sets escalation flag if authority requires it.
 */
export async function checkAuthority(state: AgentStateType): Promise<Partial<AgentStateType>> {
  if (!state.proposedAction) {
    return {
      authorityResult: "escalate",
      shouldEscalate: true,
      escalationReason: "No action proposed",
    };
  }

  const { type, parameters } = state.proposedAction;
  const { result, reason } = evaluateAuthority(type, parameters);

  return {
    authorityResult: result,
    shouldEscalate: result === "escalate",
    escalationReason: result === "escalate" ? reason : null,
  };
}
