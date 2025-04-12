import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request format. Messages array is required.' },
        { status: 400 }
      );
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 150, // Keep responses concise
    });
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    
    return NextResponse.json(
      { 
        error: 'Error processing request', 
        details: error.message 
      },
      { status: 500 }
    );
  }
} 