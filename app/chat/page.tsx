"use client";

import { useState, useRef, useEffect, useCallback } from "react";

function generateId() {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export default function ChatPage() {
  const [conversationId] = useState(generateId);
  const [customerId] = useState("cmu5lu3jt0000hqxwiklsfz6n");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      const agentMsgId = `agent-${Date.now()}`;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: text }],
            conversationId,
            customerId,
          }),
        });

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let agentText = "";

        // Add empty agent message
        setMessages((prev) => [
          ...prev,
          { id: agentMsgId, role: "assistant", text: "" },
        ]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === "text-delta" && data.textDelta) {
                    agentText += data.textDelta;
                    const captured = agentText;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === agentMsgId ? { ...m, text: captured } : m,
                      ),
                    );
                  }
                } catch {
                  // skip non-JSON lines
                }
              }
            }
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: agentMsgId,
            role: "assistant",
            text: "Sorry, something went wrong. Please try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, customerId, isLoading],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">AA</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">AeroAssist Support</h1>
            <p className="text-xs text-gray-500">Airline disruption support agent</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-xl">&#9992;</span>
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                How can we help you today?
              </h2>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                I can help with flight cancellations, delays, refunds, fare
                differences, and general inquiries.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "My flight was cancelled",
                  "I need a refund",
                  "My flight is delayed",
                  "Change my booking",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-[10px] font-bold">
                        AA
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">
                      AeroAssist
                    </span>
                  </div>
                )}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.text}
                </div>
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-[10px] font-bold">
                      AA
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">
                    AeroAssist
                  </span>
                </div>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="bg-white border-t border-gray-200 px-4 py-3">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
