"use client";

import { createContext, useContext, useRef, useEffect, type ReactNode } from "react";
import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  assistantMessageMetadataSchema,
  type AssistantChatMessage,
} from "../api/chat/citations";

const STORAGE_KEY = "assistant_chat_history";

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
    // Restore messages from sessionStorage after client hydration
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AssistantChatMessage[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          chat.messages = parsed;
        }
      }
    } catch {
      // Ignore storage or parse errors; start with a fresh session
      try {
        sessionStorage.removeItem(STORAGE_KEY);
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
