import { NextRequest, NextResponse } from 'next/server';
import { streamChatCompletion, chatCompletion, type ChatMessage } from '@/utils/openai';
import { tools, systemMessage } from '@/app/api/chat/shared';
import { getAmadeusClient } from '@/utils/amadeus';
import { parseSmartDate } from '@/utils/dates';
import { AI_CONFIG, API_RESPONSE_CONFIG, USER_PREFERENCES } from '@/utils/config';
import { recordApiCall } from '@/app/api/chat-status/route';

// Maximum number of messages to include in the conversation history
const MAX_CONVERSATION_MESSAGES = AI_CONFIG.CONTEXT.MAX_CONVERSATION_MESSAGES;

// Maximum number of results to include from API responses
const MAX_FLIGHT_RESULTS = API_RESPONSE_CONFIG.MAX_RESULTS.FLIGHT;
const MAX_HOTEL_RESULTS = API_RESPONSE_CONFIG.MAX_RESULTS.HOTEL;
const MAX_ACTIVITY_RESULTS = API_RESPONSE_CONFIG.MAX_RESULTS.ACTIVITY;
const MAX_TRANSFER_RESULTS = API_RESPONSE_CONFIG.MAX_RESULTS.TRANSFER;

// Simple cache for API responses
const apiResponseCache: Record<string, any> = {};

/**
 * Create a cache key for API requests
 */
function createCacheKey(functionName: string, args: any): string {
  // For simplicity, just stringify the arguments with the function name
  return `${functionName}:${JSON.stringify(args)}`;
}

/**
 * Compress API responses to reduce token usage
 */
function compressApiResponse(response: any): any {
  // Always return the original response without any modifications
  return response;
}

/**
 * Truncate API responses to reduce token usage
 */
function truncateApiResponse(result: any, apiName: string): any {
  // Always return the original, unmodified response
  return result;
}

function truncateResponseForStream(response: any): any {
  // Always return the original, unmodified response without any truncation
  return response;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, functions = [], function_call = "auto" } = await req.json();
    
    // Get the latest user message
    const latestUserMessage = messages.length > 0 ? 
      messages.filter((m: any) => m.role === 'user').pop()?.content || '' : '';
    
    // Add system message if it's not already included
    const chatMessages: ChatMessage[] = [];
    let hasSystemMessage = false;
    
    // Limit conversation history to prevent token limit errors
    // Keep only the most recent messages, up to MAX_CONVERSATION_MESSAGES
    const recentMessages = messages.length > MAX_CONVERSATION_MESSAGES
      ? messages.slice(-MAX_CONVERSATION_MESSAGES)
      : messages;
    
    console.log(`Processing ${recentMessages.length} messages (truncated from ${messages.length})`);
    
    for (const message of recentMessages) {
      if (message.role === 'system') {
        hasSystemMessage = true;
      }
      chatMessages.push(message);
    }
    
    if (!hasSystemMessage) {
      chatMessages.unshift(systemMessage);
    }
    
    // First check if tool calling is needed by using non-streaming
    const checkToolsResponse = await chatCompletion(chatMessages, tools);
    const responseMessage = checkToolsResponse.choices[0].message;
    
    // If tool calls are needed, handle them with the normal API route
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCalls = responseMessage.tool_calls;
      const toolResults = [];
      
      // Process each tool call
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        let result;
        try {
          const amadeus = getAmadeusClient();
          
          // Check cache first 
          const cacheKey = createCacheKey(functionName, functionArgs);
          if (apiResponseCache[cacheKey]) {
            console.log(`Cache hit for ${functionName}`);
            result = apiResponseCache[cacheKey];
          } else {
            // Call the appropriate Amadeus API based on the function name
            switch (functionName) {
              case 'searchFlights':
                result = await amadeus.searchFlights(functionArgs);
                // Result is used directly without truncation
                break;
                
              case 'searchHotelsByCity':
                result = await amadeus.searchHotelsByCity(functionArgs);
                // Result is used directly without truncation
                break;
                
              case 'searchHotelsByGeocode':
                result = await amadeus.searchHotelsByGeocode(functionArgs);
                // Result is used directly without truncation
                break;
                
              case 'searchActivities':
                if (!functionArgs.latitude && !functionArgs.longitude) {
                  // If we're missing coordinates, try to extract city name from the user's message
                  const cityQuery = functionArgs.cityName || latestUserMessage;
                  console.log(`Need to get coordinates for activities search: ${cityQuery}`);
                  
                  // Get city coordinates using OpenAI
                  const cityName = cityQuery.match(/in\s+([a-zA-Z\s]+)/) ? 
                    cityQuery.match(/in\s+([a-zA-Z\s]+)/)[1] : cityQuery;
                  
                  const cityCoordinatesPrompt = `What are the latitude and longitude coordinates for ${cityName}? Respond with only the coordinates in JSON format like: {"latitude": 51.5074, "longitude": -0.1278}`;
                  
                  const coordinatesResponse = await chatCompletion([
                    { role: 'user', content: cityCoordinatesPrompt }
                  ]);
                  
                  let coordinates;
                  try {
                    coordinates = JSON.parse(coordinatesResponse.choices[0].message.content);
                    // Validate coordinates
                    if (!coordinates.latitude || !coordinates.longitude) {
                      throw new Error('Invalid coordinates format');
                    }
                    
                    console.log(`Got coordinates for ${cityName}:`, coordinates);
                    
                    // Add coordinates to function args
                    functionArgs.latitude = coordinates.latitude;
                    functionArgs.longitude = coordinates.longitude;
                    if (!functionArgs.radius) {
                      functionArgs.radius = 20; // Default radius of 20km
                    }
                  } catch (error) {
                    console.error('Error parsing coordinates:', error);
                    // NYC coordinates as fallback
                    functionArgs.latitude = 40.7128;
                    functionArgs.longitude = -74.0060;
                    functionArgs.radius = 20;
                    console.log('Using default NYC coordinates as fallback');
                  }
                }
                
                // Make the API call with the coordinates
                result = await amadeus.searchActivities(functionArgs);
                break;
                
              case 'searchTransfers':
                // Format dates if provided
                if (functionArgs.transferDate) {
                  // Ensure date format is YYYY-MM-DD
                  if (!/^\d{4}-\d{2}-\d{2}$/.test(functionArgs.transferDate)) {
                    try {
                      const dateString = parseSmartDate(functionArgs.transferDate);
                      functionArgs.transferDate = dateString;
                    } catch (error) {
                      console.error("Error parsing date:", error);
                      // Default to current date if parsing fails
                      const today = new Date();
                      functionArgs.transferDate = today.toISOString().split('T')[0];
                    }
                  }
                  
                  // Convert transferDate to startDateTime format required by the API
                  if (!functionArgs.startDateTime) {
                    functionArgs.startDateTime = `${functionArgs.transferDate}T10:30:00`;
                    console.log(`Setting startDateTime to ${functionArgs.startDateTime} from transferDate`);
                  }
                }
                
                result = await amadeus.searchTransfers(functionArgs);
                
                // Add API call record for the response metadata
                // Record this API call for display in the "Show Your Work" section
                const transferApiCall = {
                  apiName: functionName,
                  endpoint: '/v1/shopping/transfer-offers',
                  requestData: functionArgs,
                  responseData: result
                };
                
                // Store API call information for later retrieval
                try {
                  recordApiCall(transferApiCall, latestUserMessage);
                  console.log(`✅ Recorded API call for ${functionName}`);
                } catch (err) {
                  console.error('Failed to record API call:', err);
                }
                break;
                
              default:
                throw new Error(`Unknown function: ${functionName}`);
            }
            
            // Cache the result if it's successful
            if (result && !(result as any).error) {
              apiResponseCache[cacheKey] = result;
              console.log(`Cached result for ${functionName}`);
            }
          }
        } catch (error: any) {
          // Handle API errors gracefully
          console.error(`Error calling ${functionName}:`, error.message || error);
          
          let errorMessage = "Sorry, there was an error accessing the travel data.";
          
          // Specific error for rate limiting
          if (error.message && error.message.includes("Rate limit")) {
            errorMessage = error.message;
          } else if (error.response && error.response.status === 429) {
            errorMessage = "We're making too many requests to the travel service. Please try again in a moment.";
          }
          
          result = { 
            error: true, 
            message: errorMessage,
            service: functionName
          };
        }
        
        // Add tool result
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool' as const,
          content: JSON.stringify(result),
        });
      }
      
      // Add assistant's original response with tool calls
      chatMessages.push(responseMessage);
      
      // Add tool results to messages
      for (const toolResult of toolResults) {
        chatMessages.push(toolResult);
      }
      
      // Get final response from OpenAI
      const finalResponse = await chatCompletion(chatMessages);
      return new Response(
        JSON.stringify(finalResponse),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // If no tool calls, use streaming
    const streamResponse = await streamChatCompletion(chatMessages);
    
    // Return the stream directly
    return new Response(streamResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error processing streaming chat:', error);
    return new Response(JSON.stringify({ error: 'Error processing your request' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 