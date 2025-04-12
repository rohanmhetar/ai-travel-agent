import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion, type ChatMessage } from '@/utils/openai';
import { getAmadeusClient } from '@/utils/amadeus';
import { tools, systemMessage } from './shared';
import { recordApiCall, setUserQuery } from '../chat-status/route';
import { parseSmartDate } from '@/utils/dates';
import { AI_CONFIG, API_RESPONSE_CONFIG, USER_PREFERENCES } from '@/utils/config';

// Maximum number of messages to include in the conversation history
const MAX_CONVERSATION_MESSAGES = AI_CONFIG.CONTEXT.MAX_CONVERSATION_MESSAGES;

// Maximum number of results to include from API responses
const MAX_FLIGHT_RESULTS = API_RESPONSE_CONFIG.MAX_RESULTS.FLIGHT;
const MAX_HOTEL_RESULTS = API_RESPONSE_CONFIG.MAX_RESULTS.HOTEL;
const MAX_ACTIVITY_RESULTS = API_RESPONSE_CONFIG.MAX_RESULTS.ACTIVITY;
const MAX_TRANSFER_RESULTS = API_RESPONSE_CONFIG.MAX_RESULTS.TRANSFER;

// Valid amenity values for hotel searches
const VALID_AMENITIES = [
  'SWIMMING_POOL', 'SPA', 'FITNESS_CENTER', 'AIR_CONDITIONING', 'RESTAURANT', 
  'PARKING', 'PETS_ALLOWED', 'AIRPORT_SHUTTLE', 'BUSINESS_CENTER', 
  'DISABLED_FACILITIES', 'WIFI', 'MEETING_ROOMS', 'NO_KID_ALLOWED', 
  'TENNIS', 'GOLF', 'KITCHEN', 'ANIMAL_WATCHING', 'BABY-SITTING', 
  'BEACH', 'CASINO', 'JACUZZI', 'SAUNA', 'SOLARIUM', 'MASSAGE', 
  'VALET_PARKING', 'BAR', 'LOUNGE', 'KIDS_WELCOME', 'NO_PORN_FILMS', 
  'MINIBAR', 'TELEVISION', 'WI-FI_IN_ROOM', 'ROOM_SERVICE', 
  'GUARDED_PARKG', 'SERV_SPEC_MENU'
];

// Valid ratings for hotel searches
const VALID_RATINGS = ['1', '2', '3', '4', '5'];

// Map of common terms to their proper amenity values
const AMENITY_MAPPING: Record<string, string> = {
  'pool': 'SWIMMING_POOL',
  'swimming pool': 'SWIMMING_POOL',
  'swim': 'SWIMMING_POOL',
  'fitness': 'FITNESS_CENTER',
  'gym': 'FITNESS_CENTER',
  'workout': 'FITNESS_CENTER',
  'exercise': 'FITNESS_CENTER',
  'wifi': 'WIFI',
  'internet': 'WIFI',
  'wi-fi': 'WIFI',
  'pet friendly': 'PETS_ALLOWED',
  'pets': 'PETS_ALLOWED',
  'dog friendly': 'PETS_ALLOWED',
  'cat friendly': 'PETS_ALLOWED',
  'air conditioned': 'AIR_CONDITIONING',
  'a/c': 'AIR_CONDITIONING',
  'ac': 'AIR_CONDITIONING',
  'shuttle': 'AIRPORT_SHUTTLE',
  'hot tub': 'JACUZZI',
};

// Simple cache to avoid repeated API calls
export const apiResponseCache: Record<string, any> = {};

/**
 * Create a cache key for API requests
 */
export function createCacheKey(functionName: string, args: any): string {
  // For simplicity, just stringify the arguments with the function name
  return `${functionName}:${JSON.stringify(args)}`;
}

/**
 * Fix and validate amenities, replacing invalid values with valid ones
 */
function fixAmenities(amenitiesStr: string): string {
  // If already correct format (comma-separated valid values), return as is
  if (!amenitiesStr) return '';
  
  const amenities = amenitiesStr.split(',').map(a => a.trim().toUpperCase());
  const validatedAmenities: string[] = [];
  
  for (const amenity of amenities) {
    // If it's already a valid amenity, add it
    if (VALID_AMENITIES.includes(amenity)) {
      validatedAmenities.push(amenity);
      continue;
    }
    
    // Try to map to valid value
    const mappedValue = AMENITY_MAPPING[amenity.toLowerCase()];
    if (mappedValue) {
      validatedAmenities.push(mappedValue);
      continue;
    }
    
    // Try to find the closest match in valid amenities
    const bestMatch = findClosestMatch(amenity, VALID_AMENITIES);
    if (bestMatch) {
      console.log(`Mapped invalid amenity "${amenity}" to "${bestMatch}"`);
      validatedAmenities.push(bestMatch);
    } else {
      console.warn(`Could not map invalid amenity: ${amenity}`);
    }
  }
  
  // Remove duplicates
  const uniqueAmenities = [...new Set(validatedAmenities)];
  return uniqueAmenities.join(',');
}

/**
 * Find the closest matching valid amenity using simple string similarity
 */
function findClosestMatch(input: string, validOptions: string[]): string | null {
  const inputWords = input.toLowerCase().split(/\s+/);
  
  // First try exact substring matches
  for (const option of validOptions) {
    if (option.toLowerCase().includes(input.toLowerCase()) || 
        input.toLowerCase().includes(option.toLowerCase())) {
      return option;
    }
  }
  
  // Then try word-by-word matching
  let bestMatch = null;
  let bestScore = 0;
  
  for (const option of validOptions) {
    const optionWords = option.toLowerCase().split(/[_\s]+/);
    let score = 0;
    
    // Count matching words
    for (const inputWord of inputWords) {
      if (optionWords.some(word => word.includes(inputWord) || inputWord.includes(word))) {
        score++;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = option;
    }
  }
  
  // Only return if we have a reasonable match
  return bestScore > 0 ? bestMatch : null;
}

/**
 * Fix and validate hotel star ratings, handling "at least X star" requests
 * For example, "3" becomes "3" but "at least 3" becomes "3,4,5"
 */
function fixRatings(ratingsStr: string): string {
  if (!ratingsStr) return '';
  
  // Check if it's already comma-separated ratings like "3,4,5"
  const commaSeparatedPattern = /^[1-5](,[1-5])*$/;
  if (commaSeparatedPattern.test(ratingsStr)) {
    return ratingsStr; // Already in correct format
  }
  
  // Look for phrases like "at least X star" or "X star and above"
  const atLeastPattern = /at\s+least\s+([1-5])|([1-5])\s+star\s+(and\s+above|or\s+higher|or\s+better|\+)/i;
  const atLeastMatch = ratingsStr.match(atLeastPattern);
  
  if (atLeastMatch) {
    // Get the minimum star rating
    const minRating = parseInt(atLeastMatch[1] || atLeastMatch[2]);
    if (minRating >= 1 && minRating <= 5) {
      // Create array of ratings from minRating to 5
      const ratings = [];
      for (let i = minRating; i <= 5; i++) {
        ratings.push(i.toString());
      }
      console.log(`Mapped "at least ${minRating} star" to "${ratings.join(',')}"`);
      return ratings.join(',');
    }
  }
  
  // Try to extract numbers and ensure they're valid
  const numbersOnly = ratingsStr.match(/[1-5]/g);
  if (numbersOnly && numbersOnly.length > 0) {
    const uniqueRatings = [...new Set(numbersOnly)].filter(r => VALID_RATINGS.includes(r));
    if (uniqueRatings.length > 0) {
      console.log(`Extracted rating numbers from "${ratingsStr}" to "${uniqueRatings.join(',')}"`);
      return uniqueRatings.join(',');
    }
  }
  
  // Default to all ratings if we couldn't parse
  console.warn(`Could not parse ratings: ${ratingsStr}. Using default.`);
  return '';
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

// Handle chat requests
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Always add system message at the beginning
    const chatMessages: ChatMessage[] = [systemMessage];
    
    // Find latest user message to track context
    let latestUserMessage = '';
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        latestUserMessage = messages[i].content || '';
        break;
      }
    }
    
    // Store latest user query for context
    if (latestUserMessage) {
      setUserQuery(latestUserMessage);
    }
    
    // Limit conversation history to prevent token limit errors
    // Keep only the most recent messages, up to MAX_CONVERSATION_MESSAGES
    const recentMessages = messages.length > MAX_CONVERSATION_MESSAGES
      ? messages.slice(-MAX_CONVERSATION_MESSAGES)
      : messages;
    
    // Add user messages
    for (const message of recentMessages) {
      // Skip any existing system messages
      if (message.role !== 'system') {
        chatMessages.push(message);
      }
    }
    
    console.log(`Processing ${chatMessages.length} messages (truncated from ${messages.length})`);
    
    // Call OpenAI API with tools
    const response = await chatCompletion(chatMessages, tools);
    
    // Handle tool calls if any
    const responseMessage = response.choices[0].message;
    
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCalls = responseMessage.tool_calls;
      const toolResults = [];
      
      // Track API calls for this conversation
      const apiCalls = [];
      
      // Process each tool call
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        let result;
        let apiCall = null;
        
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
                // Don't parse or transform dates - let the AI resolve them naturally
                // We'll use the dates exactly as provided by the AI
                
                // Only validate that dates are provided at all
                if (!functionArgs.departureDate) {
                  console.warn('Missing departure date in searchFlights');
                  functionArgs.departureDate = '2025-05-15'; // Safe fallback
                }
                
                result = await amadeus.searchFlights(functionArgs);
                
                // No truncation - use the original response
                apiCall = {
                  apiName: functionName,
                  endpoint: '/v2/shopping/flight-offers',
                  requestData: functionArgs,
                  responseData: result
                };
                break;
                
              case 'searchHotelsByCity':
                // Fix amenities if provided
                if (functionArgs.amenities) {
                  functionArgs.amenities = fixAmenities(functionArgs.amenities);
                }
                
                // Fix ratings if provided
                if (functionArgs.ratings) {
                  functionArgs.ratings = fixRatings(functionArgs.ratings);
                }
                
                result = await amadeus.searchHotelsByCity(functionArgs);
                
                // No truncation - use the original response
                apiCall = {
                  apiName: functionName,
                  endpoint: '/v1/reference-data/locations/hotels/by-city',
                  requestData: functionArgs,
                  responseData: result
                };
                break;
                
              case 'searchHotelsByGeocode':
                // Fix amenities if provided
                if (functionArgs.amenities) {
                  functionArgs.amenities = fixAmenities(functionArgs.amenities);
                }
                
                // Fix ratings if provided
                if (functionArgs.ratings) {
                  functionArgs.ratings = fixRatings(functionArgs.ratings);
                }
                
                result = await amadeus.searchHotelsByGeocode(functionArgs);
                
                // No truncation - use the original response
                apiCall = {
                  apiName: functionName,
                  endpoint: '/v1/reference-data/locations/hotels/by-geocode',
                  requestData: functionArgs,
                  responseData: result
                };
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
                
                // Record API call
                apiCall = {
                  apiName: functionName,
                  endpoint: '/v1/shopping/activities',
                  requestData: functionArgs,
                  responseData: result
                };
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
                
                // Record API call
                apiCall = {
                  apiName: functionName,
                  endpoint: '/v1/shopping/transfer-offers',
                  requestData: functionArgs,
                  responseData: result
                };
                break;
                
              default:
                result = { error: `Unknown function: ${functionName}` };
            }
            
            // Cache the result if it's successful
            if (result && !(result as any).error) {
              apiResponseCache[cacheKey] = result;
              console.log(`Cached result for ${functionName}`);
            }
          }
          
          // Store this API call
          if (apiCall) {
            apiCalls.push(apiCall);
            recordApiCall(apiCall, latestUserMessage);
            console.log(`✅ Recorded API call for ${functionName}`);
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
          
          // Record even the errors
          apiCall = {
            apiName: functionName,
            endpoint: `Amadeus API: ${functionName}`,
            requestData: functionArgs,
            responseData: result
          };
          
          apiCalls.push(apiCall);
          recordApiCall(apiCall, latestUserMessage);
          console.log(`⚠️ Recorded error API call for ${functionName}`);
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
      
      // Include the API calls in the response metadata
      const responseWithApiCalls = {
        ...finalResponse,
        apiCalls: apiCalls
      };
      
      return NextResponse.json(responseWithApiCalls);
    }
    
    // Return direct response if no tool calls
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing chat:', error);
    return NextResponse.json(
      { error: 'Error processing your request' },
      { status: 500 }
    );
  }
}

// Process API calls from the AI assistant
async function processApiCall(
  apiName: string,
  endpoint: string,
  parameters: any,
  showYourWork = false
): Promise<{ result: any, error?: string }> {
  console.log(`API call to ${apiName} - ${endpoint} with parameters:`, parameters);
  
  // Create an API call object for recording
  const apiCall: {
    apiName: string;
    endpoint: string;
    requestData: any;
    responseData: any;
  } = {
    apiName,
    endpoint,
    requestData: parameters,
    responseData: null // Will be populated with either result or error
  };
  
  try {
    // Get Amadeus client
    const amadeus = getAmadeusClient();
    
    // Call the appropriate API based on function name
    let result;
    switch (apiName) {
      case 'searchFlights':
        result = await amadeus.searchFlights(parameters);
        break;
      case 'searchHotelsByCity':
        result = await amadeus.searchHotelsByCity(parameters);
        break;
      case 'searchHotelsByGeocode':
        result = await amadeus.searchHotelsByGeocode(parameters);
        break;
      case 'searchActivities':
        result = await amadeus.searchActivities(parameters);
        break;
      default:
        throw new Error(`Unknown API function: ${apiName}`);
    }

    // Record successful API call for display in the UI
    if (showYourWork !== false) {
      apiCall.responseData = result;
      recordApiCall(apiCall, "");
    }

    return { result };
  } catch (error: any) {
    console.error(`Error calling ${apiName}:`, error.message || error);
    
    // Record failed API call for display in the UI
    if (showYourWork !== false) {
      apiCall.responseData = { 
        error: true, 
        message: error.message || 'Unknown error occurred',
        statusCode: error.statusCode || 500,
        details: error.details || null
      };
      recordApiCall(apiCall, "");
    }
    
    return { 
      result: null, 
      error: error.message || 'Unknown error occurred'
    };
  }
} 