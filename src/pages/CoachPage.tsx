import { useEffect, useRef, useState, type FormEvent } from "react";
import PageHeader from "../components/layout/PageHeader";
import { useCoach } from "../hooks/useCoach";
import type { CoachChatMessage } from "../api/client";

function Bubble({ message }: { message: CoachChatMessage }) {
  const isAssistant = message.role === "assistant";
  if (isAssistant) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-xl rounded-tl-sm border border-brand-border bg-brand-surface p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-brand-accent" aria-hidden>
              ✦
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-brand-accent">
              Coach
            </span>
          </div>
          <p className="whitespace-pre-line text-sm text-brand-text">
            {message.content}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-brand-accent/15 p-3">
        <p className="whitespace-pre-line text-sm text-brand-text">
          {message.content}
        </p>
      </div>
    </div>
  );
}

export default function CoachPage() {
  const { messages, loading, noPlacement, error, sending, send } = useCoach();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view as the conversation grows.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft;
    setDraft("");
    void send(text);
  }

  return (
    <>
      <PageHeader title="Coach" subtitle="Your accountability coach" />

      <div className="space-y-3 px-4 pb-40">
        {loading && <p className="text-sm text-brand-muted">Loading…</p>}
        {noPlacement && (
          <p className="text-sm text-brand-muted">
            You need an active placement to chat with your coach.
          </p>
        )}
        {!loading && !noPlacement && messages.length === 0 && (
          <p className="text-sm text-brand-muted">
            Ask your coach anything about your KPIs, units, evidence or starting
            your business.
          </p>
        )}

        {messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-xl rounded-tl-sm border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-muted">
              Coach is thinking…
            </div>
          </div>
        )}
        {error && <p className="text-xs text-brand-danger">{error}</p>}

        <div ref={endRef} />
      </div>

      {/* Input bar pinned above the bottom nav + safe area. */}
      {!noPlacement && (
        <div
          className="fixed inset-x-0 z-10 border-t border-brand-border bg-brand-surface/95 backdrop-blur"
          style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom))" }}
        >
          <form
            onSubmit={onSubmit}
            className="mx-auto flex max-w-md items-center gap-2 p-3"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message your coach…"
              className="flex-1 rounded-xl border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:border-brand-accent"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="rounded-xl bg-brand-accent px-4 py-2.5 text-sm font-medium text-brand-bg transition-opacity disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
