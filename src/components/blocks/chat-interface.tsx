'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatWindow } from './chat-window';

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
      <ChatWindow 
        messages={messages}
        isLoading={isLoading}
        messagesEndRef={messagesEndRef}
      />
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
