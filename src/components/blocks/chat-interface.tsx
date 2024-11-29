'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
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

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll when messages change

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setInput('');
    setIsLoading(true);

    // Add user message to chat
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: newMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }
      
      // Add assistant message to chat with usage data
      setMessages(messages => [...messages, { 
        role: 'assistant' as const, 
        content: data.message,
        usage: data.usage
      }]);
    } catch (error: any) {
      console.error('Error:', error);
      setMessages(messages => [...messages, { 
        role: 'assistant' as const, 
        content: error.message || 'An error occurred while processing your request.',
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-lg border">
        {messages.map((message, index) => (
          <div key={index}>
            <div
              className={`p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 ml-auto max-w-[80%]'
                  : message.isError
                  ? 'bg-red-100 text-red-700 mr-auto max-w-[80%]'
                  : 'bg-gray-100 mr-auto max-w-[80%]'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
                      p: ({ children }) => <p className="mb-4">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      code: ({ className, children }) => {
                        const isBlock = /language-(\w+)/.exec(className || '');
                        return (
                          <code 
                            className={`${isBlock 
                              ? 'block bg-gray-200 dark:bg-gray-800 p-3 rounded-lg mb-4 overflow-x-auto' 
                              : 'bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded'}`}
                          >
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => <pre className="mb-4">{children}</pre>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                message.content
              )}
            </div>
            {message.role === 'assistant' && message.usage && (
              <div className="text-xs text-gray-500 mt-1 ml-2">
                Tokens: {message.usage.input_tokens} in / {message.usage.output_tokens} out • 
                Cost: ${message.usage.total_cost} (${message.usage.input_cost} in / ${message.usage.output_cost} out)
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
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          Send
        </Button>
      </form>
    </div>
  );
}
