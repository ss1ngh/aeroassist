import { Annotation } from "@langchain/langgraph";

/** Supported customer intents detected by the classifier. */
export type Intent =
  | "cancellation"
  | "delay"
  | "refund"
  | "fare_difference"
  | "general_inquiry";

/** Actions the agent can propose. */
export type ActionType =
  | "process_refund"
  | "rebook_flight"
  | "issue_voucher"
  | "issue_lounge_access"
  | "arrange_hotel"
  | "provide_information"
  | "escalate_to_agent";

/** Authority check result. */
export type AuthorityResult = "allow" | "require_confirmation" | "escalate";

/** A single message in the conversation history. */
export interface Message {
  role: "user" | "agent" | "system";
  content: string;
  timestamp: string;
}

/** The proposed action the agent wants to take. */
export interface ProposedAction {
  type: ActionType;
  parameters: Record<string, unknown>;
  rationale: string;
}

/** The full graph state, defined via LangGraph Annotation. */
export const AgentState = Annotation.Root({
  /** Full conversation history. */
  messages: Annotation<Message[]>({
    reducer: (curr, prev) => [...prev, ...curr],
    default: () => [],
  }),

  /** Detected customer intent. */
  intent: Annotation<Intent | null>({
    reducer: (_curr, prev) => prev,
    default: () => null,
  }),

  /** Sentiment/frustration score from 0 (calm) to 1 (very frustrated). */
  sentiment: Annotation<number>({
    reducer: (_curr, prev) => prev,
    default: () => 0,
  }),

  /** Slots filled by the extract-slots node. */
  filledSlots: Annotation<Record<string, unknown>>({
    reducer: (curr, prev) => ({ ...curr, ...prev }),
    default: () => ({}),
  }),

  /** Slot names that are still missing for the active intent. */
  missingSlots: Annotation<string[]>({
    reducer: (_curr, prev) => prev,
    default: () => [],
  }),

  /** Action proposed by the propose-action node. */
  proposedAction: Annotation<ProposedAction | null>({
    reducer: (_curr, prev) => prev,
    default: () => null,
  }),

  /** Authority check result. */
  authorityResult: Annotation<AuthorityResult | null>({
    reducer: (_curr, prev) => prev,
    default: () => null,
  }),

  /** Whether the conversation should be escalated. */
  shouldEscalate: Annotation<boolean>({
    reducer: (_curr, prev) => prev,
    default: () => false,
  }),

  /** Reason for escalation, if applicable. */
  escalationReason: Annotation<string | null>({
    reducer: (_curr, prev) => prev,
    default: () => null,
  }),

  /** The final natural-language response to the customer. */
  response: Annotation<string | null>({
    reducer: (_curr, prev) => prev,
    default: () => null,
  }),

  /** Current conversation ID (for persistence). */
  conversationId: Annotation<string | null>({
    reducer: (_curr, prev) => prev,
    default: () => null,
  }),

  /** Customer ID (for persistence). */
  customerId: Annotation<string | null>({
    reducer: (_curr, prev) => prev,
    default: () => null,
  }),
});

export type AgentStateType = typeof AgentState.State;
