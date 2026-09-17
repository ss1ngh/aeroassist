import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ConversationTimelinePage({
  params,
}: {
  params: { conversationId: string };
}) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
    include: {
      customer: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center">
        <p className="text-sm text-yellow-800 font-medium">
          Demo Only — No Authentication
        </p>
      </div>

      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/admin"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            &larr; Back to Admin
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 mt-2">
            Conversation Timeline
          </h1>
          <div className="flex gap-4 mt-1 text-sm text-gray-500">
            <span>ID: {conversation.id}</span>
            <span>Customer: {conversation.customer.name}</span>
            <span>Tier: {conversation.customer.loyaltyTier}</span>
            <StatusBadge status={conversation.status} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {conversation.events.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No events recorded yet.
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-4">
              {conversation.events.map((event) => (
                <div key={event.id} className="relative pl-14">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-4.5 top-3 w-3 h-3 rounded-full border-2 ${eventDotColor(
                      event.type,
                    )}`}
                  />

                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <EventTypeBadge type={event.type} />
                      <span className="text-xs text-gray-500 font-mono">
                        {event.actor}
                      </span>
                      <span className="text-xs text-gray-400">
                        {event.createdAt.toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {formatPayload(event.type, event.payload as Record<string, unknown>)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function eventDotColor(type: string): string {
  switch (type) {
    case "message":
      return "bg-blue-500 border-blue-500";
    case "slot_extracted":
      return "bg-purple-500 border-purple-500";
    case "action_proposed":
      return "bg-yellow-500 border-yellow-500";
    case "action_executed":
      return "bg-green-500 border-green-500";
    case "escalated":
      return "bg-red-500 border-red-500";
    default:
      return "bg-gray-400 border-gray-400";
  }
}

function EventTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    message: "bg-blue-100 text-blue-800",
    slot_extracted: "bg-purple-100 text-purple-800",
    action_proposed: "bg-yellow-100 text-yellow-800",
    action_executed: "bg-green-100 text-green-800",
    escalated: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[type] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {type.replace(/_/g, " ")}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    resolved: "bg-blue-100 text-blue-800",
    escalated: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}

function formatPayload(type: string, payload: Record<string, unknown>): string {
  switch (type) {
    case "message":
      return `${payload.role}: ${payload.content}`;
    case "slot_extracted":
      return `Intent: ${payload.intent}\nSentiment: ${payload.sentiment}\nFilled: ${JSON.stringify(payload.filledSlots)}\nMissing: ${JSON.stringify(payload.missingSlots)}`;
    case "action_proposed":
      return `Action: ${payload.actionType}\nAuthority: ${payload.authorityResult}\nRationale: ${payload.rationale}`;
    case "action_executed":
      return `Action: ${payload.actionType}\nResult: ${JSON.stringify(payload.result)}`;
    case "escalated":
      return `Reason: ${payload.reason}`;
    default:
      return JSON.stringify(payload, null, 2);
  }
}
