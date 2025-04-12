import { minimalSystemMessage } from '@/app/api/chat/shared';
import { getActiveModel, getMaxTokens } from './config';

// OpenAI API URL and model settings
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = getActiveModel();
const DEFAULT_MAX_TOKENS = getMaxTokens();

// Define models by capability level for flexible model selection
const MODELS = {
  DEFAULT: 'gpt-4o-mini',
  POWERFUL: 'gpt-4-turbo',
  LIGHTWEIGHT: 'gpt-3.5-turbo'
};

export interface Tool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content?: string | null;
  tool_call_id?: string;
  tool_calls?: any[];
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

/**
 * Send a chat completion request to OpenAI API with automatic token limit handling
 */
export async function chatCompletion(
  messages: ChatMessage[],
  tools?: Tool[],
  temperature = 0.7
): Promise<any> {
  try {
    // Initial attempt with full messages
    return await makeCompletionRequest(messages, tools, temperature);
  } catch (error: any) {
    // Check if this is a token limit error
    if (error.message && (
        error.message.includes('tokens per min') || 
        error.message.includes('maximum context length') ||
        error.message.includes('token limit') ||
        error.message.includes('rate_limit_exceeded'))) {
      
      console.warn('Token limit exceeded, attempting progressive reduction strategies');
      
      // Get system message if it exists (usually first message)
      const systemMessage = messages[0].role === 'system' ? messages[0] : undefined;
      
      // Strategy 1: Keep only system message and latest exchange (most recent)
      try {
        console.log('Strategy 1: Latest exchange only');
        const reducedMessages = systemMessage 
          ? [systemMessage, ...messages.slice(-2)]
          : messages.slice(-2);
        
        console.log(`Reduced to ${reducedMessages.length} messages (from ${messages.length})`);
        return await makeCompletionRequest(reducedMessages, tools, temperature);
      } catch (error1: any) {
        if (!error1.message?.includes('rate_limit_exceeded')) {
          throw error1; // Only continue if it's still a token limit issue
        }
        
        console.warn('Strategy 1 failed, trying more aggressive reduction');
        
        // Strategy 2: Keep only system message and last user message
        try {
          console.log('Strategy 2: System message + last user message only');
          // Find the last user message
          let lastUserMessage: ChatMessage | undefined;
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
              lastUserMessage = messages[i];
              break;
            }
          }
          
          // Create minimal messages array, ensuring no undefined values
          let minimalMessages: ChatMessage[] = [];
          if (systemMessage) minimalMessages.push(systemMessage);
          if (lastUserMessage) minimalMessages.push(lastUserMessage);

          // Fallback to just the last message if we couldn't find a user message
          if (minimalMessages.length === 0 && messages.length > 0) {
            minimalMessages.push(messages[messages.length - 1]);
          }
          
          console.log(`Reduced to ${minimalMessages.length} messages (from ${messages.length})`);
          // For tools, we'll keep them but simplify descriptions
          const simplifiedTools = tools ? simplifyTools(tools) : undefined;
          
          return await makeCompletionRequest(minimalMessages, simplifiedTools, temperature);
        } catch (error2: any) {
          if (!error2.message?.includes('rate_limit_exceeded')) {
            throw error2; // Only continue if it's still a token limit issue
          }
          
          console.warn('Strategy 2 failed, trying final reduction strategy');
          
          // Strategy 3: Keep only last user message with minimal system instruction
          console.log('Strategy 3: Last user message with minimal system instruction');
          // Find the last user message content
          let userContent = '';
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
              userContent = messages[i].content || '';
              break;
            }
          }
          
          // Create a minimal conversation with imported minimal system message
          const emergencyMessages: ChatMessage[] = [
            minimalSystemMessage,
            {
              role: 'user',
              content: userContent
            }
          ];
          
          console.log('Using emergency minimal context');
          return await makeCompletionRequest(emergencyMessages, undefined, temperature);
        }
      }
    }
    
    // Re-throw the error if we couldn't handle it
    throw error;
  }
}

/**
 * Simplify tools by shortening descriptions to save tokens
 */
function simplifyTools(tools: Tool[]): Tool[] {
  return tools.map(tool => {
    // Clone the tool to avoid mutating the original
    const simplifiedTool = JSON.parse(JSON.stringify(tool));
    
    // Simplify description
    if (simplifiedTool.function?.description) {
      simplifiedTool.function.description = simplifiedTool.function.description.split('.')[0]; // Keep only first sentence
    }
    
    // Simplify parameter descriptions
    if (simplifiedTool.function?.parameters?.properties) {
      const properties = simplifiedTool.function.parameters.properties;
      for (const key in properties) {
        if (properties[key].description) {
          properties[key].description = properties[key].description.split('.')[0]; // Keep only first sentence
        }
      }
    }
    
    return simplifiedTool;
  });
}

/**
 * The actual implementation of the API call to OpenAI
 */
async function makeCompletionRequest(
  messages: ChatMessage[],
  tools?: Tool[],
  temperature = 0.7
): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }
  
  const request: any = {
    model: MODEL,
    messages,
    temperature,
    max_tokens: DEFAULT_MAX_TOKENS,
  };
  
  if (tools && tools.length > 0) {
    request.tools = tools;
    request.tool_choice = 'auto';
  }
  
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(JSON.stringify(error));
  }
  
  return await response.json();
}

/**
 * Stream a chat completion from OpenAI API
 */
export async function streamChatCompletion(
  messages: ChatMessage[],
  tools?: Tool[],
  temperature = 0.7
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }
  
  const request: any = {
    model: MODEL,
    messages,
    temperature,
    max_tokens: DEFAULT_MAX_TOKENS, // Use our lower default
    stream: true,
  };
  
  if (tools && tools.length > 0) {
    request.tools = tools;
    request.tool_choice = 'auto';
  }
  
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }
    
    return response;
  } catch (error) {
    console.error('Error in stream chat completion:', error);
    throw error;
  }
} 