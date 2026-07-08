"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  assistantMessageMetadataSchema,
  type AssistantChatMessage,
} from "../api/chat/citations";
import { DEFAULT_ASSISTANT_SUGGESTIONS } from "../lib/assistantSuggestions";
import styles from "./AssistantPageClient.module.css";

const transport = new DefaultChatTransport({ api: "/api/chat" });

function getMessageDisplayText(
  parts: AssistantChatMessage["parts"],
  sourcesLine?: string
) {
  const text = parts
    .filter(
      (part): part is Extract<AssistantChatMessage["parts"][number], { type: "text" }> =>
        part.type === "text"
    )
    .map((part) => part.text)
    .join("");

  if (!text) {
    return "";
  }

  const normalizedText = text.trimEnd();

  if (sourcesLine) {
    const escapedSourcesLine = sourcesLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return normalizedText
      .replace(new RegExp(`(?:\\r?\\n)?${escapedSourcesLine}\\s*$`), "")
      .trimEnd();
  }

  return normalizedText.replace(/(?:\r?\n)?Sources:[^\n]*\s*$/u, "").trimEnd();
}

type AssistantPageClientProps = {
  initialSuggestions?: string[];
};

export default function AssistantPageClient({
  initialSuggestions = DEFAULT_ASSISTANT_SUGGESTIONS,
}: AssistantPageClientProps) {
  const { messages, sendMessage, status, error } =
    useChat<AssistantChatMessage>({
      transport,
      messageMetadataSchema: assistantMessageMetadataSchema,
    });
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isbusy = status === "submitted" || status === "streaming";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isbusy) return;
    sendMessage({ text });
    setInput("");
  };

  const handleSuggestion = (text: string) => {
    if (isbusy) return;
    sendMessage({ text });
  };

  const isEmpty = messages.length === 0;

  const statusLabel = isbusy ? "Thinking…" : "Live";
  const statusDotStyle = isbusy
    ? { background: "var(--green-muted)", opacity: 0.7 }
    : { background: "var(--green-primary)" };

  return (
    <div className={styles.wrapper}>
      {/* Page header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon} aria-hidden="true">✦</div>
          <div>
            <h1 className={styles.title}>Crypto Assistant</h1>
            <p className={styles.subtitle}>
              Warehouse-backed answers · Powered by live market data
            </p>
          </div>
        </div>
        <div className={styles.statusBadge}>
          <span className={styles.statusDot} style={statusDotStyle} />
          {statusLabel}
        </div>
      </div>

      {/* Chat area */}
      <div className={styles.chatArea}>
        {isEmpty ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">◈</div>
            <h2>What would you like to know?</h2>
            <p>
              Ask about market trends, top movers, coin comparisons, or your
              watchlist. The assistant calls live warehouse-backed tools — no
              guessing, no hallucinated prices.
            </p>

            <div className={styles.suggestions}>
              {initialSuggestions.map((s) => (
                <button
                  key={s}
                  className={styles.suggestionBtn}
                  onClick={() => handleSuggestion(s)}
                  type="button"
                  disabled={isbusy}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.messageList}>
            {messages.map((msg) => {
              const messageText =
                msg.role === "assistant"
                  ? getMessageDisplayText(msg.parts, msg.metadata?.sourcesLine)
                  : getMessageDisplayText(msg.parts);

              return (
                <div
                  key={msg.id}
                  className={
                    msg.role === "user"
                      ? styles.userBubble
                      : styles.assistantBubble
                  }
                >
                  {msg.role === "assistant" && (
                    <span className={styles.assistantLabel} aria-hidden="true">
                      ✦
                    </span>
                  )}
                  <div>
                    <p>{messageText}</p>
                    {msg.role === "assistant" && msg.metadata?.sourcesLine && (
                      <p className={styles.sourcesLine}>{msg.metadata.sourcesLine}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {isbusy && (
              <div className={styles.assistantBubble}>
                <span className={styles.assistantLabel} aria-hidden="true">✦</span>
                <p className={styles.thinking}>Thinking…</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <strong>⚠ Error:</strong>{" "}
          {error.message || "An unexpected error occurred. Check the browser console and Docker logs for details."}
        </div>
      )}

      {/* Input bar */}
      <form className={styles.inputBar} onSubmit={handleSubmit}>
        <input
          className={styles.textInput}
          type="text"
          placeholder="Ask about prices, market trends, your watchlist…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isbusy}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          className={styles.sendBtn}
          type="submit"
          disabled={!input.trim() || isbusy}
          aria-label="Send message"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1.5 9L16.5 1.5L9 16.5L7.5 10.5L1.5 9Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>

      <p className={styles.disclaimer}>
        Educational tool only — not financial advice. Always verify data from
        official sources.
      </p>
    </div>
  );
}
