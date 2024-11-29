'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }
      
      // Add assistant message to chat with usage data
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message,
        usage: data.usage
      }]);
    } catch (error: any) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
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
              {message.content}
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
        <div ref={messagesEndRef} /> {/* Invisible element to scroll to */}
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
