"use client";

import { RefObject } from "react";
import ReactMarkdown from "react-markdown";

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

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: RefObject<HTMLDivElement>;
}

export function ChatWindow({
  messages,
  isLoading,
  messagesEndRef,
}: ChatWindowProps) {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-lg border">
      {messages.map((message, index) => (
        <div key={index}>
          <div
            className={`p-4 rounded-lg ${
              message.role === "user"
                ? "bg-blue-100 ml-auto max-w-[80%]"
                : message.isError
                  ? "bg-red-100 text-red-700 mr-auto max-w-[80%]"
                  : "bg-gray-100 mr-auto max-w-[80%]"
            }`}
          >
            {message.role === "assistant" ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  components={{
                    h1: function H1({ children }) {
                      return (
                        <h1 className="text-2xl font-bold mb-4">{children}</h1>
                      );
                    },
                    h2: function H2({ children }) {
                      return (
                        <h2 className="text-xl font-bold mb-3">{children}</h2>
                      );
                    },
                    h3: function H3({ children }) {
                      return (
                        <h3 className="text-lg font-bold mb-2">{children}</h3>
                      );
                    },
                    p: function Paragraph({ children }) {
                      return <p className="mb-4">{children}</p>;
                    },
                    ul: function UnorderedList({ children }) {
                      return (
                        <ul className="list-disc pl-6 mb-4">{children}</ul>
                      );
                    },
                    ol: function OrderedList({ children }) {
                      return (
                        <ol className="list-decimal pl-6 mb-4">{children}</ol>
                      );
                    },
                    li: function ListItem({ children }) {
                      return <li className="mb-1">{children}</li>;
                    },
                    code: function Code({ className, children }) {
                      const isBlock = /language-(\w+)/.exec(className || "");
                      return (
                        <code
                          className={`${
                            isBlock
                              ? "block bg-gray-200 dark:bg-gray-800 p-3 rounded-lg mb-4 overflow-x-auto"
                              : "bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded"
                          }`}
                        >
                          {children}
                        </code>
                      );
                    },
                    pre: function Pre({ children }) {
                      return <pre className="mb-4">{children}</pre>;
                    },
                    blockquote: function Blockquote({ children }) {
                      return (
                        <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4">
                          {children}
                        </blockquote>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              message.content
            )}
          </div>
          {message.role === "assistant" && message.usage && (
            <div className="text-xs text-gray-500 mt-1 ml-2">
              Tokens: {message.usage.input_tokens} in /{" "}
              {message.usage.output_tokens} out • Cost: $
              {message.usage.total_cost} (${message.usage.input_cost} in / $
              {message.usage.output_cost} out)
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="bg-gray-100 p-4 rounded-lg mr-auto max-w-[80%]">
          Thinking...
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
