import { ChatInterface } from '@/components/blocks/chat-interface';

export default function Home() {
  return (
    <main className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-8">Chat with Claude</h1>
      <ChatInterface />
    </main>
  );
}
