import { NextResponse } from 'next/server';

// Cost per million tokens
const COST_PER_INPUT_MTOK = 3;    // $3 per million input tokens
const COST_PER_OUTPUT_MTOK = 15;   // $15 per million output tokens

// Helper to calculate cost
function calculateCost(tokens: number, costPerMTok: number): number {
  return (tokens / 1_000_000) * costPerMTok;
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key is not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        // model: 'claude-3-5-sonnet-20241022',
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || response.statusText;
      throw new Error(`Anthropic API error: ${errorMessage}`);
    }

    const data = await response.json();
    
    // Get token counts from the response
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;

    // Calculate costs
    const inputCost = calculateCost(inputTokens, COST_PER_INPUT_MTOK);
    const outputCost = calculateCost(outputTokens, COST_PER_OUTPUT_MTOK);
    const totalCost = inputCost + outputCost;

    return NextResponse.json({
      message: data.content[0].text,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        input_cost: inputCost.toFixed(6),
        output_cost: outputCost.toFixed(6),
        total_cost: totalCost.toFixed(6)
      }
    });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
