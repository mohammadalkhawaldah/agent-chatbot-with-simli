"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef } from "react";

import ChatLoadingDots from "@/components/ChatLoadingDots";
import { MessageBubble } from "@/components/MessageBubble";
import { Message, ToolCall } from "@/lib/types";

interface ChatDialogProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatHistory({ messages, isLoading }: ChatDialogProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scrolls the dummy element into view when messages change.
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const dedupedMessages = useMemo(() => {
    const seenIds = new Set<string>();
    return messages.filter((msg) => {
      if ("id" in msg && msg.id) {
        if (seenIds.has(msg.id)) return false;
        seenIds.add(msg.id);
      }
      return true;
    });
  }, [messages]);

  const mergedMessages = useMemo(() => {
    return dedupedMessages.reduce((newMessages, currentMessage) => {
      newMessages.push(currentMessage);
      if (currentMessage.type === "function_call_output") {
        const callId = currentMessage.call_id;
        const functionCallIndex = newMessages.findIndex(
          (message) =>
            message.type === "function_call" && message.call_id === callId
        );
        if (functionCallIndex !== -1) {
          newMessages[functionCallIndex] = {
            ...newMessages[functionCallIndex],
            output: currentMessage.output,
          } as ToolCall;
        }
      }
      return newMessages;
    }, [] as Message[]);
  }, [dedupedMessages]);

  return (
    <div
      className={clsx(
        "flex w-full flex-col gap-2 flex-1 overflow-y-auto relative max-w-2xl transition-all duration-300",
        messages.length === 0 && "flex-grow-0 basis-[calc(50%-72px-52px)]"
      )}
    >
      <div className="flex flex-col gap-2 relative py-8 px-5 pb-12">
        {mergedMessages.map((message, idx) => (
          <MessageBubble
            key={"id" in message && message.id ? `${message.id}_${idx}` : idx}
            message={message}
          />
        ))}
        {isLoading && <ChatLoadingDots />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
