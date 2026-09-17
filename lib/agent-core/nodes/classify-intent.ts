import { ChatGroq } from "@langchain/groq";
import type { AgentStateType } from "../state";
import { ClassificationSchema } from "../schemas/llm-schemas";
import { classifyIntentPrompt } from "../prompts";

function getModel() {
  return new ChatGroq({
    model: process.env.MODEL_NAME ?? "qwen/qwen3.8-27b",
    temperature: 0,
  });
}

/**
 * Classify the customer's intent and assess sentiment from the conversation history.
 */
export async function classifyIntent(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const lastUserMessage = [...state.messages]
    .reverse()
    .find((m) => m.role === "user");

  if (!lastUserMessage) {
    return { intent: "general_inquiry", sentiment: 0 };
  }

  const model = getModel().withStructuredOutput(ClassificationSchema);

  const result = await model.invoke([
    { role: "system", content: classifyIntentPrompt() },
    { role: "user", content: lastUserMessage.content },
  ]);

  return {
    intent: result.intent,
    sentiment: result.sentiment,
  };
}
