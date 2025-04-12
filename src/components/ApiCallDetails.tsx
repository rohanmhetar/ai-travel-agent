"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Code2, ExternalLink } from 'lucide-react';
import { USER_PREFERENCES } from '@/utils/config';

interface ApiCallDetailsProps {
  apiName: string;
  endpoint: string;
  requestData: any;
  responseData: any;
  isLoading?: boolean;
}

export default function ApiCallDetails({
  apiName,
  endpoint,
  requestData,
  responseData,
  isLoading = false,
}: ApiCallDetailsProps) {
  // Start expanded by default to ensure visibility
  const [isOpen, setIsOpen] = useState(true);
  // State for full-screen details view
  const [showFullDetails, setShowFullDetails] = useState(false);
  
  // Validate data but always show something
  const hasValidRequest = requestData && typeof requestData === 'object';
  const hasValidResponse = responseData && typeof responseData === 'object';

  // Format data for display, with fallbacks for invalid data
  const formattedRequest = hasValidRequest
    ? JSON.stringify(requestData, null, 2)
    : typeof requestData === 'string' 
      ? requestData 
      : 'Invalid or missing request data';
  
  const formattedResponse = isLoading 
    ? 'Loading response data...'
    : hasValidResponse
      ? JSON.stringify(responseData, null, 2)
      : typeof responseData === 'string'
        ? responseData
        : 'Invalid or missing response data';

  // Log any data issues but still show the component
  if (!isLoading && (!hasValidRequest || !hasValidResponse)) {
    console.error(
      `Data issue in ApiCallDetails: ${hasValidRequest ? '' : 'request invalid,'} ${
        hasValidResponse ? '' : 'response invalid'
      }`
    );
  }

  // Check if data is too large and truncate if needed
  const isTruncated = {
    request: formattedRequest.length > 5000,
    response: !isLoading && formattedResponse.length > 10000
  };

  // Truncate data if needed
  const displayedRequest = isTruncated.request
    ? formattedRequest.substring(0, 5000) + '... (truncated)'
    : formattedRequest;
    
  const displayedResponse = isLoading
    ? formattedResponse
    : isTruncated.response
      ? formattedResponse.substring(0, 10000) + '... (truncated)'
      : formattedResponse;

  // Determine if there's an error in the response
  const hasError = !isLoading && hasValidResponse && 
    (responseData.error || 
     (responseData.message && responseData.message.toLowerCase().includes('error')) ||
     (responseData.statusCode && responseData.statusCode >= 400));

  // Close the full details view
  const handleCloseFullDetails = () => {
    setShowFullDetails(false);
  };

  return (
    <>
      <div className="font-mono text-xs">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between p-2 ${
            hasError 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50' 
              : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
          } hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors rounded border`}
        >
          <div className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
            <Code2 className={`h-4 w-4 ${hasError ? 'text-red-500' : 'text-blue-500'}`} />
            <span>{apiName || 'API Call'}</span>
            <span className="text-xs text-neutral-500">({endpoint || 'Unknown endpoint'})</span>
            {hasError && <span className="text-xs text-red-500 font-bold">(Failed)</span>}
          </div>
          <div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-neutral-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            )}
          </div>
        </button>
        
        {isOpen && (
          <div className="mt-2">
            <div className="bg-neutral-100 dark:bg-neutral-900 p-2 rounded-t border border-neutral-200 dark:border-neutral-800">
              <div className="font-medium text-xs text-neutral-500 dark:text-neutral-400">Parameters:</div>
              <pre className="mt-1 overflow-auto whitespace-pre-wrap max-h-80">{displayedRequest}</pre>
            </div>
            
            <div className={`p-2 rounded-b border-x border-b ${
              hasError 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50' 
                : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
            }`}>
              <div className="font-medium text-xs text-neutral-500 dark:text-neutral-400">Response:</div>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-blue-500">Loading...</span>
                </div>
              ) : (
                <pre className="mt-1 overflow-auto whitespace-pre-wrap max-h-96">{displayedResponse}</pre>
              )}
              <div className="flex flex-col space-y-2 mt-2">
                {(isTruncated.request || isTruncated.response) && (
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                    {isTruncated.request && isTruncated.response
                      ? 'Request and response data have been truncated for display.'
                      : isTruncated.request
                      ? 'Request data has been truncated for display.'
                      : 'Response data has been truncated for display.'}
                  </div>
                )}
                <button 
                  onClick={() => setShowFullDetails(true)}
                  className="flex items-center justify-center gap-1 text-xs py-1.5 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors w-full mt-1"
                  disabled={isLoading}
                >
                  <ExternalLink size={12} />
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full-screen detailed view */}
      {showFullDetails && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Code2 className={`h-5 w-5 ${hasError ? 'text-red-500' : 'text-blue-500'}`} />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {apiName || 'API Call'} 
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                    {endpoint || 'Unknown endpoint'}
                  </span>
                  {hasError && <span className="text-sm text-red-500 font-medium ml-2">(Failed)</span>}
                </h3>
              </div>
              <button 
                onClick={handleCloseFullDetails}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="bg-blue-50 dark:bg-blue-900/30 p-1 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l-4-4m4 4l4-4" />
                    </svg>
                  </span>
                  Request Parameters
                </h4>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm">{formattedRequest}</pre>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className={`p-1 rounded ${hasError ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${hasError ? 'text-red-500' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  Response {hasError && '(Error)'}
                </h4>
                <div className={`p-4 rounded-lg border overflow-auto ${
                  hasError 
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' 
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                }`}>
                  {hasError && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg text-red-700 dark:text-red-400">
                      <div className="font-medium">Error in API Response</div>
                      <div className="text-sm mt-1">{responseData.message || 'Unknown error occurred'}</div>
                    </div>
                  )}
                  <pre className="whitespace-pre-wrap text-sm">{formattedResponse}</pre>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky bottom-0">
              <button
                onClick={handleCloseFullDetails}
                className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 