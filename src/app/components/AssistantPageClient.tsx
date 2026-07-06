"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import styles from "./AssistantPageClient.module.css";

const SUGGESTIONS = [
  "What are the top 5 gainers today?",
  "Compare BTC and ETH performance",
  "Show me the current market summary",
  "What's in my watchlist?",
];

function getTextContent(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text!)
    .join("");
}

export default function AssistantPageClient() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isStreaming = status === "streaming" || status === "submitted";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    sendMessage({ text });
    setInput("");
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  const isEmpty = messages.length === 0;

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
          <span className={styles.statusDot} />
          {isStreaming ? "Thinking…" : "Live"}
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
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className={styles.suggestionBtn}
                  onClick={() => handleSuggestion(s)}
                  type="button"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.messageList}>
            {messages.map((msg) => {
              const text = getTextContent(
                msg.parts as { type: string; text?: string }[]
              );
              if (!text && msg.role !== "user") return null;
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
                  <p>{text}</p>
                </div>
              );
            })}
            {isStreaming && (
              <div className={styles.assistantBubble}>
                <span className={styles.assistantLabel} aria-hidden="true">✦</span>
                <p className={styles.thinkingDots}>
                  <span>·</span><span>·</span><span>·</span>
                </p>
              </div>
            )}
            {error && (
              <div className={styles.assistantBubble}>
                <span className={styles.assistantLabel} aria-hidden="true">✦</span>
                <p className={styles.errorText}>
                  Something went wrong. Please try again.
                </p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <form className={styles.inputBar} onSubmit={handleSubmit}>
        <input
          className={styles.textInput}
          type="text"
          placeholder="Ask about prices, market trends, your watchlist…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          disabled={isStreaming}
        />
        <button
          className={styles.sendBtn}
          type="submit"
          disabled={!input.trim() || isStreaming}
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
