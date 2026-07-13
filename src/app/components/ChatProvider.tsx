"use client";

import { createContext, useContext, useRef, useEffect, type ReactNode } from "react";
import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  assistantMessageMetadataSchema,
  type AssistantChatMessage,
} from "../api/chat/citations";

const STORAGE_KEY = "assistant_chat_history";
const INSTANCE_KEY = "assistant_server_instance";

export const chatTransport = new DefaultChatTransport({ api: "/api/chat" });

type ChatInstance = Chat<AssistantChatMessage>;

const ChatContext = createContext<ChatInstance | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const chatRef = useRef<ChatInstance | null>(null);

  if (chatRef.current === null) {
    chatRef.current = new Chat<AssistantChatMessage>({
      transport: chatTransport,
      messageMetadataSchema: assistantMessageMetadataSchema,
    });
  }

  const chat = chatRef.current;

  useEffect(() => {
    // Check the server instance ID to detect a container/server restart.
    // If the ID has changed since the last time this tab loaded, clear the
    // stored history so stale conversation context is not sent to the new
    // server process.
    let cancelled = false;

    async function initSession() {
      let serverInstanceId: string | null = null;
      try {
        const res = await fetch("/api/instance");
        if (res.ok) {
          const data: { instanceId: string } = await res.json();
          serverInstanceId = data.instanceId;
        }
      } catch {
        // Network error (e.g. dev server not ready) — fall through and
        // preserve existing history for this session.
      }

      if (cancelled) return;

      try {
        const storedInstanceId = sessionStorage.getItem(INSTANCE_KEY);

        if (serverInstanceId && storedInstanceId !== serverInstanceId) {
          // Server has restarted since we last stored history — clear it.
          sessionStorage.removeItem(STORAGE_KEY);
          sessionStorage.setItem(INSTANCE_KEY, serverInstanceId);
        } else {
          // Same server instance: restore saved messages.
          const stored = sessionStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed: AssistantChatMessage[] = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              chat.messages = parsed;
            }
          }
        }
      } catch {
        // Ignore storage or parse errors; start with a fresh session
        try {
          sessionStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(INSTANCE_KEY);
        } catch {
          // ignore
        }
      }

      // Persist messages whenever they change
      const unregister = chat["~registerMessagesCallback"](() => {
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chat.messages));
        } catch {
          // Ignore storage errors (e.g. private-browsing quota limits)
        }
      });

      return unregister;
    }

    const cleanupPromise = initSession();

    return () => {
      cancelled = true;
      cleanupPromise.then((unregister) => unregister?.());
    };
  }, [chat]);

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

/**
 * Returns the shared Chat instance from the nearest ChatProvider,
 * or null if no provider is present (e.g. in isolated unit tests).
 */
export function useChatInstance(): ChatInstance | null {
  return useContext(ChatContext);
}
