"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChatWindow } from "./chat-window";

interface Message {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    input_cost: string;
    output_cost: string;
    total_cost: string;
  };
}

const STORAGE_KEY = "chat-history";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set isClient to true once the component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load messages from localStorage on mount
  useEffect(() => {
    if (isClient) {
      try {
        const savedMessages = localStorage.getItem(STORAGE_KEY);
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    }
  }, [isClient]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isClient && messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error("Error saving chat history:", error);
      }
    }
  }, [messages, isClient]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll when messages change

  // Auto-resize textarea as content changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setInput("");
    setIsLoading(true);

    // Add user message to chat
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Add assistant message to chat with usage data
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant" as const,
          content: data.message,
          usage: data.usage,
        },
      ]);
    } catch (error: any) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant" as const,
          content:
            error.message || "An error occurred while processing your request.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleReset = () => {
    setMessages([]);
    if (isClient) {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="flex flex-col h-[700px] max-w-[1200px] mx-auto p-4 space-y-4">
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        messagesEndRef={messagesEndRef}
      />
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Press Shift + Enter for new line)"
          disabled={isLoading}
          className="flex-1 min-h-[60px] max-h-[300px] p-2 rounded-md border border-input bg-background"
          rows={2}
        />
        <Button type="submit" disabled={isLoading}>
          Send
        </Button>
        <Button
          onClick={handleReset}
          variant="destructive"
          size="sm"
          className="text-sm"
        >
          Reset History
        </Button>
      </form>
    </div>
  );
}
