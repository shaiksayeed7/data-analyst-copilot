"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Loader2,
  Sparkles,
  BarChart2,
  Database,
  RefreshCw,
} from "lucide-react";
import {
  sendChatMessage,
  getInsights,
  generateSQL,
  ChatMessage,
  ChartData,
} from "@/lib/api";

interface Props {
  sessionId: string;
  onChartsUpdate: (charts: ChartData[]) => void;
  onInsightGenerated: (text: string) => void;
}

const EXAMPLE_QUESTIONS = [
  "What are the top 5 insights from this dataset?",
  "Show me the trends over time",
  "Find any anomalies or unusual patterns",
  "Which category has the highest revenue?",
  "Summarise the key statistics",
];

export default function ChatPanel({ sessionId, onChartsUpdate, onInsightGenerated }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I've analysed your dataset. Ask me anything — for example:\n\n" +
        EXAMPLE_QUESTIONS.map((q) => `• ${q}`).join("\n"),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ceoMode, setCeoMode] = useState(false);
  const [sqlMode, setSqlMode] = useState(false);
  const [sqlResult, setSqlResult] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const question = text ?? input.trim();
    if (!question || loading) return;
    setInput("");
    setSqlResult(null);

    const userMsg: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      if (sqlMode) {
        const res = await generateSQL(sessionId, question);
        const sqlText = `**Generated SQL Query:**\n\`\`\`sql\n${res.sql}\n\`\`\`\n\n*Table: \`${res.table_name}\`*`;
        const assistantMsg: ChatMessage = { role: "assistant", content: sqlText };
        setMessages((prev) => [...prev, assistantMsg]);
        setSqlResult(res.sql);
      } else {
        const history = messages.slice(-10);
        const res = await sendChatMessage(sessionId, question, history, ceoMode);
        const assistantMsg: ChatMessage = { role: "assistant", content: res.answer };
        setMessages((prev) => [...prev, assistantMsg]);
        if (res.charts && res.charts.length > 0) {
          onChartsUpdate(res.charts);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInsights = async () => {
    setLoading(true);
    setSqlResult(null);
    try {
      const res = await getInsights(sessionId, ceoMode);
      const assistantMsg: ChatMessage = { role: "assistant", content: res.insights };
      setMessages((prev) => [...prev, assistantMsg]);
      onInsightGenerated(res.insights);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to generate insights. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-slate-200">AI Chat</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSqlMode((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
              ${sqlMode ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
            title="Toggle SQL generator mode"
          >
            <Database className="w-3.5 h-3.5" />
            SQL
          </button>
          <button
            onClick={() => setCeoMode((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
              ${ceoMode ? "bg-amber-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
            title="Explain like I'm CEO"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            CEO
          </button>
        </div>
      </div>

      {/* Mode indicators */}
      {(ceoMode || sqlMode) && (
        <div className="px-4 py-2 bg-slate-800/60 border-b border-slate-800 shrink-0">
          {ceoMode && (
            <span className="text-xs text-amber-400 font-medium">
              👔 CEO Mode — responses use executive-level language
            </span>
          )}
          {sqlMode && (
            <span className="text-xs text-emerald-400 font-medium">
              🗄️ SQL Mode — questions will be converted to SQL queries
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                ${msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-slate-800 text-slate-200 rounded-bl-sm"
                }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose-chat">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mr-2">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-slate-400 text-sm">Thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      <div className="px-4 py-2 border-t border-slate-800 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={handleInsights}
            disabled={loading}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-600/40 text-blue-300 rounded-full text-xs hover:bg-blue-600/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-3 h-3" />
            {ceoMode ? "CEO Insights" : "AI Insights"}
          </button>
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={loading}
              className="shrink-0 px-3 py-1.5 bg-slate-700/60 border border-slate-600 text-slate-300 rounded-full text-xs hover:bg-slate-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={
              sqlMode
                ? "Ask a question to generate SQL…"
                : ceoMode
                ? "Ask a question (CEO mode)…"
                : "Ask anything about your data…"
            }
            rows={1}
            className="flex-1 resize-none bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors min-h-[46px] max-h-32"
            style={{ height: "46px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "46px";
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
