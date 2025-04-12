import { type ChatMessage, type Tool } from '@/utils/openai';

// Define tools that will be available to the AI
export const tools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'searchFlights',
      description: 'Search for flights between two locations on specific dates',
      parameters: {
        type: 'object',
        properties: {
          originLocationCode: {
            type: 'string',
            description: 'IATA code of the origin airport (e.g., "LHR" for London Heathrow)'
          },
          destinationLocationCode: {
            type: 'string',
            description: 'IATA code of the destination airport (e.g., "JFK" for New York JFK)'
          },
          departureDate: {
            type: 'string',
            description: 'Departure date in YYYY-MM-DD format'
          },
          returnDate: {
            type: 'string',
            description: 'Return date in YYYY-MM-DD format (optional for one-way flights)'
          },
          adults: {
            type: 'integer',
            description: 'Number of adult passengers (default: 1)'
          },
          children: {
            type: 'integer',
            description: 'Number of child passengers (default: 0)'
          },
          infants: {
            type: 'integer',
            description: 'Number of infant passengers (default: 0)'
          },
          travelClass: {
            type: 'string',
            description: 'Travel class (ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST)'
          },
          nonStop: {
            type: 'boolean',
            description: 'Whether to search for non-stop flights only'
          },
          currencyCode: {
            type: 'string',
            description: 'Currency code for prices (e.g., "USD", "EUR")'
          },
          maxPrice: {
            type: 'integer',
            description: 'Maximum price in the specified currency'
          },
          includedAirlineCodes: {
            type: 'string',
            description: 'Comma-separated list of airline codes to include'
          },
          excludedAirlineCodes: {
            type: 'string',
            description: 'Comma-separated list of airline codes to exclude'
          },
          includedCarrierCodes: {
            type: 'string',
            description: 'Comma-separated list of carrier codes to include'
          },
          excludedCarrierCodes: {
            type: 'string',
            description: 'Comma-separated list of carrier codes to exclude'
          },
          nonStopOnly: {
            type: 'boolean',
            description: 'Whether to return only non-stop flights'
          },
          paymentPolicy: {
            type: 'string',
            description: 'Payment policy (NONE, INSTANT, DEFERRED)'
          },
          viewBy: {
            type: 'string',
            description: 'View by (DURATION, DATE, PRICE, SEATS)'
          },
          sort: {
            type: 'string',
            description: 'Sort order (PRICE, DURATION, OUTBOUND_DEPARTURE, OUTBOUND_ARRIVAL, INBOUND_DEPARTURE, INBOUND_ARRIVAL)'
          }
        },
        required: ['originLocationCode', 'destinationLocationCode', 'departureDate']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'searchHotelsByCity',
      description: 'Search for hotels in a city by IATA code',
      parameters: {
        type: 'object',
        properties: {
          cityCode: {
            type: 'string',
            description: 'IATA code of the city (e.g., "NYC" for New York)'
          },
          amenities: {
            type: 'string',
            description: 'Comma-separated list of amenities (e.g., "SWIMMING_POOL,SPA,WIFI")'
          },
          ratings: {
            type: 'string',
            description: 'Comma-separated list of star ratings (e.g., "3,4,5")'
          },
          radius: {
            type: 'integer',
            description: 'Search radius in kilometers'
          },
          hotelIds: {
            type: 'string',
            description: 'Comma-separated list of hotel IDs'
          },
          latitude: {
            type: 'number',
            description: 'Latitude coordinate'
          },
          longitude: {
            type: 'number',
            description: 'Longitude coordinate'
          },
          radiusUnit: {
            type: 'string',
            description: 'Unit for radius (KM, MI)'
          },
          checkInDate: {
            type: 'string',
            description: 'Check-in date in YYYY-MM-DD format'
          },
          checkOutDate: {
            type: 'string',
            description: 'Check-out date in YYYY-MM-DD format'
          },
          roomQuantity: {
            type: 'integer',
            description: 'Number of rooms'
          },
          priceRange: {
            type: 'string',
            description: 'Price range (e.g., "100-200")'
          },
          paymentPolicy: {
            type: 'string',
            description: 'Payment policy (NONE, INSTANT, DEFERRED)'
          },
          boardType: {
            type: 'string',
            description: 'Board type (ROOM_ONLY, BREAKFAST, HALF_BOARD, FULL_BOARD, ALL_INCLUSIVE)'
          },
          includeClosed: {
            type: 'boolean',
            description: 'Whether to include closed hotels'
          },
          bestRateOnly: {
            type: 'boolean',
            description: 'Whether to return only the best rate'
          },
          view: {
            type: 'string',
            description: 'View type (LIGHT, FULL)'
          },
          sort: {
            type: 'string',
            description: 'Sort order (PRICE, DISTANCE, RATING)'
          }
        },
        required: ['cityCode']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'searchHotelsByGeocode',
      description: 'Search for hotels near specific coordinates',
      parameters: {
        type: 'object',
        properties: {
          latitude: {
            type: 'number',
            description: 'Latitude coordinate'
          },
          longitude: {
            type: 'number',
            description: 'Longitude coordinate'
          },
          radius: {
            type: 'integer',
            description: 'Search radius in kilometers'
          },
          amenities: {
            type: 'string',
            description: 'Comma-separated list of amenities'
          },
          ratings: {
            type: 'string',
            description: 'Comma-separated list of star ratings'
          },
          hotelIds: {
            type: 'string',
            description: 'Comma-separated list of hotel IDs'
          },
          radiusUnit: {
            type: 'string',
            description: 'Unit for radius (KM, MI)'
          },
          checkInDate: {
            type: 'string',
            description: 'Check-in date in YYYY-MM-DD format'
          },
          checkOutDate: {
            type: 'string',
            description: 'Check-out date in YYYY-MM-DD format'
          },
          roomQuantity: {
            type: 'integer',
            description: 'Number of rooms'
          },
          priceRange: {
            type: 'string',
            description: 'Price range (e.g., "100-200")'
          },
          paymentPolicy: {
            type: 'string',
            description: 'Payment policy (NONE, INSTANT, DEFERRED)'
          },
          boardType: {
            type: 'string',
            description: 'Board type (ROOM_ONLY, BREAKFAST, HALF_BOARD, FULL_BOARD, ALL_INCLUSIVE)'
          },
          includeClosed: {
            type: 'boolean',
            description: 'Whether to include closed hotels'
          },
          bestRateOnly: {
            type: 'boolean',
            description: 'Whether to return only the best rate'
          },
          view: {
            type: 'string',
            description: 'View type (LIGHT, FULL)'
          },
          sort: {
            type: 'string',
            description: 'Sort order (PRICE, DISTANCE, RATING)'
          }
        },
        required: ['latitude', 'longitude']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'searchActivities',
      description: 'Search for activities near specific coordinates',
      parameters: {
        type: 'object',
        properties: {
          latitude: {
            type: 'number',
            description: 'Latitude coordinate'
          },
          longitude: {
            type: 'number',
            description: 'Longitude coordinate'
          },
          radius: {
            type: 'integer',
            description: 'Search radius in kilometers'
          },
          category: {
            type: 'string',
            description: 'Activity category'
          }
        },
        required: ['latitude', 'longitude']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'searchTransfers',
      description: 'Search for transfers between locations',
      parameters: {
        type: 'object',
        properties: {
          startLocationCode: {
            type: 'string',
            description: 'IATA code of the start location (e.g., "CDG" for Paris Charles de Gaulle)'
          },
          endLocationCode: {
            type: 'string',
            description: 'IATA code of the end location (e.g., "ORY" for Paris Orly)'
          },
          transferDate: {
            type: 'string',
            description: 'Transfer date in YYYY-MM-DD format'
          },
          transferType: {
            type: 'string',
            description: 'Transfer type (PRIVATE, SHARED)'
          },
          passengers: {
            type: 'integer',
            description: 'Number of passengers'
          },
          stopOvers: {
            type: 'array',
            description: 'Array of stopover locations',
            items: {
              type: 'object',
              properties: {
                duration: {
                  type: 'string',
                  description: 'Duration of stopover (e.g., "PT2H30M")'
                },
                sequenceNumber: {
                  type: 'integer',
                  description: 'Sequence number of the stopover'
                },
                addressLine: {
                  type: 'string',
                  description: 'Address line of the stopover'
                },
                countryCode: {
                  type: 'string',
                  description: 'Country code of the stopover'
                },
                cityName: {
                  type: 'string',
                  description: 'City name of the stopover'
                },
                zipCode: {
                  type: 'string',
                  description: 'ZIP code of the stopover'
                },
                name: {
                  type: 'string',
                  description: 'Name of the stopover location'
                },
                geoCode: {
                  type: 'string',
                  description: 'Geographic coordinates of the stopover'
                },
                stateCode: {
                  type: 'string',
                  description: 'State code of the stopover'
                }
              }
            }
          },
          startConnectedSegment: {
            type: 'object',
            description: 'Connected segment information',
            properties: {
              transportationType: {
                type: 'string',
                description: 'Type of transportation (FLIGHT, TRAIN, etc.)'
              },
              transportationNumber: {
                type: 'string',
                description: 'Transportation number'
              },
              departure: {
                type: 'object',
                properties: {
                  localDateTime: {
                    type: 'string',
                    description: 'Local departure date and time'
                  },
                  iataCode: {
                    type: 'string',
                    description: 'IATA code of departure location'
                  }
                }
              },
              arrival: {
                type: 'object',
                properties: {
                  localDateTime: {
                    type: 'string',
                    description: 'Local arrival date and time'
                  },
                  iataCode: {
                    type: 'string',
                    description: 'IATA code of arrival location'
                  }
                }
              }
            }
          },
          passengerCharacteristics: {
            type: 'array',
            description: 'Array of passenger characteristics',
            items: {
              type: 'object',
              properties: {
                passengerTypeCode: {
                  type: 'string',
                  description: 'Passenger type code (ADT, CHD, INF)'
                },
                age: {
                  type: 'integer',
                  description: 'Age of the passenger'
                }
              }
            }
          }
        },
        required: ['startLocationCode', 'endLocationCode', 'transferDate']
      }
    }
  }
];

// Base system message with primary instructions
export const systemMessage: ChatMessage = {
  role: 'system',
  content: `You are the Brainbase Travel Agent, a helpful travel planning assistant with access to real-time flight, hotel, activity, and transfer information through the Amadeus API.

IMPORTANT DATE INFORMATION: Unless otherwise specified, all dates should use 2025 for the year. The current year is 2025.
If a user mentions "next month" or similar relative dates, always interpret these relative to 2025.
For example, if a user asks for flights "next month", you should search for flights in May 2025.

DISPLAY FORMAT: All prices should be displayed in USD by default with the $ symbol unless the user specifically requests another currency.
For example, say "$99" instead of "99 USD" or "99 dollars".

FLIGHT SEARCH: ALWAYS FILTER OUT RESULTS FROM NON-OPERATIONAL AIRLINES.
Never recommend flights with carrier code 6X, as this is a non-operational airline used for testing.

MULTI-STEP TRIP PLANNING: When a user asks to plan a complete trip:
1. Start by searching and presenting flight options first
2. After showing flight options, ask if they would like to see hotel options at their destination
3. After accommodations, ask if they're interested in activities or attractions
4. Finally, offer transfer options between airports, hotels, and attractions if applicable
5. Guide the user through each step individually rather than overwhelming them with all options at once

This step-by-step approach allows users to make decisions about each component of their trip separately.

SUGGESTED WORKFLOW FOR TRIP PLANNING:
- "Here are some flight options to [destination]. Would you like to proceed with any of these flights?"
- "Great! Now, let's find a place for you to stay. Here are some hotel options in [destination]."
- "Would you be interested in exploring activities or attractions in [destination]?"
- "Would you need transportation from the airport to your hotel?"

AIRPORT TRANSFERS: When users ask for transfers between airports and locations:
- For transfers to/from airports, you only need the airport code (e.g., CDG, ORY) and the destination details
- When transferring to popular landmarks, use their proper names (e.g., "Eiffel Tower", "Louvre Museum")
- Always specify transfer times in 24-hour format (e.g., 14:00 instead of 2:00 PM)
- Default to PRIVATE transfers unless the user specifically asks for shared transportation
- Clearly communicate transfer time, cost, vehicle type, and booking details to the user

ACTIVITIES SEARCH: When searching for activities:
- A default radius of 20 km is used when searching for activities if not specified
- This wider radius ensures you find more options for the user, especially in large cities
- For popular tourist destinations, this radius will cover most major attractions
- If a user wants activities in a specific neighborhood, you should specify a smaller radius

HOTEL SEARCH WORKFLOW: You have access to two types of hotel search capabilities:
1. Initial hotel discovery:
   - Use searchHotelsByCity or searchHotelsByGeocode to find hotels in a specific location
   - These APIs return basic hotel information like name, chain code, location, and hotel ID

2. Detailed hotel information:
   - After finding hotels with the initial search, use getHotelOffers to get detailed information
   - This requires the hotelIds from the initial search and returns room availability, pricing, and amenities
   - If users ask about a specific hotel, use this API to get current pricing and availability
   - For very specific details about a particular room option, use getHotelOfferById with the offer ID

HOTEL SEARCH STRATEGY:
- When users first ask about hotels in a location, use searchHotelsByCity
- When users ask follow-up questions about specific hotels, use getHotelOffers with those specific hotel IDs
- When users want to know about a specific room offer, use getHotelOfferById with the offer ID
- This two-step approach ensures you provide detailed, accurate information about hotels users are interested in

IMPORTANT: Do NOT ask the user for technical details like coordinates, airport codes, or city codes. 
You should determine these automatically based on your knowledge or make reasonable assumptions.
For example, if a user asks about "activities in Tokyo", use your knowledge to determine the coordinates
of Tokyo's city center (latitude: 35.6762, longitude: 139.6503) and search with an appropriate radius.

CRITICAL FOR HOTEL SEARCHES: When searching for hotels with amenities, you MUST use ONLY the following exact values:
SWIMMING_POOL, SPA, FITNESS_CENTER, AIR_CONDITIONING, RESTAURANT, PARKING, PETS_ALLOWED, AIRPORT_SHUTTLE, 
BUSINESS_CENTER, DISABLED_FACILITIES, WIFI, MEETING_ROOMS, NO_KID_ALLOWED, TENNIS, GOLF, KITCHEN, 
ANIMAL_WATCHING, BABY-SITTING, BEACH, CASINO, JACUZZI, SAUNA, SOLARIUM, MASSAGE, VALET_PARKING, 
BAR or LOUNGE, KIDS_WELCOME, NO_PORN_FILMS, MINIBAR, TELEVISION, WI-FI_IN_ROOM, ROOM_SERVICE, 
GUARDED_PARKG, SERV_SPEC_MENU

Map user requests to these exact values. For example:
- "swimming pool" → SWIMMING_POOL
- "pool" → SWIMMING_POOL
- "fitness" or "gym" → FITNESS_CENTER
- "wifi" or "internet" → WIFI
- "pet friendly" → PETS_ALLOWED
- "restaurant" → RESTAURANT

IMPORTANT FOR HOTEL STAR RATINGS: When users ask for hotels with specific star ratings:
- For exact ratings, use comma-separated values like "3,4,5"
- For "at least X stars" requests, include all ratings from X to 5
  For example: "at least 3 stars" → "3,4,5"
- For a range, include all ratings in that range
  For example: "3 to 5 stars" → "3,4,5"

When the user asks about travel options:
1. If any details are missing, make reasonable assumptions based on context or use the most popular/central options
2. For activities or hotels queries, automatically determine the coordinates based on the location mentioned
3. For flight queries, automatically determine the airport codes based on the cities mentioned
4. Use the appropriate tools to search for relevant travel information
5. Present the results in a clear, organized manner

Always be proactive and solve problems without requiring the user to provide technical details or coordinates.
When showing results, focus on providing concrete options and relevant details rather than asking for more input.
`
};

// Concise system message for emergency fallback (significantly smaller token count)
export const minimalSystemMessage: ChatMessage = {
  role: 'system',
  content: `Travel agent assistant with Amadeus API. Always use 2025 for dates unless otherwise specified.
All prices are displayed in USD by default (use $ symbol).
NEVER recommend flights with carrier code 6X (non-operational airline).

Tips:
- For "next month", use May 2025
- Determine airport codes automatically (e.g., CDG for Paris)
- For transfers, use exact location names
- For hotels, use exact amenity codes
- Always be helpful and concise`
}; 