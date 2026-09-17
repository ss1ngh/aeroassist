import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState, type AgentStateType } from "./state";
import { classifyIntent } from "./nodes/classify-intent";
import { extractSlots } from "./nodes/extract-slots";
import { proposeAction } from "./nodes/propose-action";
import { checkAuthority } from "./nodes/check-authority";
import { executeAction } from "./nodes/execute-action";
import { generateResponse } from "./nodes/generate-response";

/**
 * Route after extractSlots: if required slots are missing, ask for them first.
 */
function routeAfterExtractSlots(state: AgentStateType): string {
  if (state.missingSlots.length > 0) return "gatherInfo";
  return "proposeAction";
}

/**
 * Route after check-authority: decide whether to execute, confirm, or escalate.
 */
function routeAfterAuthority(state: AgentStateType): string {
  if (state.shouldEscalate) return "escalate";
  if (state.authorityResult === "require_confirmation") return "respond";
  if (state.authorityResult === "allow") return "execute";
  return "respond";
}

/**
 * Build the airline disruption support agent graph.
 *
 * Flow:
 *   START -> classifyIntent -> extractSlots
 *     -> (missing slots) -> generateResponse (ask for info) -> END
 *     -> (all slots filled) -> proposeAction -> checkAuthority
 *       -> (allow) -> executeAction -> generateResponse -> END
 *       -> (require_confirmation) -> generateResponse -> END
 *       -> (escalate) -> generateResponse -> END
 */
function buildGraph() {
  const graph = new StateGraph(AgentState)
    .addNode("classifyIntent", classifyIntent)
    .addNode("extractSlots", extractSlots)
    .addNode("proposeAction", proposeAction)
    .addNode("checkAuthority", checkAuthority)
    .addNode("executeAction", executeAction)
    .addNode("generateResponse", generateResponse)
    .addEdge(START, "classifyIntent")
    .addEdge("classifyIntent", "extractSlots")
    .addConditionalEdges("extractSlots", routeAfterExtractSlots, {
      gatherInfo: "generateResponse",
      proposeAction: "proposeAction",
    })
    .addEdge("proposeAction", "checkAuthority")
    .addConditionalEdges("checkAuthority", routeAfterAuthority, {
      execute: "executeAction",
      respond: "generateResponse",
      escalate: "generateResponse",
    })
    .addEdge("executeAction", "generateResponse")
    .addEdge("generateResponse", END);

  return graph.compile();
}

/** Compiled agent graph singleton. */
let _agentGraph: ReturnType<typeof buildGraph> | null = null;

/**
 * Get the compiled agent graph. Creates it on first call.
 * Ensure process.env.MODEL_NAME and GROQ_API_KEY are set before invoking.
 */
export function getAgentGraph() {
  if (!_agentGraph) {
    _agentGraph = buildGraph();
  }
  return _agentGraph;
}

export { buildGraph };
