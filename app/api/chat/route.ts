import { createUIMessageStreamResponse, createUIMessageStream } from "ai";
import { getAgentGraph } from "@/lib/agent-core/graph";
import type { AgentStateType, Message } from "@/lib/agent-core/state";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const maxDuration = 30;

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  conversationId?: string;
  customerId?: string;
}

async function recordEvent(event: {
  conversationId: string;
  type: string;
  payload: Record<string, unknown>;
  actor: string;
}): Promise<void> {
  await prisma.event.create({
    data: {
      conversationId: event.conversationId,
      type: event.type,
      payload: event.payload as Prisma.InputJsonValue,
      actor: event.actor,
    },
  });
}

export async function POST(req: Request) {
  const body: ChatRequest = await req.json();
  const { messages: rawMessages, conversationId, customerId } = body;

  const convId = conversationId ?? `conv-${Date.now()}`;

  // Resolve customer: use provided ID if valid, else fall back to first available
  let custId = customerId ?? "anonymous";
  if (custId !== "anonymous") {
    const exists = await prisma.customer.findUnique({ where: { id: custId } });
    if (!exists) {
      const fallback = await prisma.customer.findFirst();
      custId = fallback?.id ?? "anonymous";
    }
  } else {
    const fallback = await prisma.customer.findFirst();
    if (fallback) custId = fallback.id;
  }

  // Ensure conversation exists
  await prisma.conversation.upsert({
    where: { id: convId },
    create: {
      id: convId,
      customerId: custId,
      status: "active",
    },
    update: {},
  });

  const messages: Message[] = rawMessages.map((m) => ({
    role: m.role as "user" | "agent" | "system",
    content: m.content,
    timestamp: new Date().toISOString(),
  }));

  // Record the user message event
  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    await recordEvent({
      conversationId: convId,
      type: "message",
      payload: { content: lastMsg.content, role: lastMsg.role },
      actor: "user",
    });
  }

  const graph = getAgentGraph();

  const initialState: Partial<AgentStateType> = {
    messages,
    conversationId: convId,
    customerId: custId,
  };

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      try {
        const result = await graph.invoke(initialState, {
          metadata: { conversationId: convId, customerId: custId },
          tags: ["api-chat", "disruption-support"],
        });

        // Record agent response event
        if (result.response) {
          await recordEvent({
            conversationId: convId,
            type: "message",
            payload: { content: result.response, role: "agent" },
            actor: "agent",
          });
        }

        // Record intent classification
        if (result.intent) {
          await recordEvent({
            conversationId: convId,
            type: "slot_extracted",
            payload: {
              intent: result.intent,
              sentiment: result.sentiment,
              filledSlots: result.filledSlots,
              missingSlots: result.missingSlots,
            },
            actor: "system",
          });
        }

        // Record proposed action
        if (result.proposedAction) {
          await recordEvent({
            conversationId: convId,
            type: "action_proposed",
            payload: {
              actionType: result.proposedAction.type,
              parameters: result.proposedAction.parameters,
              rationale: result.proposedAction.rationale,
              authorityResult: result.authorityResult,
            },
            actor: "agent",
          });
        }

        // Record escalation if applicable
        if (result.shouldEscalate) {
          await recordEvent({
            conversationId: convId,
            type: "escalated",
            payload: {
              reason: result.escalationReason,
              actionType: result.proposedAction?.type,
            },
            actor: "system",
          });

          await prisma.conversation.update({
            where: { id: convId },
            data: { status: "escalated" },
          });
        }

        // If action was allowed, record execution
        if (result.authorityResult === "allow" && result.proposedAction) {
          await recordEvent({
            conversationId: convId,
            type: "action_executed",
            payload: {
              actionType: result.proposedAction.type,
              parameters: result.proposedAction.parameters,
              result: { status: "completed" },
            },
            actor: "agent",
          });

          await prisma.conversation.update({
            where: { id: convId },
            data: { status: "resolved" },
          });
        }

        // Write the response to the stream
        if (result.response) {
          writer.write({ type: "text-delta", delta: result.response, id: `msg-${Date.now()}` });
        }
      } catch (error) {
        console.error("Graph execution error:", error);
        const errorMsg =
          "I'm sorry, I encountered an error processing your request. Please try again.";
        writer.write({ type: "text-delta", delta: errorMsg, id: `msg-${Date.now()}` });
      }
    },
    onError: (error) => {
      console.error("Stream error:", error);
      return "An error occurred while processing your request.";
    },
  });

  return createUIMessageStreamResponse({ stream });
}
