import { NextRequest, NextResponse } from 'next/server';
import { getAmadeusClient } from '@/utils/amadeus';

// Share the latest API calls across requests
let latestApiCalls: any[] = [];
let latestUserQuery: string = '';

// Export a function to record API call
export function recordApiCall(apiCall: any, userQuery?: string) {
  console.log('🔵 Recording API call:', apiCall.apiName);
  
  // Update user query if provided
  if (userQuery) {
    latestUserQuery = userQuery;
  }
  
  // Ensure we're storing valid data
  if (!apiCall || !apiCall.apiName || !apiCall.endpoint || !apiCall.requestData || !apiCall.responseData) {
    console.error('❌ Invalid API call data:', apiCall);
    return;
  }
  
  // Store the API call with a timestamp and query context
  const apiCallWithMetadata = {
    ...apiCall,
    recordedAt: new Date().toISOString(),
    userQuery: latestUserQuery // Associate with the latest user query
  };
  
  latestApiCalls.push(apiCallWithMetadata);
  console.log(`✅ Recorded API call for ${apiCall.apiName}, now have ${latestApiCalls.length} calls`);
  
  // Keep only the last 10 API calls
  if (latestApiCalls.length > 10) {
    latestApiCalls = latestApiCalls.slice(-10);
  }
}

// Set the latest user query for context
export function setUserQuery(query: string) {
  if (query && query.trim()) {
    latestUserQuery = query.trim();
    console.log(`✅ Updated latest user query: "${latestUserQuery}"`);
  }
}

// Handle status checks
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const filterParam = url.searchParams.get('filter');
    
    let filteredCalls = latestApiCalls;
    
    // Filter API calls by query context if requested
    if (filterParam === 'true' || filterParam === '1') {
      const queryParam = url.searchParams.get('query') || latestUserQuery;
      
      if (queryParam) {
        // Simple relevance filter based on API type and query terms
        filteredCalls = latestApiCalls.filter(call => {
          const query = queryParam.toLowerCase();
          const apiName = call.apiName.toLowerCase();
          
          // Match API call type with query intent
          if (query.includes('flight') && apiName.includes('flight')) return true;
          if ((query.includes('hotel') || query.includes('accommodation')) && apiName.includes('hotel')) return true;
          if ((query.includes('activity') || query.includes('activities') || query.includes('things to do')) && apiName.includes('activit')) return true;
          if ((query.includes('transfer') || query.includes('transport')) && apiName.includes('transfer')) return true;
          
          return false;
        });
      }
    }
    
    console.log(`🔵 Serving ${filteredCalls.length} API calls from status endpoint (total: ${latestApiCalls.length})`);
    
    return NextResponse.json({
      status: "success",
      apiCalls: filteredCalls,
      userQuery: latestUserQuery,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing chat status:', error);
    return NextResponse.json(
      { error: 'Error processing your request' },
      { status: 500 }
    );
  }
} 