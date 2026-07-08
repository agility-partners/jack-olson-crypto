"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  assistantMessageMetadataSchema,
  type AssistantChatMessage,
} from "../api/chat/citations";
import styles from "./AssistantPageClient.module.css";

const ALL_SUGGESTIONS = [
  "What are the top gainers and losers today?",
  "Show me the current market summary",
  "What's the price of Bitcoin and Ethereum?",
  "What's in my watchlist?",
  "Which coin has the highest market cap right now?",
  "What are the biggest losers in the last 24 hours?",
  "Give me an overview of the crypto market today",
  "How is Solana performing compared to Ethereum?",
  "What coins are trending up right now?",
  "Show me the top 5 coins by trading volume",
];

const DEFAULT_SUGGESTIONS = ALL_SUGGESTIONS.slice(0, 5);

function pickRandomSuggestions(count: number): string[] {
  const shuffled = [...ALL_SUGGESTIONS];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

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

export default function AssistantPageClient() {
  const { messages, sendMessage, status, error } =
    useChat<AssistantChatMessage>({
      transport,
      messageMetadataSchema: assistantMessageMetadataSchema,
    });
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSuggestions(pickRandomSuggestions(DEFAULT_SUGGESTIONS.length));
  }, []);

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
              {suggestions.map((s) => (
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
