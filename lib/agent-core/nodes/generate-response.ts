import { ChatGroq } from "@langchain/groq";
import type { AgentStateType } from "../state";
import { ResponseSchema } from "../schemas/llm-schemas";
import { selectResponsePrompt } from "../prompts";

function getModel() {
  return new ChatGroq({
    model: process.env.MODEL_NAME ?? "qwen/qwen3.8-27b",
    temperature: 0.3,
  });
}

/**
 * Generate the final natural-language response to the customer.
 * Delegates prompt selection to the prompt registry.
 */
export async function generateResponse(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const model = getModel().withStructuredOutput(ResponseSchema);
  const systemPrompt = selectResponsePrompt(state);

  const result = await model.invoke([
    { role: "system", content: systemPrompt },
    ...state.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ]);

  return { response: result.response };
}
