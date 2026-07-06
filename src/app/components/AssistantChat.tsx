"use client";

import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import styles from "./AssistantChat.module.css";

function messageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
    .trim();
}

function toolLabels(message: UIMessage): string[] {
  return message.parts
    .filter((part) => part.type.startsWith("tool-"))
    .map((part) => part.type.replace("tool-", ""));
}

export default function AssistantChat() {
  const { messages, sendMessage, status, error, stop } = useChat();
  const [input, setInput] = useState("");

  const isBusy = status === "submitted" || status === "streaming";

  const canSubmit = useMemo(() => input.trim().length > 0 && !isBusy, [input, isBusy]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isBusy) return;

    setInput("");
    await sendMessage({ text: prompt });
  };

  return (
    <section className={styles.chatShell} aria-live="polite">
      <header className={styles.header}>
        <h1>Warehouse Assistant</h1>
        <p>Tool-grounded answers only. If data is unavailable, it will say so.</p>
      </header>

      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            Ask things like “Top 5 gainers and BTC dominance right now.”
          </div>
        ) : (
          messages.map((message) => {
            const text = messageText(message);
            const usedTools = toolLabels(message);

            return (
              <article
                key={message.id}
                className={`${styles.message} ${message.role === "user" ? styles.user : styles.assistant}`}
              >
                <div className={styles.role}>{message.role === "user" ? "You" : "Assistant"}</div>
                <div className={styles.body}>{text || (message.role === "assistant" ? "…" : "")}</div>
                {usedTools.length > 0 && (
                  <div className={styles.tools}>
                    {usedTools.map((tool) => (
                      <span key={`${message.id}-${tool}`} className={styles.toolChip}>
                        tool: {tool}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        <textarea
          className={styles.input}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about market summary, movers, coins, or watchlist..."
          rows={3}
          disabled={isBusy}
        />

        <div className={styles.actions}>
          <span className={styles.status}>
            {status === "submitted" && "Sending..."}
            {status === "streaming" && "Streaming tool-grounded response..."}
            {status === "ready" && "Ready"}
            {status === "error" && "Error"}
          </span>

          <div className={styles.buttons}>
            {isBusy && (
              <button type="button" className={styles.stopBtn} onClick={() => void stop()}>
                Stop
              </button>
            )}
            <button type="submit" className={styles.submitBtn} disabled={!canSubmit}>
              Send
            </button>
          </div>
        </div>
      </form>

      {error && (
        <p className={styles.error} role="alert">
          Assistant request failed. Please try again.
        </p>
      )}
    </section>
  );
}
