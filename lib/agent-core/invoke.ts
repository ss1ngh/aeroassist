import { getAgentGraph } from "./graph";
import type { AgentStateType, Message } from "./state";

/**
 * Configuration for a single agent invocation.
 */
export interface AgentInvocationConfig {
  conversationId: string;
  customerId: string;
  messages: Message[];
}

/**
 * Result of an agent invocation.
 */
export interface AgentInvocationResult {
  response: string | null;
  intent: string | null;
  sentiment: number;
  proposedAction: { type: string; parameters: Record<string, unknown>; rationale: string } | null;
  authorityResult: string | null;
  shouldEscalate: boolean;
  escalationReason: string | null;
}

/**
 * Invoke the agent graph with LangSmith metadata tagging.
 * Traces are sent to LangSmith when LANGCHAIN_TRACING_V2=true and
 * LANGCHAIN_API_KEY is set.
 */
export async function invokeAgent(
  config: AgentInvocationConfig,
): Promise<AgentInvocationResult> {
  const graph = getAgentGraph();

  const initialState: Partial<AgentStateType> = {
    messages: config.messages,
    conversationId: config.conversationId,
    customerId: config.customerId,
  };

  const result = await graph.invoke(initialState, {
    metadata: {
      conversationId: config.conversationId,
      customerId: config.customerId,
      projectName: process.env.LANGCHAIN_PROJECT ?? "aeroassist",
    },
    tags: ["agent-core", "disruption-support"],
  });

  return {
    response: result.response ?? null,
    intent: result.intent ?? null,
    sentiment: result.sentiment ?? 0,
    proposedAction: result.proposedAction ?? null,
    authorityResult: result.authorityResult ?? null,
    shouldEscalate: result.shouldEscalate ?? false,
    escalationReason: result.escalationReason ?? null,
  };
}
