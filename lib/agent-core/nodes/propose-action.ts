import { ChatGroq } from "@langchain/groq";
import type { AgentStateType } from "../state";
import { ProposedActionSchema } from "../schemas/llm-schemas";
import { proposeActionPrompt } from "../prompts";

function getModel() {
  return new ChatGroq({
    model: process.env.MODEL_NAME ?? "qwen/qwen3.8-27b",
    temperature: 0,
  });
}

/**
 * Propose an action based on the detected intent, filled slots, and service policies.
 * The static policy text is injected into the LLM system prompt for factual grounding.
 */
export async function proposeAction(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const model = getModel().withStructuredOutput(ProposedActionSchema);

  const conversationText = state.messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const result = await model.invoke([
    { role: "system", content: proposeActionPrompt(state) },
    { role: "user", content: conversationText },
  ]);

  return {
    proposedAction: {
      type: result.type,
      parameters: result.parameters,
      rationale: result.rationale,
    },
  };
}
