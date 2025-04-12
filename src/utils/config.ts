/**
 * Configuration settings for the Travel Agent application
 */

// User preferences - can be modified by UI
export const USER_PREFERENCES = {
  // API response truncation settings
  API_TRUNCATION: {
    ENABLED: false, // Completely disable all compression and truncation
  }
};

// AI Model settings
export const AI_CONFIG = {
  // Models available for different use cases
  MODELS: {
    DEFAULT: 'gpt-4o-mini',     // Faster, more economical
    POWERFUL: 'gpt-4-turbo',    // More capable but slower
    LIGHTWEIGHT: 'gpt-3.5-turbo' // Most economical
  },
  
  // Active model selection (from the MODELS options)
  ACTIVE_MODEL: 'DEFAULT', // Use DEFAULT model
  
  // Token limits for responses
  MAX_TOKENS: {
    DEFAULT: 800,  // Standard limit for responses
    SHORT: 400,    // For quick, summary responses
    LONG: 1500     // For detailed descriptions
  },
  
  // Context window management
  CONTEXT: {
    MAX_CONVERSATION_MESSAGES: 5,  // Maximum messages to retain in context
  }
};

// API response optimization settings
export const API_RESPONSE_CONFIG = {
  // Maximum number of results to include from API responses
  MAX_RESULTS: {
    FLIGHT: 8,        // Increased to show more flight options with layovers
    HOTEL: 3,
    ACTIVITY: 6,      // Increased to show more activity options
    TRANSFER: 3
  },
  
  // Control depth of response compression
  COMPRESSION: {
    MAX_DEPTH: 8,           // Increased depth for nested flight details
    MAX_ARRAY_ITEMS: 10,     // Allow more items in arrays for layovers
    MAX_STRING_LENGTH: 250  // Maximum length for string values
  },
  
  // Special handling for flight-specific arrays to preserve all details
  FLIGHT_ARRAYS: {
    PRESERVE_ALL_SEGMENTS: true,      // Don't limit segments in an itinerary
    PRESERVE_ALL_ITINERARIES: true,   // Don't limit itineraries in multi-leg flights
    PRESERVE_ALL_AIRLINES: true,      // Don't compress airline information
    PRESERVE_DICTIONARIES: true,      // Keep reference dictionaries for codes
    PRESERVE_ALL_DEPARTURES: true,    // Keep all departure information
    PRESERVE_ALL_ARRIVALS: true,      // Keep all arrival information
    PRESERVE_ALL_LAYOVERS: true,      // Keep all layover information
    PRESERVE_ALL_STOPS: true          // Keep all stop information
  },
  
  // Special handling for activity data
  ACTIVITY_OPTIONS: {
    PRESERVE_ALL_DETAILS: true,       // Keep all activity details
    PRESERVE_CATEGORIES: true,        // Keep all activity categories
    LIMIT_PICTURES: true,             // Limit the number of pictures
    SIMPLIFY_LOCATION: true,          // Use simplified location instead of coordinates
    MAX_PICTURES: 2                   // Maximum number of pictures per activity
  }
};

// Default travel preferences (for empty queries)
export const DEFAULT_TRAVEL_PREFERENCES = {
  passengers: 1,
  cabinClass: 'ECONOMY',
  currency: 'USD',
  maxPrice: undefined,
  directFlights: false
};

/**
 * Get the currently active OpenAI model
 */
export function getActiveModel(): string {
  return AI_CONFIG.MODELS[AI_CONFIG.ACTIVE_MODEL as keyof typeof AI_CONFIG.MODELS] || AI_CONFIG.MODELS.DEFAULT;
}

/**
 * Get the max tokens setting for the current response type
 */
export function getMaxTokens(type: 'DEFAULT' | 'SHORT' | 'LONG' = 'DEFAULT'): number {
  return AI_CONFIG.MAX_TOKENS[type] || AI_CONFIG.MAX_TOKENS.DEFAULT;
} 