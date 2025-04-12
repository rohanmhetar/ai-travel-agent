import axios from 'axios';

// API URLs
const BASE_URL = 'https://test.api.amadeus.com';
const TOKEN_URL = `${BASE_URL}/v1/security/oauth2/token`;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// Helper function to delay execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Amadeus client class
export class AmadeusClient {
  private apiKey: string;
  private apiSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private requestCount: number = 0;
  private resetTime: number = Date.now() + 60000; // Reset after 1 minute initially

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  // Get access token
  private async getAccessToken(): Promise<string> {
    // Return existing token if it's still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken as string;
    }

    // Get new token
    try {
      const response = await axios.post(
        TOKEN_URL,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.apiKey,
          client_secret: this.apiSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry time (subtract 60 seconds to ensure we refresh before actual expiry)
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
      return this.accessToken as string;
    } catch (error) {
      console.error('Error getting Amadeus access token:', error);
      throw error;
    }
  }

  // Generic API request method with retry logic
  private async makeRequest<T>(
    method: string,
    endpoint: string,
    params?: any,
    data?: any,
    retryCount: number = 0
  ): Promise<T> {
    try {
      // Check rate limiting
      this.checkRateLimit();
      
      const token = await this.getAccessToken();
      const response = await axios({
        method,
        url: `${BASE_URL}${endpoint}`,
        params,
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Increment request count for rate limiting
      this.incrementRequestCount();
      
      return response.data as T;
    } catch (error: any) {
      console.error(`Error making ${method} request to ${endpoint}:`, error.message || error);
      
      // If rate limited (429) or server error (5xx), retry with backoff
      if (
        error.response && 
        (error.response.status === 429 || (error.response.status >= 500 && error.response.status < 600)) && 
        retryCount < MAX_RETRIES
      ) {
        const retryAfter = error.response.headers['retry-after'] 
          ? parseInt(error.response.headers['retry-after']) * 1000
          : RETRY_DELAY_MS * Math.pow(2, retryCount);
          
        console.log(`Rate limited or server error. Retrying after ${retryAfter}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
        
        // Wait before retrying
        await sleep(retryAfter);
        
        // Retry the request
        return this.makeRequest(method, endpoint, params, data, retryCount + 1);
      }
      
      // If authentication error, refresh token and retry once
      if (error.response && error.response.status === 401 && retryCount === 0) {
        console.log('Authentication error. Refreshing token and retrying...');
        this.accessToken = null;
        await sleep(1000);
        return this.makeRequest(method, endpoint, params, data, retryCount + 1);
      }
      
      throw error;
    }
  }
  
  // Check and handle rate limiting
  private checkRateLimit() {
    // Reset count if we've passed the reset time
    if (Date.now() > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = Date.now() + 60000; // Reset window: 1 minute
    }
    
    // If too many requests, wait until reset
    if (this.requestCount >= 5) { // Limit to 5 requests per minute
      const waitTime = this.resetTime - Date.now();
      if (waitTime > 0) {
        console.log(`Rate limit reached. Waiting for ${waitTime}ms before next request.`);
        throw new Error(`Rate limit reached. Please try again in ${Math.ceil(waitTime/1000)} seconds.`);
      }
    }
  }
  
  // Increment request counter
  private incrementRequestCount() {
    this.requestCount++;
  }

  // Search for flights
  async searchFlights(params: {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children?: number;
    infants?: number;
    travelClass?: string;
    currencyCode?: string;
    max?: number;
    // Additional parameters that might be passed but not used by the API
    nonStop?: boolean;
    maxPrice?: number;
    includedAirlineCodes?: string;
    excludedAirlineCodes?: string;
    includedCarrierCodes?: string;
    excludedCarrierCodes?: string;
    nonStopOnly?: boolean;
    paymentPolicy?: string;
    viewBy?: string;
    sort?: string;
  }) {
    // Create a copy of the params to avoid modifying the original
    const processedParams: Record<string, any> = { ...params };
    
    // Set default currency to USD if not specified
    if (!processedParams.currencyCode) {
      processedParams.currencyCode = 'USD';
    }
    
    // Remove parameters that the API doesn't accept
    const allowedParams = [
      'originLocationCode', 'destinationLocationCode', 'departureDate', 'returnDate',
      'adults', 'children', 'infants', 'travelClass', 'currencyCode', 'max'
    ];
    
    // Create a new object with only the allowed parameters
    const apiParams: Record<string, any> = {};
    for (const key of allowedParams) {
      if (processedParams[key] !== undefined) {
        apiParams[key] = processedParams[key];
      }
    }
    
    // Log what parameters are being sent vs. what was received
    if (Object.keys(processedParams).length > Object.keys(apiParams).length) {
      console.log('Note: Some parameters were not used by the Amadeus API:', 
        Object.keys(processedParams).filter(k => !allowedParams.includes(k)));
    }
    
    return this.makeRequest(
      'GET',
      '/v2/shopping/flight-offers',
      apiParams,
      undefined
    );
  }

  // Search for hotels by city code
  async searchHotelsByCity(params: {
    cityCode: string;
    radius?: number;
    radiusUnit?: string;
    chainCodes?: string;
    amenities?: string;
    ratings?: string;
    hotelSource?: string;
  }) {
    return this.makeRequest(
      'GET',
      '/v1/reference-data/locations/hotels/by-city',
      params,
      undefined
    );
  }

  // Search for hotels by geocode
  async searchHotelsByGeocode(params: {
    latitude: number;
    longitude: number;
    radius?: number;
    radiusUnit?: string;
    chainCodes?: string;
    amenities?: string;
    ratings?: string;
    hotelSource?: string;
  }) {
    return this.makeRequest(
      'GET',
      '/v1/reference-data/locations/hotels/by-geocode',
      params,
      undefined
    );
  }

  // Search for activities
  async searchActivities(params: {
    latitude: number;
    longitude: number;
    radius?: number;
  }) {
    // Set default radius to 20 km if not specified
    const processedParams = { ...params };
    if (!processedParams.radius) {
      processedParams.radius = 20;
    }
    
    return this.makeRequest(
      'GET',
      '/v1/shopping/activities',
      processedParams,
      undefined
    );
  }

  // Search for transfers
  async searchTransfers(data: any) {
    // Add special handling for missing address information
    const formattedData = { ...data };
    
    // Handle date format conversion
    if (formattedData.transferDate && !formattedData.startDateTime) {
      // Convert transferDate to startDateTime with a default time of 10:30:00
      formattedData.startDateTime = `${formattedData.transferDate}T10:30:00`;
      console.log(`Converted transferDate to startDateTime: ${formattedData.startDateTime}`);
      // Remove the original transferDate field
      delete formattedData.transferDate;
    }
    
    // Ensure we have the minimum required fields
    if (!formattedData.endLocationCode && !formattedData.endGeoCode) {
      console.warn("Missing both endLocationCode and endGeoCode in transfer request");
      
      // If we're transferring to Orly airport, add the code
      if (formattedData.endName && formattedData.endName.toLowerCase().includes('orly')) {
        formattedData.endLocationCode = 'ORY';
        console.log("Added ORY as endLocationCode based on destination name");
      }
      // If we're transferring to Charles de Gaulle airport, add the code
      else if (formattedData.endName && formattedData.endName.toLowerCase().includes('charles de gaulle')) {
        formattedData.endLocationCode = 'CDG';
        console.log("Added CDG as endLocationCode based on destination name");
      }
    }
    
    // Validate the mandatory fields
    if (!formattedData.startLocationCode && !formattedData.startGeoCode) {
      throw new Error("Transfer request requires either startLocationCode or startGeoCode");
    }
    
    // If we're still missing drop-off information, create a better error
    if (!formattedData.endLocationCode && !formattedData.endAddressLine) {
      throw new Error("Transfer request requires either endLocationCode, endAddressLine, or more specific destination details");
    }
    
    return this.makeRequest(
      'POST',
      '/v1/shopping/transfer-offers',
      undefined,
      formattedData
    );
  }

  // Search for hotel offers using hotelIds and other parameters
  async getHotelOffers(params: {
    hotelIds: string[];
    adults?: number;
    checkInDate?: string;
    checkOutDate?: string;
    countryOfResidence?: string;
    roomQuantity?: number;
    priceRange?: string;
    currency?: string;
    paymentPolicy?: string;
    boardType?: string;
    includeClosed?: boolean;
    bestRateOnly?: boolean;
    lang?: string;
  }) {
    // Process the params to match API expectations
    const processedParams: any = { ...params };
    
    // hotelIds should be a comma-separated string
    if (Array.isArray(processedParams.hotelIds)) {
      processedParams.hotelIds = processedParams.hotelIds.join(',');
    }
    
    // Set default values if not provided
    if (!processedParams.adults) processedParams.adults = 1;
    if (!processedParams.roomQuantity) processedParams.roomQuantity = 1;
    if (!processedParams.paymentPolicy) processedParams.paymentPolicy = 'NONE';
    if (processedParams.bestRateOnly === undefined) processedParams.bestRateOnly = true;
    if (!processedParams.currency) processedParams.currency = 'USD';
    
    // Check if dates are not provided - set to today and tomorrow
    if (!processedParams.checkInDate) {
      const today = new Date();
      processedParams.checkInDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    if (!processedParams.checkOutDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      processedParams.checkOutDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    console.log('Getting hotel offers with params:', processedParams);
    
    return this.makeRequest(
      'GET',
      '/v3/shopping/hotel-offers',
      processedParams,
      undefined
    );
  }
  
  // Get detailed information about a specific hotel offer
  async getHotelOfferById(offerId: string, lang?: string) {
    const params: any = {};
    if (lang) params.lang = lang;
    
    console.log(`Getting hotel offer details for offerId: ${offerId}`);
    
    return this.makeRequest(
      'GET',
      `/v3/shopping/hotel-offers/${offerId}`,
      params,
      undefined
    );
  }
}

// Create singleton instance
let amadeus: AmadeusClient | null = null;

export function getAmadeusClient(): AmadeusClient {
  if (!amadeus) {
    // Get API key and secret from environment variables
    const apiKey = process.env.AMADEUS_API_KEY || '';
    const apiSecret = process.env.AMADEUS_API_SECRET || '';
    
    if (!apiKey || !apiSecret) {
      throw new Error('Amadeus API key and secret are required');
    }
    
    amadeus = new AmadeusClient(apiKey, apiSecret);
  }
  
  return amadeus;
} 