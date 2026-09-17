import { ChatGroq } from "@langchain/groq";
import type { AgentStateType } from "../state";
import { ClassificationSchema } from "../schemas/llm-schemas";

function getModel() {
  return new ChatGroq({
    model: process.env.MODEL_NAME ?? "llama-3.3-70b-versatile",
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
    {
      role: "system",
      content: `You are an airline customer service intent classifier.
Classify the customer's message into one of: cancellation, delay, refund, fare_difference, general_inquiry.
Also assess their frustration level from 0 (calm) to 1 (very frustrated).
Be precise. If the customer mentions a cancelled flight, use "cancellation". If they mention a delay, use "delay". If they want money back, use "refund". If they want to change flights and there's a price difference, use "fare_difference".`,
    },
    {
      role: "user",
      content: lastUserMessage.content,
    },
  ]);

  return {
    intent: result.intent,
    sentiment: result.sentiment,
  };
}
