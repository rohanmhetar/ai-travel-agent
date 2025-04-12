"use client";

import { useState, useRef, useEffect } from 'react';
import { FiSend, FiUser, FiMapPin } from 'react-icons/fi';
import { BsRobot } from 'react-icons/bs';
import { BiLoaderAlt } from 'react-icons/bi';
import { IoAirplaneOutline, IoBedOutline, IoMapOutline, IoCarOutline } from 'react-icons/io5';
import { MdOutlineLocalActivity } from 'react-icons/md';
import { FaTaxi } from 'react-icons/fa';
import MessageItem from './MessageItem';
import TravelResults from './TravelResults';
import ApiCallDetails from './ApiCallDetails';
import { Code2, ChevronDown, ChevronUp } from 'lucide-react';
import TruncationToggle from './TruncationToggle';
import FlightResultsSidebar from './FlightResultsSidebar';
import ActivityResultsSidebar from './ActivityResultsSidebar';
import TransferResultsSidebar from './TransferResultsSidebar';

interface AmadeusApiCall {
  apiName: string;
  endpoint: string;
  requestData: any;
  responseData: any;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id: string;
  isStreaming?: boolean;
  amadeusApiCalls?: AmadeusApiCall[];
  apiName?: string;
  endpoint?: string;
  requestData?: any;
  responseData?: any;
  showApiDetails?: boolean;
}

type MessageType = 'user' | 'assistant';

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const [showProcessing, setShowProcessing] = useState(false);
  const [travelResults, setTravelResults] = useState<any[] | null>(null);
  const [flightResults, setFlightResults] = useState<any[] | null>(null);
  const [activityResults, setActivityResults] = useState<any[] | null>(null);
  const [transferResults, setTransferResults] = useState<any[] | null>(null);
  const [resultType, setResultType] = useState<string | null>(null);
  // Add state for processing steps visibility
  const [showProcessingSteps, setShowProcessingSteps] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Add state for showing sidebars
  const [showFlightSidebar, setShowFlightSidebar] = useState(true);
  const [showHotelSidebar, setShowHotelSidebar] = useState(true);
  const [showActivitySidebar, setShowActivitySidebar] = useState(true);
  const [showTransferSidebar, setShowTransferSidebar] = useState(true);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Debug: Log all assistant messages to check for API calls
    messages.forEach(message => {
      if (message.role === 'assistant') {
        if (message.amadeusApiCalls && message.amadeusApiCalls.length > 0) {
          console.log(`✅ Message ${message.id} has ${message.amadeusApiCalls.length} API calls`);
        } else {
          console.log(`❌ Message ${message.id} has NO API calls`);
        }
      }
    });
  }, [messages, processingSteps]);

  // Extract Amadeus API calls from the OpenAI response
  const extractAmadeusApiCalls = (responseData: any): AmadeusApiCall[] => {
    const apiCalls: AmadeusApiCall[] = [];
    
    if (responseData && responseData.choices && responseData.choices[0] && responseData.choices[0].message) {
      // Try to extract tools calls from the response
      const message = responseData.choices[0].message;
      
      if (message.tool_calls && Array.isArray(message.tool_calls)) {
        console.log('Found tool_calls in response');
        
        for (const toolCall of message.tool_calls) {
          if (toolCall.function && toolCall.function.name && toolCall.function.name.startsWith('search')) {
            try {
              const functionName = toolCall.function.name;
              const functionArgs = JSON.parse(toolCall.function.arguments);
              let endpoint = '';
              
              // Map function name to endpoint
              switch (functionName) {
                case 'searchFlights':
                  endpoint = '/v2/shopping/flight-offers';
                  break;
                case 'searchHotelsByCity':
                  endpoint = '/v1/reference-data/locations/hotels/by-city';
                  break;
                case 'searchHotelsByGeocode':
                  endpoint = '/v1/reference-data/locations/hotels/by-geocode';
                  break;
                case 'searchActivities':
                  endpoint = '/v1/shopping/activities';
                  break;
                case 'searchTransfers':
                  endpoint = '/v1/shopping/transfer-offers';
                  break;
                default:
                  endpoint = `Amadeus API: ${functionName}`;
              }
              
              // For each potential tool call, find the corresponding response in the subsequent tool_outputs
              const toolResults = message.tool_outputs || [];
              const correspondingResult = toolResults.find((output: any) => output.tool_call_id === toolCall.id);
              
              if (correspondingResult && correspondingResult.content) {
                try {
                  const responseContent = JSON.parse(correspondingResult.content);
                  
                  // Extract flight results if this is a flight search
                  if (functionName === 'searchFlights' && responseContent && responseContent.data) {
                    // Filter out flights with carrier code 6X
                    const flightData = responseContent.data.filter((item: any) => {
                      // Check each flight's carrier codes
                      if (item.type === 'flight-offer') {
                        // Check if any segment in any itinerary has carrier code 6X
                        const has6XCarrier = item.itineraries?.some((itinerary: any) => 
                          itinerary.segments?.some((segment: any) => 
                            segment.carrierCode === '6X'
                          )
                        );
                        
                        // Only include flights that don't have carrier code 6X
                        return !has6XCarrier;
                      }
                      return false;
                    });
                    
                    if (flightData && flightData.length > 0) {
                      setFlightResults(flightData);
                      setResultType('flights');
                      console.log(`Found ${flightData.length} flight results from API call (after filtering)`);
                    }
                  }
                  
                  apiCalls.push({
                    apiName: functionName,
                    endpoint,
                    requestData: functionArgs,
                    responseData: responseContent
                  });
                } catch (e) {
                  console.error('Error parsing tool result content:', e);
                }
              }
            } catch (e) {
              console.error('Error processing tool call:', e);
            }
          }
        }
      }
      
      // If no API calls found through tool_calls, try to find them directly in the content
      if (apiCalls.length === 0 && responseData.choices[0].message.content) {
        console.log('No API calls found via tool_calls, searching in content');
        const content = responseData.choices[0].message.content;
        
        // Look for API call patterns in the content - without using 's' flag (ES2018)
        const apiPattern = /API call: (search\w+)[\s\S]*?Parameters: ({[\s\S]*?})[\s\S]*?Response: ({[\s\S]*?})/g;
        const matches = [...content.matchAll(apiPattern)];
        
        for (const match of matches) {
          try {
            const functionName = match[1];
            const functionArgs = JSON.parse(match[2]);
            const responseContent = JSON.parse(match[3]);
            
            console.log('Found API call in content:', functionName);
            
            // Extract flight results if this is a flight search
            if (functionName === 'searchFlights' && responseContent && responseContent.data) {
              // Filter out flights with carrier code 6X
              const flightData = responseContent.data.filter((item: any) => {
                // Check each flight's carrier codes
                if (item.type === 'flight-offer') {
                  // Check if any segment in any itinerary has carrier code 6X
                  const has6XCarrier = item.itineraries?.some((itinerary: any) => 
                    itinerary.segments?.some((segment: any) => 
                      segment.carrierCode === '6X'
                    )
                  );
                  
                  // Only include flights that don't have carrier code 6X
                  return !has6XCarrier;
                }
                return false;
              });
              
              if (flightData && flightData.length > 0) {
                setFlightResults(flightData);
                setResultType('flights');
                console.log(`Found ${flightData.length} flight results from API call content (after filtering)`);
              }
            }
            
            // Map function name to endpoint
            let endpoint = '';
            switch (functionName) {
              case 'searchFlights':
                endpoint = '/v2/shopping/flight-offers';
                break;
              case 'searchHotelsByCity':
                endpoint = '/v1/reference-data/locations/hotels/by-city';
                break;
              case 'searchHotelsByGeocode':
                endpoint = '/v1/reference-data/locations/hotels/by-geocode';
                break;
              case 'searchActivities':
                endpoint = '/v1/shopping/activities';
                break;
              case 'searchTransfers':
                endpoint = '/v1/shopping/transfer-offers';
                break;
              default:
                endpoint = `Amadeus API: ${functionName}`;
            }
            
            apiCalls.push({
              apiName: functionName,
              endpoint,
              requestData: functionArgs,
              responseData: responseContent
            });
          } catch (e) {
            console.error('Error parsing API call from content:', e);
          }
        }
      }
    }
    
    console.log('Extracted API calls:', apiCalls);
    return apiCalls;
  };

  // Handle user input submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Clear previous results if this is a new query
    if (input.toLowerCase().includes('reset') || 
        input.toLowerCase().includes('start over') || 
        input.toLowerCase().includes('new trip') ||
        input.toLowerCase().includes('different trip')) {
      
      // Reset the conversation
      setMessages([]);
      setTravelResults(null);
      setFlightResults(null);
      setActivityResults(null);
      setTransferResults(null);
      setResultType(null);
      
      // Set input to the reset message and process it normally
      setInput("Let's start a new trip planning session.");
      
      // Call handleSubmit again with the new input (after a short delay to allow state update)
      setTimeout(() => {
        handleSubmit(e);
      }, 100);
      
      return;
    }
    
    // Clear results if this appears to be a completely new request
    if (input.length > 20 && // Only consider substantive messages
        !input.toLowerCase().includes('show me') && // Exclude "show me more" type requests
        !input.toLowerCase().includes('tell me more') &&
        !input.toLowerCase().includes('can you explain') &&
        !input.toLowerCase().includes('more information') &&
        !input.toLowerCase().startsWith('what about') &&
        !input.toLowerCase().startsWith('how about')) {
      
      // Only reset results if we detect a totally new request
      // This is a heuristic that could be improved
      if (flightResults || activityResults || transferResults || resultType) {
        setTravelResults(null);
        setFlightResults(null);
        setActivityResults(null);
        setTransferResults(null);
        setResultType(null);
      }
    }

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
      id: Date.now().toString(),
    };

    // Add assistant loading message
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      id: (Date.now() + 1).toString(),
      isStreaming: true,
      showApiDetails: false,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
    setIsLoading(true);
    setIsProcessing(true);
    
    // Set initial detailed processing step with AI reasoning
    const initialProcessingStep = `Analyzing request: "${input.length > 80 ? input.substring(0, 80) + '...' : input}"
I need to determine what travel information the user is seeking. This will help me decide which API to call (flights, hotels, activities, or transfers).`;
    
    setProcessingSteps([initialProcessingStep]);

    try {
      // Prepare request data
      const requestData = {
        messages: [...messages, userMessage].map(({ role, content }) => ({
          role,
          content,
        })),
      };

      // Add API call step
      setProcessingSteps(prev => [...prev, `Now I'm evaluating the user query and the conversation context to understand what travel needs they have. This step involves analyzing any destination mentions, dates, or specific preferences to formulate a proper API request.`]);

      // Call API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const responseData = await response.json();
      
      // Process response data
      let responseMessage = responseData.choices[0].message.content;
      
      // Add response received step with reasoning
      setProcessingSteps(prev => [...prev, `Based on the query, I need to gather detailed travel information. This might include checking available flights, hotel options, activities, or transfers depending on what the user asked about. I'll identify the entities in the request and prepare the appropriate search parameters.`]);
      
      // Extract Amadeus API calls
      const amadeusApiCalls = extractAmadeusApiCalls(responseData);
      
      // Add API call steps for each Amadeus call with detailed reasoning
      amadeusApiCalls.forEach(call => {
        let reasoningStep = '';
        
        switch(call.apiName) {
          case 'searchFlights':
            reasoningStep = `The user is interested in flight options ${call.requestData.originLocationCode ? `from ${call.requestData.originLocationCode}` : ''} ${call.requestData.destinationLocationCode ? `to ${call.requestData.destinationLocationCode}` : ''}. I'll search for available flights ${call.requestData.departureDate ? `departing on ${call.requestData.departureDate}` : ''} ${call.requestData.returnDate ? `and returning on ${call.requestData.returnDate}` : ''}. I need to filter out results from non-operational airlines and prioritize options that match the user's preferences.`;
            break;
            
          case 'searchHotelsByCity':
            reasoningStep = `Looking for accommodations in ${call.requestData.cityCode || 'the specified city'}. I'll filter the results based on the user's preferences ${call.requestData.ratings ? `for ${call.requestData.ratings.replace(/,/g, '-')} star hotels` : ''} ${call.requestData.amenities ? `with amenities like ${call.requestData.amenities.replace(/,/g, ', ')}` : ''}. This will provide suitable lodging options for their trip.`;
            break;
            
          case 'searchHotelsByGeocode':
            reasoningStep = `Searching for hotels near coordinates (${call.requestData.latitude}, ${call.requestData.longitude}). This location-based search will find accommodation options within ${call.requestData.radius || 'a reasonable'} km radius of the specified point, which should give the user good options near their desired location.`;
            break;
            
          case 'searchActivities':
            reasoningStep = `Finding activities and attractions near coordinates (${call.requestData.latitude}, ${call.requestData.longitude}) within a ${call.requestData.radius || '20'} km radius. This will help the user discover things to do at their destination, including tours, experiences, and tourist attractions.`;
            break;
            
          case 'searchTransfers':
            reasoningStep = `Searching for transportation options ${call.requestData.startLocationCode ? `from ${call.requestData.startLocationCode}` : ''} ${call.requestData.endLocationCode ? `to ${call.requestData.endLocationCode}` : ''}. This will provide the user with options for getting between locations, such as airport transfers or city transportation.`;
            break;
            
          default:
            reasoningStep = `Performing a ${call.apiName} search with the parameters extracted from the user's request. This will provide relevant travel information that matches their specific needs.`;
        }
        
        setProcessingSteps(prev => [...prev, reasoningStep]);
      });
      
      // Also directly extract any API calls included in the response metadata
      let directApiCalls: AmadeusApiCall[] = [];
      if (responseData.apiCalls && Array.isArray(responseData.apiCalls)) {
        directApiCalls = responseData.apiCalls;
        directApiCalls.forEach(call => {
          let callDescription = `I'm using the ${call.apiName} API to retrieve real-time travel data that matches the user's request. This will give them accurate, up-to-date information for their travel planning.`;
          setProcessingSteps(prev => [...prev, callDescription]);
        });
      }
      
      // Combine both sources of API calls, prioritizing direct API calls
      const combinedApiCalls = [...directApiCalls];
      
      // Only add API calls from extraction if they're not already in direct calls
      amadeusApiCalls.forEach(call => {
        if (!combinedApiCalls.some(existingCall => 
          existingCall.apiName === call.apiName && 
          JSON.stringify(existingCall.requestData) === JSON.stringify(call.requestData)
        )) {
          combinedApiCalls.push(call);
        }
      });
      
      console.log('Final combined API calls:', combinedApiCalls);
      
      // Check for travel results in the response
      const resultsMatch = responseMessage.match(/```json\n([\s\S]*?)\n```/);
      
      if (resultsMatch && resultsMatch[1]) {
        try {
          const parsedResults = JSON.parse(resultsMatch[1]);
          
          // Determine if these are flight results or other types
          const parsedArray = Array.isArray(parsedResults) ? parsedResults : [parsedResults];
          
          // Filter results based on type
          if (parsedArray.length > 0 && parsedArray[0]?.type === 'flight-offer') {
            // Filter out flights with carrier code 6X
            const filteredResults = parsedArray.filter((item: any) => {
              // Check if any segment in any itinerary has carrier code 6X
              const has6XCarrier = item.itineraries?.some((itinerary: any) => 
                itinerary.segments?.some((segment: any) => 
                  segment.carrierCode === '6X'
                )
              );
              
              // Only include flights that don't have carrier code 6X
              return !has6XCarrier;
            });
            
            console.log(`Setting flight results: ${filteredResults.length} flights found`);
            setFlightResults(filteredResults);
            setResultType('flights');
            console.log(`Found ${filteredResults.length} flight results (after filtering out 6X carriers)`);
            
            // Replace JSON response in message with summary
            const flightSummary = `✈️ I found ${filteredResults.length} flight options. You can view the details in the sidebar.`;
            responseMessage = responseMessage.replace(/```json\n[\s\S]*?\n```/, flightSummary);
          } 
          // Check if these are activity results
          else if (parsedArray.length > 0 && parsedArray[0]?.type === 'activity') {
            console.log(`Setting activity results: ${parsedArray.length} activities found`);
            setActivityResults(parsedArray);
            setResultType('activities');
            
            // Replace JSON response in message with summary
            const activitySummary = `🏞️ I found ${parsedArray.length} activities matching your criteria. You can view the details in the sidebar.`;
            responseMessage = responseMessage.replace(/```json\n[\s\S]*?\n```/, activitySummary);
          }
          // Check if these are transfer results
          else if (parsedArray.length > 0 && parsedArray[0]?.type === 'transfer-offer') {
            console.log(`Setting transfer results: ${parsedArray.length} transfers found`);
            setTransferResults(parsedArray);
            setResultType('transfers');
            
            // Replace JSON response in message with summary
            const transferSummary = `🚕 I found ${parsedArray.length} transfer options matching your criteria. You can view the details in the sidebar.`;
            responseMessage = responseMessage.replace(/```json\n[\s\S]*?\n```/, transferSummary);
          }
          else {
            setTravelResults(parsedArray);
            setResultType(parsedArray[0]?.type || 'generic');
            console.log(`Found ${parsedArray.length} results of type ${parsedArray[0]?.type || 'generic'}`);
            
            // If these are hotel results, replace JSON with summary
            if (parsedArray[0]?.hotelId || (parsedArray[0]?.name && parsedArray[0]?.geoCode) || parsedArray[0]?.chainCode) {
              const hotelSummary = `🏨 I found ${parsedArray.length} hotels matching your criteria. You can view the details in the sidebar.`;
              responseMessage = responseMessage.replace(/```json\n[\s\S]*?\n```/, hotelSummary);
            }
          }
          
          // Add processing step for results
          setProcessingSteps(prev => [
            ...prev, 
            `Found results after filtering`
          ]);
        } catch (error) {
          console.error('Error parsing JSON results:', error);
        }
      }

      // Also extract flight results from API calls if they exist
      if (!flightResults) {
        combinedApiCalls.forEach(apiCall => {
          if (apiCall.apiName === 'searchFlights' && 
              apiCall.responseData && 
              apiCall.responseData.data && 
              Array.isArray(apiCall.responseData.data)) {
            
            // Filter out flights with carrier code 6X
            const flightData = apiCall.responseData.data.filter((item: any) => {
              if (item.type === 'flight-offer') {
                const has6XCarrier = item.itineraries?.some((itinerary: any) => 
                  itinerary.segments?.some((segment: any) => 
                    segment.carrierCode === '6X'
                  )
                );
                return !has6XCarrier;
              }
              return false;
            });
            
            if (flightData && flightData.length > 0) {
              console.log(`Setting flight results from API calls: ${flightData.length} flights found`);
              setFlightResults(flightData);
              setResultType('flights');
              
              // Replace JSON response in message with summary
              const flightSummary = `✈️ I found ${flightData.length} flight options. You can view the details in the sidebar.`;
              responseMessage = responseMessage.replace(/```json\n[\s\S]*?\n```/, flightSummary);
            }
          }
        });
      }

      // Also extract hotel results from API calls if they exist
      if (!travelResults) {
        combinedApiCalls.forEach(apiCall => {
          if ((apiCall.apiName === 'searchHotelsByCity' || apiCall.apiName === 'searchHotelsByGeocode') && 
              apiCall.responseData && 
              apiCall.responseData.data && 
              Array.isArray(apiCall.responseData.data)) {
            
            const hotelData = apiCall.responseData.data;
            
            if (hotelData && hotelData.length > 0) {
              console.log(`Setting hotel results from API calls: ${hotelData.length} hotels found`);
              setTravelResults(hotelData);
              setResultType('hotel');
              
              // Replace JSON response in message with summary
              const hotelSummary = `🏨 I found ${hotelData.length} hotels matching your criteria. You can view the details in the sidebar.`;
              responseMessage = responseMessage.replace(/```json\n[\s\S]*?\n```/, hotelSummary);
            }
          }
        });
      }

      // Extract activity results from API calls if they exist
      if (!activityResults) {
        combinedApiCalls.forEach(apiCall => {
          if (apiCall.apiName === 'searchActivities' && 
              apiCall.responseData && 
              apiCall.responseData.data && 
              Array.isArray(apiCall.responseData.data)) {
            
            const activityData = apiCall.responseData.data.map((activity: any) => ({
              ...activity,
              type: 'activity' // Ensure type is set for detection
            }));
            
            if (activityData && activityData.length > 0) {
              console.log(`Setting activity results from API calls: ${activityData.length} activities found`);
              setActivityResults(activityData);
              setResultType('activities');
              
              // Replace JSON response in message with summary
              const activitySummary = `🏞️ I found ${activityData.length} activities matching your criteria. You can view the details in the sidebar.`;
              responseMessage = responseMessage.replace(/```json\n[\s\S]*?\n```/, activitySummary);
            }
          }
        });
      }

      // Extract transfer results from API calls if they exist
      if (!transferResults) {
        combinedApiCalls.forEach(apiCall => {
          if (apiCall.apiName === 'searchTransfers' && 
              apiCall.responseData && 
              apiCall.responseData.data && 
              Array.isArray(apiCall.responseData.data)) {
            
            const transferData = apiCall.responseData.data.map((transfer: any) => ({
              ...transfer,
              type: 'transfer-offer' // Ensure type is set for detection
            }));
            
            if (transferData && transferData.length > 0) {
              console.log(`Setting transfer results from API calls: ${transferData.length} transfers found`);
              setTransferResults(transferData);
              setResultType('transfers');
              
              // Replace JSON response in message with summary
              const transferSummary = `🚕 I found ${transferData.length} transfer options matching your criteria. You can view the details in the sidebar.`;
              responseMessage = responseMessage.replace(/```json\n[\s\S]*?\n```/, transferSummary);
            }
          }
        });
      }

      // Update assistant message with combined API calls
      const newMessage = {
        ...assistantMessage,
        content: responseMessage,
        isStreaming: false,
        amadeusApiCalls: combinedApiCalls.length > 0 ? combinedApiCalls : undefined,
        showApiDetails: false
      };

      // Check if this is a query about a specific flight or hotel that we have data for
      if (flightResults || travelResults || activityResults) {
        // Instead of regex, use OpenAI to determine intent
        try {
          // Add processing step for intent detection
          setProcessingSteps(prev => [...prev, 'Using AI to determine query intent']);
          
          // Create an intent detection prompt
          const intentPrompt = `
You are an intent detection system for a travel agent application. Analyze the following user query and determine what they're asking about:

User query: "${input}"

Available context:
${flightResults ? `- We have flight search results (${flightResults.length} flights)` : ''}
${travelResults ? `- We have hotel search results (${travelResults.length} hotels)` : ''}
${activityResults ? `- We have activity search results (${activityResults.length} activities)` : ''}

Determine the primary intent of this query. Respond with ONLY one of these categories:
1. "SPECIFIC_FLIGHT" - If the user is asking about a specific flight (e.g., details about a carrier's flight number)
2. "SPECIFIC_HOTEL" - If the user is asking about a specific hotel (e.g., amenities at a named hotel)
3. "SPECIFIC_ACTIVITY" - If the user is asking about a specific activity (e.g., details about a named tour or attraction)
4. "OTHER" - If the query doesn't match the above categories

If the intent is SPECIFIC_FLIGHT, also specify the carrier code and flight number.
If the intent is SPECIFIC_HOTEL, also specify the hotel name.
If the intent is SPECIFIC_ACTIVITY, also specify the activity name or ID.

Response format:
{
  "intent": "SPECIFIC_FLIGHT|SPECIFIC_HOTEL|SPECIFIC_ACTIVITY|OTHER",
  "carrierCode": "XX", (only for SPECIFIC_FLIGHT)
  "flightNumber": "1234", (only for SPECIFIC_FLIGHT)
  "hotelName": "Hotel Name", (only for SPECIFIC_HOTEL)
  "activityName": "Activity Name" (only for SPECIFIC_ACTIVITY)
}
`;

          const intentResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: 'You are a helpful AI assistant that determines user intent for a travel agent application.'
                },
                {
                  role: 'user',
                  content: intentPrompt
                }
              ]
            }),
          });
          
          if (intentResponse.ok) {
            const intentData = await intentResponse.json();
            if (intentData.choices && intentData.choices[0] && intentData.choices[0].message) {
              const intentContent = intentData.choices[0].message.content;
              // Parse the JSON response to get the intent
              try {
                const parsedIntent = JSON.parse(intentContent);
                console.log('Detected intent:', parsedIntent);
                
                // Handle specific flight intent
                if (parsedIntent.intent === "SPECIFIC_FLIGHT" && flightResults && parsedIntent.carrierCode && parsedIntent.flightNumber) {
                  const carrierCode = parsedIntent.carrierCode.toUpperCase();
                  const flightNumber = parsedIntent.flightNumber;
                  
                  // Find the specific flight in results
                  const specificFlight = flightResults.find((flight: any) => {
                    if (flight.itineraries && flight.itineraries.length > 0) {
                      return flight.itineraries.some((itinerary: any) => {
                        if (itinerary.segments && itinerary.segments.length > 0) {
                          return itinerary.segments.some((segment: any) => 
                            segment.carrierCode === carrierCode && 
                            segment.number === flightNumber
                          );
                        }
                        return false;
                      });
                    }
                    return false;
                  });
                  
                  if (specificFlight) {
                    console.log('Found specific flight:', specificFlight);
                    
                    // Enhanced response should include flight details
                    const enhancedPrompt = `I will search through our flight data for detailed information about ${carrierCode} flight ${flightNumber}.

Flight details from our database:
${JSON.stringify(specificFlight, null, 2)}

Using this information, provide a detailed and helpful response about this flight, including any available information about baggage allowance, meal options, in-flight entertainment, and airport information. If certain specific details aren't available in our database, provide general information about the airline's typical policies.`;
                    
                    // Add processing step for specific flight
                    setProcessingSteps(prev => [
                      ...prev, 
                      `Enhancing response with specific flight information for ${carrierCode} ${flightNumber}`
                    ]);
                    
                    try {
                      // Call API for enhanced response
                      const enhancedResponse = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          messages: [
                            {
                              role: 'system',
                              content: 'You are a travel assistant providing detailed flight information.'
                            },
                            {
                              role: 'user',
                              content: enhancedPrompt
                            }
                          ]
                        }),
                      });
                      
                      if (enhancedResponse.ok) {
                        const enhancedData = await enhancedResponse.json();
                        if (enhancedData.choices && enhancedData.choices[0] && enhancedData.choices[0].message) {
                          // Replace generic response with detailed flight information
                          newMessage.content = enhancedData.choices[0].message.content;
                        }
                      }
                    } catch (error) {
                      console.error('Error getting enhanced flight details:', error);
                      // Continue with original response if enhancement fails
                    }
                  }
                }
                
                // Handle specific hotel intent
                if (parsedIntent.intent === "SPECIFIC_HOTEL" && travelResults && parsedIntent.hotelName) {
                  const hotelNameQuery = parsedIntent.hotelName.trim();
                  
                  // Find the specific hotel in results using fuzzy matching
                  const potentialHotels = travelResults.filter((hotel: any) => {
                    if (!hotel.name) return false;
                    
                    // Simple fuzzy matching
                    const hotelName = hotel.name.toLowerCase();
                    const query = hotelNameQuery.toLowerCase();
                    
                    // Check if query is contained in hotel name or vice versa
                    return hotelName.includes(query) || query.includes(hotelName);
                  });
                  
                  if (potentialHotels.length > 0) {
                    // Use the first match
                    const specificHotel = potentialHotels[0];
                    console.log('Found specific hotel:', specificHotel);
                    
                    // Enhanced response should include hotel details
                    const enhancedPrompt = `I will search through our hotel data for detailed information about "${specificHotel.name}".

Hotel details from our database:
${JSON.stringify(specificHotel, null, 2)}

Using this information, provide a detailed and helpful response about this hotel, including information about its location, amenities, nearby attractions, and other relevant details. If certain specific details aren't available in our database, provide general information about hotels in this area or chain.`;
                    
                    // Add processing step for specific hotel
                    setProcessingSteps(prev => [
                      ...prev, 
                      `Enhancing response with specific hotel information for ${specificHotel.name}`
                    ]);
                    
                    try {
                      // Call API for enhanced response
                      const enhancedResponse = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          messages: [
                            {
                              role: 'system',
                              content: 'You are a travel assistant providing detailed hotel information.'
                            },
                            {
                              role: 'user',
                              content: enhancedPrompt
                            }
                          ]
                        }),
                      });
                      
                      if (enhancedResponse.ok) {
                        const enhancedData = await enhancedResponse.json();
                        if (enhancedData.choices && enhancedData.choices[0] && enhancedData.choices[0].message) {
                          // Replace generic response with detailed hotel information
                          newMessage.content = enhancedData.choices[0].message.content;
                        }
                      }
                    } catch (error) {
                      console.error('Error getting enhanced hotel details:', error);
                      // Continue with original response if enhancement fails
                    }
                  }
                }

                // Handle specific activity intent
                if (parsedIntent.intent === "SPECIFIC_ACTIVITY" && activityResults && parsedIntent.activityName) {
                  const activityName = parsedIntent.activityName.toLowerCase();
                  
                  // Find the specific activity in results by name (using fuzzy matching)
                  const specificActivity = activityResults.find((activity: any) => {
                    if (activity.name) {
                      return activity.name.toLowerCase().includes(activityName) || 
                             (activity.id && activity.id.toLowerCase() === activityName);
                    }
                    return false;
                  });
                  
                  if (specificActivity) {
                    console.log('Found specific activity:', specificActivity);
                    
                    // Enhanced response should include activity details
                    const enhancedPrompt = `I will search through our activity data for detailed information about "${activityName}".

Activity details from our database:
${JSON.stringify(specificActivity, null, 2)}

Using this information, provide a detailed and helpful response about this activity, including any available information about description, price, rating, location, duration, and availability. If certain specific details aren't available in our database, provide general information about similar activities in the area.`;
                    
                    // Add processing step for specific activity
                    setProcessingSteps(prev => [
                      ...prev, 
                      `Enhancing response with specific activity information for "${activityName}"`
                    ]);
                    
                    try {
                      // Call API for enhanced response
                      const enhancedResponse = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          messages: [
                            {
                              role: 'system',
                              content: 'You are a travel assistant providing detailed activity information.'
                            },
                            {
                              role: 'user',
                              content: enhancedPrompt
                            }
                          ]
                        }),
                      });
                      
                      if (enhancedResponse.ok) {
                        const enhancedData = await enhancedResponse.json();
                        if (enhancedData.choices && enhancedData.choices[0] && enhancedData.choices[0].message) {
                          // Replace generic response with detailed activity information
                          newMessage.content = enhancedData.choices[0].message.content;
                        }
                      }
                    } catch (error) {
                      console.error('Error getting enhanced activity details:', error);
                      // Continue with original response if enhancement fails
                    }
                  }
                }
              } catch (error) {
                console.error('Error parsing intent response:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error with intent detection:', error);
        }
      }

      // Once processing is complete, add a summary step
      setTimeout(() => {
        setProcessingSteps(prev => [
          ...prev, 
          `Now I'll formulate a response that helps the user make informed travel decisions. I'll present the most relevant options first, highlight important details like prices and times, and suggest next steps in their travel planning process.`
        ]);
        setIsProcessing(false);
      }, 500);

      // Update assistant message with API response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: responseMessage,
                isStreaming: false,
                showApiDetails: combinedApiCalls.length > 0,
                apiCalls: combinedApiCalls,
              }
            : msg
        )
      );
      
      // Add final callback after everything is complete
      setTimeout(() => {
        // Scroll to the bottom after a brief delay
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Error fetching chat response:', error);
      
      // Update assistant message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: 'Sorry, there was an error processing your request. Please try again.',
                isStreaming: false,
              }
            : msg
        )
      );
      
      setIsProcessing(false);
      setProcessingSteps(prev => [...prev, 'Error occurred!']);
    } finally {
      setIsLoading(false);
    }
  };

  const findPreviousUserMessage = (currentMessageId: string): string => {
    const currentIndex = messages.findIndex(m => m.id === currentMessageId);
    if (currentIndex <= 0) return '';
    
    // Find the most recent user message before the current message
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        return messages[i].content;
      }
    }
    return '';
  };

  const UserMessage = ({ message }: { message: Message }) => (
    <div className="flex items-start gap-2.5 sm:gap-4">
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <FiUser className="h-4 w-4 text-neutral-500" />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="prose prose-neutral dark:prose-invert">
          <p>{message.content}</p>
        </div>
      </div>
    </div>
  );

  const AssistantMessage = ({ message }: { message: Message }) => (
    <div className="flex items-start gap-2.5 sm:gap-4">
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <BsRobot className="h-4 w-4 text-neutral-500" />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="prose prose-neutral dark:prose-invert">
          {message.isStreaming ? (
            <p>
              {message.content}
              <span className="ml-1 animate-pulse">▍</span>
            </p>
          ) : (
            <p>{message.content}</p>
          )}
        </div>
        {message.amadeusApiCalls && message.amadeusApiCalls.length > 0 && (
          <TravelResults 
            results={message.amadeusApiCalls} 
            onClose={() => {}} 
          />
        )}
      </div>
    </div>
  );
  
  const ApiCallMessage = ({ message, type }: { message: Message; type: MessageType }) => {
    const [expanded, setExpanded] = useState(false);
    
    if (message.apiName && message.endpoint) {
      return (
        <div className="relative flex flex-col gap-2 pb-4">
          {type === 'user' && (
            <UserMessage message={message} />
          )}
          
          {type === 'assistant' && (
            <>
              <AssistantMessage message={message} />
              <div className="mt-2 flex w-full flex-col rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                <button
                  className="flex items-center justify-between p-3 text-left text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  onClick={() => setExpanded(!expanded)}
                >
                  <span className="flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    Show your work
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
                
                {expanded && (
                  <div className="p-3 pt-0">
                    <ApiCallDetails
                      apiName={message.apiName || "Unknown API"}
                      endpoint={message.endpoint || "Unknown endpoint"}
                      requestData={message.requestData || { error: "No request data available" }}
                      responseData={message.responseData || { error: "No response data available" }}
                      isLoading={message.isStreaming}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    return type === 'user' ? (
      <UserMessage message={message} />
    ) : (
      <AssistantMessage message={message} />
    );
  };

  function isTravelRelatedMessage(message: string): boolean {
    const travelTerms = [
      'flight', 'hotel', 'book', 'travel', 'trip', 'vacation', 'journey', 
      'ticket', 'airline', 'airport', 'destination', 'tour', 'activity',
      'reservation', 'transfer', 'car', 'rental', 'transportation'
    ];
    
    const messageLower = message.toLowerCase();
    return travelTerms.some(term => messageLower.includes(term));
  }

  // Handle a request for more flight details
  const handleFlightDetailsRequest = (flightId: string) => {
    // Find the flight in the flightResults array
    const selectedFlight = flightResults?.find(flight => flight.id === flightId);
    
    if (!selectedFlight) {
      setInput(`Can you tell me more details about flight with ID ${flightId}?`);
      return;
    }
    
    // Extract detailed flight information
    const itineraries = selectedFlight.itineraries || [];
    const price = selectedFlight.price?.total 
      ? `${selectedFlight.price.total} ${selectedFlight.price.currency || 'USD'}`
      : 'Price not available';
    
    // Create a detailed flight summary from API data
    let flightSummary = "";
    
    // Process each itinerary (outbound, return, etc.)
    itineraries.forEach((itinerary: any, itineraryIndex: number) => {
      const segments = itinerary?.segments || [];
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];
      
      const mainCarrierCode = firstSegment?.carrierCode || '';
      const mainFlightNumber = firstSegment?.number || '';
      const departureCode = firstSegment?.departure?.iataCode || '';
      const departureTime = firstSegment?.departure?.at 
        ? new Date(firstSegment.departure.at).toLocaleString() 
        : 'Unknown departure time';
      const arrivalCode = lastSegment?.arrival?.iataCode || '';
      const arrivalTime = lastSegment?.arrival?.at 
        ? new Date(lastSegment.arrival.at).toLocaleString() 
        : 'Unknown arrival time';
      const stops = segments.length - 1;
      
      // Route description with connection points
      let routeDescription = `from ${departureCode} to ${arrivalCode}`;
      let connectionDetails = "";
      
      if (stops > 0) {
        const connectionPoints = segments.map((segment: any, index: number) => {
          if (index === segments.length - 1) return null;
          
          const nextSegment = segments[index + 1];
          const connectionCode = segment?.arrival?.iataCode || '';
          const connectionArrival = segment?.arrival?.at 
            ? new Date(segment.arrival.at).toLocaleString() 
            : 'Unknown';
          const connectionDeparture = nextSegment?.departure?.at 
            ? new Date(nextSegment.departure.at).toLocaleString() 
            : 'Unknown';
          const layoverDuration = segment?.arrival?.at && nextSegment?.departure?.at
            ? calculateLayoverDuration(segment.arrival.at, nextSegment.departure.at)
            : 'Unknown layover duration';
          
          connectionDetails += `\n- Layover in ${connectionCode} (${layoverDuration}): Arrive at ${connectionArrival}, depart at ${connectionDeparture}`;
          return connectionCode;
        }).filter(Boolean);
        
        routeDescription += ` with connection${stops > 1 ? 's' : ''} in ${connectionPoints.join(' and ')}`;
      }
      
      flightSummary += `${itineraryIndex === 0 ? 'Outbound' : 'Return'} Flight: ${mainCarrierCode} ${mainFlightNumber} ${routeDescription}\n`;
      flightSummary += `Departure: ${departureTime} from ${departureCode}\n`;
      flightSummary += `Arrival: ${arrivalTime} at ${arrivalCode}\n`;
      flightSummary += `Total stops: ${stops}${connectionDetails}\n\n`;
    });
    
    flightSummary += `Total price: ${price}\n`;
    
    // Create a detailed request that includes the specific flight information
    const message = `Here is the flight I'm interested in:\n\n${flightSummary}\n\nCan you tell me more details about this ${selectedFlight.itineraries[0]?.segments[0]?.carrierCode || ''} flight? I'd like to know about the airline's standard policies for baggage allowance, meal options, in-flight entertainment, and any other important information for this journey. Also, please provide any relevant information about the airports involved, including terminal information if available.`;
    
    setInput(message);
  };
  
  // Helper function to calculate layover duration
  const calculateLayoverDuration = (arrivalTime: string, departureTime: string) => {
    try {
      const arrival = new Date(arrivalTime);
      const departure = new Date(departureTime);
      const durationMs = departure.getTime() - arrival.getTime();
      
      // Convert to hours and minutes
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}h ${minutes}m`;
    } catch (e) {
      return "Unknown duration";
    }
  };

  // Handle a request for more hotel details
  const handleHotelDetailsRequest = (hotelId: string, hotelName: string) => {
    // Find the hotel in the travelResults array
    const selectedHotel = travelResults?.find(hotel => 
      (hotel.hotelId === hotelId || hotel.id === hotelId)
    );
    
    if (!selectedHotel) {
      setInput(`Can you tell me more details about ${hotelName} (ID: ${hotelId})?`);
      return;
    }
    
    // Extract detailed hotel information
    const hotelLocation = selectedHotel.address?.cityName || selectedHotel.address?.countryCode || '';
    const coordinates = selectedHotel.geoCode ? 
      `Latitude: ${selectedHotel.geoCode.latitude}, Longitude: ${selectedHotel.geoCode.longitude}` : '';
    const chainCode = selectedHotel.chainCode || '';
    const rating = selectedHotel.rating || '';
    
    // Create a detailed hotel summary
    let hotelSummary = `# ${hotelName}\n\n`;
    hotelSummary += `**Location:** ${hotelLocation}\n`;
    
    if (coordinates) {
      hotelSummary += `**Coordinates:** ${coordinates}\n`;
    }
    
    if (chainCode) {
      hotelSummary += `**Chain:** ${chainCode}\n`;
    }
    
    if (rating) {
      hotelSummary += `**Rating:** ${rating} stars\n`;
    }
    
    if (selectedHotel.distance) {
      hotelSummary += `**Distance from center:** ${selectedHotel.distance.value} ${selectedHotel.distance.unit}\n`;
    }
    
    // Create a detailed request that includes the specific hotel information
    const message = `Here is the hotel I'm interested in:\n\n${hotelSummary}\n\nCan you tell me about ${hotelName}'s specific amenities, room types, and facilities? Also, what are the nearby attractions and transportation options?`;
    
    setInput(message);
  };

  // Handle activity details request
  const handleActivityDetailsRequest = (activityId: string) => {
    // Add a user message about viewing activity details
    const userMessage: Message = {
      role: 'user',
      content: `Show me more details about activity ${activityId}`,
      id: Date.now().toString(),
    };
    
    // Add the assistant message that will be streaming
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      id: (Date.now() + 1).toString(),
      isStreaming: true,
      showApiDetails: false,
    };
    
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);
    setShowProcessing(true);
    setProcessingSteps(['Processing activity details request...']);
    
    // Find the activity from the results
    const activity = activityResults?.find(a => a.id === activityId);
    
    if (activity) {
      // Check if we have enough description information
      if (activity.shortDescription && activity.shortDescription.length > 50) {
        // We have a good description, create a detailed response
        setTimeout(() => {
          const formatCurrency = (amount: number, currencyCode: string) => {
            try {
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              }).format(amount);
            } catch (error) {
              return `${currencyCode} ${amount}`;
            }
          };

          const activityDetails = `
# ${activity.name}

${activity.shortDescription}

${activity.price ? `**Price:** ${formatCurrency(activity.price.amount, activity.price.currencyCode)}` : ''}
${activity.rating ? `**Rating:** ${activity.rating}/5 stars` : ''}
${activity.duration ? `**Duration:** ${activity.duration}` : ''}
${activity.location ? `**Location:** ${activity.location}` : ''}

${activity.geoCode ? `**Address:** ${activity.location || 'Tokyo, Japan'} (${activity.geoCode.latitude}, ${activity.geoCode.longitude})` : ''}

${activity.bookingLink ? `[**Book this experience**](${activity.bookingLink})` : ''}

Let me know if you have any questions about this activity!
          `.trim();
          
          setMessages((prev) => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: activityDetails, isStreaming: false } 
              : msg
          ));
          
          setIsLoading(false);
          setShowProcessing(false);
        }, 1000);
      } else {
        // We need more detailed information, use OpenAI to enhance the description
        setProcessingSteps(prev => [...prev, 'Enhancing activity description...']);
        
        // Create a prompt for OpenAI to enhance the description
        const enhancementPrompt = `
I need to provide detailed information about the following activity in Japan:

Name: ${activity.name}
${activity.shortDescription ? `Brief Description: ${activity.shortDescription}` : ''}
${activity.price ? `Price: ${activity.price.amount} ${activity.price.currencyCode}` : ''}
${activity.location ? `Location: ${activity.location}` : ''}

Please provide a detailed, engaging description of this activity (in 2-3 paragraphs), assuming it's a tourist experience in Japan. 
Explain what makes this activity special, what visitors can expect, and any cultural context that would be helpful.
If it's a food tour or culinary experience, describe the typical foods that might be included and the dining atmosphere.
Do not include information about booking, just focus on describing the experience itself.
`;

        // Call OpenAI for an enhanced description
        fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: 'You are a travel expert specializing in Japanese tourism and culture. Your task is to provide detailed, accurate, and engaging descriptions of activities in Japan.'
              },
              {
                role: 'user',
                content: enhancementPrompt
              }
            ]
          }),
        })
        .then(response => response.json())
        .then(data => {
          const enhancedDescription = data.choices[0].message.content;
          
          const formatCurrency = (amount: number, currencyCode: string) => {
            try {
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              }).format(amount);
            } catch (error) {
              return `${currencyCode} ${amount}`;
            }
          };

          // Combine the enhanced description with the activity data
          const activityDetails = `
# ${activity.name}

${enhancedDescription}

${activity.price ? `**Price:** ${formatCurrency(activity.price.amount, activity.price.currencyCode)}` : ''}
${activity.rating ? `**Rating:** ${activity.rating}/5 stars` : ''}
${activity.duration ? `**Duration:** ${activity.duration}` : ''}
${activity.location ? `**Location:** ${activity.location}` : ''}

${activity.geoCode ? `**Address:** ${activity.location || 'Tokyo, Japan'} (${activity.geoCode.latitude}, ${activity.geoCode.longitude})` : ''}

${activity.bookingLink ? `[**Book this experience**](${activity.bookingLink})` : ''}

Let me know if you have any questions about this activity!
          `.trim();
          
          setMessages((prev) => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: activityDetails, isStreaming: false } 
              : msg
          ));
          
          setIsLoading(false);
          setShowProcessing(false);
        })
        .catch(error => {
          console.error('Error enhancing activity description:', error);
          
          // Fallback to basic description if enhancement fails
          const activityDetails = `
# ${activity.name}

${activity.shortDescription || `Experience this wonderful activity in ${activity.location || 'Japan'}.`}

${activity.price ? `**Price:** ${activity.price.amount} ${activity.price.currencyCode}` : ''}
${activity.rating ? `**Rating:** ${activity.rating}/5 stars` : ''}
${activity.location ? `**Location:** ${activity.location}` : ''}

${activity.geoCode ? `**Coordinates:** Latitude ${activity.geoCode.latitude}, Longitude ${activity.geoCode.longitude}` : ''}

${activity.bookingLink ? `[**Book this experience**](${activity.bookingLink})` : ''}

Let me know if you'd like to know more about this activity!
          `.trim();
          
          setMessages((prev) => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: activityDetails, isStreaming: false } 
              : msg
          ));
          
          setIsLoading(false);
          setShowProcessing(false);
        });
      }
    } else {
      // Not found response
      setTimeout(() => {
        const notFoundResponse = `I'm sorry, I couldn't find detailed information for the activity with ID ${activityId}. Would you like me to search for other activities instead?`;
        
        setMessages((prev) => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: notFoundResponse, isStreaming: false } 
            : msg
        ));
        
        setIsLoading(false);
        setShowProcessing(false);
      }, 1000);
    }
  };

  // Handle transfer details request
  const handleTransferDetailsRequest = (transferId: string) => {
    // Add a user message about viewing transfer details
    const userMessage: Message = {
      role: 'user',
      content: `Show me more details about transfer ${transferId}`,
      id: Date.now().toString(),
    };
    
    // Add the assistant message that will be streaming
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      id: (Date.now() + 1).toString(),
      isStreaming: true,
      showApiDetails: false,
    };
    
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);
    setShowProcessing(true);
    setProcessingSteps(['Processing transfer details request...']);
    
    // Find the transfer from the results
    const transfer = transferResults?.find(t => t.id === transferId);
    
    if (transfer) {
      // First get the basic details to prepare
      const formatCurrency = (amount: number | string, currencyCode: string) => {
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        
        try {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          }).format(numericAmount);
        } catch (error) {
          return `${currencyCode} ${numericAmount}`;
        }
      };

      // Format date/time
      const formatDateTime = (dateTimeStr: string) => {
        try {
          const date = new Date(dateTimeStr);
          return date.toLocaleString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit'
          });
        } catch (error) {
          return 'Invalid date';
        }
      };

      // Get locations and other details
      const startLocation = transfer.start?.locationCode || 'Unknown Start';
      const endLocation = transfer.end?.name || transfer.end?.address?.cityName || transfer.end?.locationCode || 'Unknown Destination';
      const vehicleDescription = transfer.vehicle?.description || 'Standard Vehicle';
      
      // Calculate properly summed total
      let calculatedTotal = 0;
      
      // Add base amount
      if (transfer.quotation?.base?.monetaryAmount) {
        calculatedTotal += parseFloat(transfer.quotation.base.monetaryAmount);
      }
      
      // Add taxes
      if (transfer.quotation?.totalTaxes?.monetaryAmount) {
        calculatedTotal += parseFloat(transfer.quotation.totalTaxes.monetaryAmount);
      }
      
      // Subtract discount
      if (transfer.quotation?.discount?.monetaryAmount) {
        calculatedTotal -= parseFloat(transfer.quotation.discount.monetaryAmount);
      }
      
      // Add fees
      if (transfer.quotation?.fees && transfer.quotation.fees.length > 0) {
        calculatedTotal += parseFloat(transfer.quotation.fees[0].monetaryAmount || 0);
      }
      
      const currency = transfer.quotation?.currencyCode || 'USD';
      const totalPrice = formatCurrency(calculatedTotal, currency);
      const transferTime = transfer.start?.dateTime ? formatDateTime(transfer.start.dateTime) : 'Not specified';
      const transferType = transfer.transferType || 'PRIVATE';
      
      // Call OpenAI to enhance the description with additional context
      setProcessingSteps(prev => [...prev, 'Enhancing transfer details...']);
      
      // Prepare request data
      const enhancementRequestData = {
        messages: [
          {
            role: 'system',
            content: `You are a travel assistant providing information about airport transfers. 
                     Add useful context to the following transfer:
                     - From: ${startLocation}
                     - To: ${endLocation}
                     - Vehicle: ${vehicleDescription}
                     - Transfer Type: ${transferType}
                     - Price: ${totalPrice}
                     - Service Provider: ${transfer.serviceProvider?.name || 'Not specified'}
                     
                     Provide a brief paragraph (2-3 sentences) describing what the passenger can expect from this transfer service.
                     Do not repeat the details above. Focus on the experience, convenience, and any notable features.
                     Keep your response concise and informative.`
          },
          {
            role: 'user',
            content: 'Describe this transfer service with additional context.'
          }
        ]
      };
      
      // Call OpenAI for enhanced description
      fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enhancementRequestData),
      })
      .then(response => response.json())
      .then(enhancementData => {
        const enhancedDescription = enhancementData.choices[0]?.message?.content || '';
        
        // Create a detailed transfer summary
        const transferDetails = `
# ${startLocation} → ${endLocation} Transfer

**Departure:** ${transferTime}
**Transfer Type:** ${transferType}
**Vehicle:** ${vehicleDescription}
${transfer.vehicle?.seats && transfer.vehicle.seats.length > 0 ? `**Seats:** ${transfer.vehicle.seats[0].count}` : ''}

${transfer.distance ? `**Distance:** ${transfer.distance.value} ${transfer.distance.unit}` : ''}

**Price:** ${totalPrice}
${transfer.serviceProvider?.name ? `**Service Provider:** ${transfer.serviceProvider.name}` : ''}

${(() => {
  if (transfer.quotation?.base) {
    return `
### Price Breakdown:
- Base Price: ${formatCurrency(transfer.quotation.base.monetaryAmount, currency)}
${transfer.quotation.totalTaxes ? `- Taxes: ${formatCurrency(transfer.quotation.totalTaxes.monetaryAmount, currency)}` : ''}
${transfer.quotation.discount ? `- Discount: -${formatCurrency(transfer.quotation.discount.monetaryAmount, currency)}` : ''}
- **Total: ${totalPrice}**
`;
  }
  return '';
})()}

${enhancedDescription}

Let me know if you have any questions about this transfer service!
        `.trim();
        
        setMessages((prev) => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: transferDetails, isStreaming: false } 
            : msg
        ));
        
        setIsLoading(false);
        setShowProcessing(false);
      })
      .catch(error => {
        console.error('Error calling OpenAI for enhancement:', error);
        
        // Fallback if OpenAI enhancement fails
        const transferDetails = `
# ${startLocation} → ${endLocation} Transfer

**Departure:** ${transferTime}
**Transfer Type:** ${transferType}
**Vehicle:** ${vehicleDescription}
${transfer.vehicle?.seats && transfer.vehicle.seats.length > 0 ? `**Seats:** ${transfer.vehicle.seats[0].count}` : ''}

${transfer.distance ? `**Distance:** ${transfer.distance.value} ${transfer.distance.unit}` : ''}

**Price:** ${totalPrice}
${transfer.serviceProvider?.name ? `**Service Provider:** ${transfer.serviceProvider.name}` : ''}

${(() => {
  if (transfer.quotation?.base) {
    return `
### Price Breakdown:
- Base Price: ${formatCurrency(transfer.quotation.base.monetaryAmount, currency)}
${transfer.quotation.totalTaxes ? `- Taxes: ${formatCurrency(transfer.quotation.totalTaxes.monetaryAmount, currency)}` : ''}
${transfer.quotation.discount ? `- Discount: -${formatCurrency(transfer.quotation.discount.monetaryAmount, currency)}` : ''}
- **Total: ${totalPrice}**
`;
  }
  return '';
})()}

This premium transfer service offers door-to-door convenience between ${startLocation} and ${endLocation}. Your driver will track your flight if arriving at an airport and wait for you if there are delays.

Let me know if you have any questions about this transfer service!
        `.trim();
        
        setMessages((prev) => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: transferDetails, isStreaming: false } 
            : msg
        ));
        
        setIsLoading(false);
        setShowProcessing(false);
      });
    } else {
      // Not found response
      setTimeout(() => {
        const notFoundResponse = `I'm sorry, I couldn't find detailed information for the transfer with ID ${transferId}. Would you like me to search for other transfer options?`;
        
        setMessages((prev) => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: notFoundResponse, isStreaming: false } 
            : msg
        ));
        
        setIsLoading(false);
        setShowProcessing(false);
      }, 1000);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Main chat container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white dark:bg-gray-900 shadow-md p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
              <BsRobot className="text-blue-500 dark:text-blue-400 text-2xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Brainbase Travel Agent</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Amadeus API</p>
            </div>
          </div>
          <TruncationToggle />
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full mb-6">
                <BsRobot className="text-blue-500 dark:text-blue-400 text-6xl" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Welcome to Brainbase Travel Agent</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                I can help you plan your trip by searching for flights, hotels, activities, and transfers.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                {[
                  "I need a flight from NYC to Paris next month",
                  "Find me hotels in Barcelona",
                  "What activities are available in Tokyo?",
                  "I need a transfer from CDG airport to central Paris"
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 
                              text-left p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700
                              transition-colors text-gray-700 dark:text-gray-300"
                    onClick={() => {
                      setInput(suggestion);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((message, idx) => {
            // Find the previous user message to determine context
            const prevUserMessage = idx > 0 ? 
              messages.slice(0, idx).reverse().find(m => m.role === 'user') : null;
            
            // Only show API calls that are relevant to the user's query
            const isRelevant = (apiCall: any, userQuery: string) => {
              if (!userQuery || !apiCall) return false;
              
              // Always show API calls that have errors
              if (apiCall.responseData && (apiCall.responseData.error || apiCall.responseData.message?.includes("error"))) {
                return true;
              }
              
              const query = userQuery.toLowerCase();
              const apiName = apiCall.apiName.toLowerCase();
              
              // Match API call type with query intent
              if (query.includes('flight') && apiName.includes('flight')) return true;
              if ((query.includes('hotel') || query.includes('accommodation') || query.includes('stay')) 
                  && apiName.includes('hotel')) return true;
              if ((query.includes('activit') || query.includes('tour') || query.includes('thing to do'))
                  && apiName.includes('activit')) return true;
              if ((query.includes('transfer') || query.includes('transport') || query.includes('taxi'))
                  && apiName.includes('transfer')) return true;
                  
              return false;
            };
            
            // Show all API calls for this message, not just relevant ones
            // This ensures we always show API calls, whether they're relevant or failed
            const apiCallsToShow = message.amadeusApiCalls || [];
            
            return (
              <div key={message.id}>
                <MessageItem 
                  message={{
                    ...message,
                    hasFlightResults: flightResults !== null && flightResults.length > 0 && !resultType
                  }} 
                  onViewFlightResults={() => {
                    if (flightResults && flightResults.length > 0) {
                      setResultType('flights');
                    }
                  }}
                />
                {message.role === 'assistant' && (
                  <div className="mt-2">
                    <button 
                      onClick={() => {
                        const updatedMessages = messages.map(m => 
                          m.id === message.id ? {...m, showApiDetails: !m.showApiDetails} : m
                        );
                        setMessages(updatedMessages);
                      }}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 p-2 text-sm font-medium text-blue-600 dark:text-blue-400 rounded-lg border border-neutral-200 dark:border-neutral-800 mb-2 flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Code2 className="h-4 w-4" />
                        Show Your Work {apiCallsToShow.length > 0 ? `(${apiCallsToShow.length})` : ""}
                      </div>
                      <div>
                        {message.showApiDetails ? (
                          <ChevronUp className="h-4 w-4 text-neutral-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-neutral-500" />
                        )}
                      </div>
                    </button>
                    {message.showApiDetails && (
                      <div className="space-y-2">
                        {apiCallsToShow.length > 0 ? (
                          apiCallsToShow.map((apiCall, index) => (
                            <div key={index}>
                              <ApiCallDetails
                                apiName={apiCall.apiName || "Unknown API"}
                                endpoint={apiCall.endpoint || "Unknown endpoint"}
                                requestData={apiCall.requestData || { error: "No request data available" }}
                                responseData={apiCall.responseData || { error: "No response data available" }}
                                isLoading={message.isStreaming}
                              />
                            </div>
                          ))
                        ) : (
                          <div className="bg-neutral-50 dark:bg-neutral-900 p-2 rounded border border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center gap-2 mb-1 font-medium text-neutral-700 dark:text-neutral-300">
                              <Code2 className="h-4 w-4 text-blue-500" />
                              <span>No API Calls</span>
                            </div>
                            <div className="text-sm text-neutral-500 dark:text-neutral-400 pl-6">
                              <p>No external data was required for this response. Either:</p>
                              <ul className="list-disc ml-5 mt-1">
                                <li>The AI answered from existing knowledge</li>
                                <li>There was an issue with the travel service</li>
                                <li>The request didn't require external data</li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {processingSteps.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 my-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowProcessingSteps(!showProcessingSteps)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center">
                  {isProcessing && <BiLoaderAlt className="text-blue-500 dark:text-blue-400 text-xl mr-3 animate-spin" />}
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {isProcessing ? 'AI Travel Agent Reasoning...' : 'AI Travel Agent Reasoning'}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${showProcessingSteps ? 'rotate-180' : ''}`} />
              </button>
              
              {showProcessingSteps && (
                <div className="text-sm space-y-4 text-gray-700 dark:text-gray-300 mt-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  {processingSteps.map((step, index) => (
                    <div key={index} className="border-l-2 border-blue-400 dark:border-blue-500 pl-3 py-1">
                      {step}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about flights, hotels, activities or transfers..."
              className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 
                        rounded-l-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 
                        dark:text-white text-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-r-xl px-5 py-3 
                        flex items-center justify-center disabled:opacity-50 transition-colors"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <BiLoaderAlt className="animate-spin" />
              ) : (
                <FiSend />
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* Sidebar buttons - only show when sidebar is hidden */}
      <div className="absolute right-4 top-4 flex space-x-2">
        {flightResults && !showFlightSidebar && (
          <button
            onClick={() => setShowFlightSidebar(true)}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Show flight results"
          >
            <IoAirplaneOutline className="text-blue-500" />
          </button>
        )}
        {travelResults && !showHotelSidebar && (
          <button
            onClick={() => setShowHotelSidebar(true)}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Show hotel results"
          >
            <IoBedOutline className="text-blue-500" />
          </button>
        )}
        {activityResults && !showActivitySidebar && (
          <button
            onClick={() => setShowActivitySidebar(true)}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Show activity results"
          >
            <IoMapOutline className="text-blue-500" />
          </button>
        )}
        {transferResults && !showTransferSidebar && (
          <button
            onClick={() => setShowTransferSidebar(true)}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Show transfer results"
          >
            <IoCarOutline className="text-blue-500" />
          </button>
        )}
      </div>
      
      {/* Sidebars */}
      <div className="fixed right-0 top-0 h-screen flex">
        {showFlightSidebar && flightResults && (
          <FlightResultsSidebar
            results={flightResults}
            onClose={() => setShowFlightSidebar(false)}
            onRequestDetails={handleFlightDetailsRequest}
          />
        )}
        {showHotelSidebar && travelResults && (
          <TravelResults
            results={travelResults}
            onClose={() => setShowHotelSidebar(false)}
            onRequestHotelDetails={handleHotelDetailsRequest}
          />
        )}
        {showActivitySidebar && activityResults && (
          <ActivityResultsSidebar
            results={activityResults}
            onClose={() => setShowActivitySidebar(false)}
            onRequestDetails={handleActivityDetailsRequest}
          />
        )}
        {showTransferSidebar && transferResults && (
          <TransferResultsSidebar
            results={transferResults}
            onClose={() => setShowTransferSidebar(false)}
            onRequestDetails={handleTransferDetailsRequest}
          />
        )}
      </div>
    </div>
  );
} 