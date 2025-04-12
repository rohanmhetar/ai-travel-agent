"use client";

import { useState } from 'react';
import { FiX, FiChevronRight, FiChevronDown, FiCalendar, FiClock, FiInfo, FiExternalLink } from 'react-icons/fi';
import { IoAirplaneOutline } from 'react-icons/io5';

interface FlightResultsSidebarProps {
  results: any[];
  onClose: () => void;
  onRequestDetails: (flightId: string) => void;
}

export default function FlightResultsSidebar({ 
  results, 
  onClose,
  onRequestDetails 
}: FlightResultsSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-[450px] bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 overflow-y-auto relative h-screen flex flex-col">
      <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
          <IoAirplaneOutline className="mr-2 text-blue-500" />
          Flight Results ({results.length})
        </h1>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close results"
        >
          <FiX className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      
      <div className="flex-1 p-5 overflow-y-auto">
        <div className="space-y-5">
          {results.map((flight, index) => (
            <FlightCard 
              key={index} 
              flight={flight} 
              index={index} 
              expandedItems={expandedItems} 
              toggleExpand={toggleExpand}
              onRequestDetails={onRequestDetails}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Flight Card Component
function FlightCard({ 
  flight, 
  index, 
  expandedItems, 
  toggleExpand,
  onRequestDetails
}: { 
  flight: any;
  index: number;
  expandedItems: Record<string, boolean>;
  toggleExpand: (id: string) => void;
  onRequestDetails: (flightId: string) => void;
}) {
  const id = `flight-${index}`;
  const isExpanded = expandedItems[id] || false;
  
  // Handle both outbound and return flights
  const outboundItinerary = flight.itineraries[0];
  const returnItinerary = flight.itineraries[1];  // Will be undefined for one-way flights
  
  const formatItinerary = (itinerary: any) => {
    const segments = itinerary?.segments || [];
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    
    const departureTime = new Date(firstSegment?.departure.at);
    const arrivalTime = new Date(lastSegment?.arrival.at);
    
    const stops = segments.length - 1;
    const stopsText = stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`;
    
    // Calculate layover times
    const layovers = segments.slice(0, -1).map((segment: any, idx: number) => {
      const nextSegment = segments[idx + 1];
      const arrivalTime = new Date(segment.arrival.at);
      const nextDepartureTime = new Date(nextSegment.departure.at);
      const layoverDuration = Math.floor((nextDepartureTime.getTime() - arrivalTime.getTime()) / (1000 * 60));
      const hours = Math.floor(layoverDuration / 60);
      const minutes = layoverDuration % 60;
      return {
        airport: segment.arrival.iataCode,
        duration: `${hours}h ${minutes}m`,
        arrivalTime: arrivalTime,
        departureTime: nextDepartureTime
      };
    });
    
    return {
      departureTime,
      arrivalTime,
      stops,
      stopsText,
      duration: itinerary.duration,
      segments,
      firstSegment,
      lastSegment,
      layovers
    };
  };
  
  const outbound = formatItinerary(outboundItinerary);
  const return_ = returnItinerary ? formatItinerary(returnItinerary) : null;
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDuration = (duration: string) => {
    // Parse PT10H30M format
    const hours = duration.match(/(\d+)H/)?.[1] || '0';
    const minutes = duration.match(/(\d+)M/)?.[1] || '0';
    return `${hours}h ${minutes}m`;
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  const price = flight.price?.total || 'N/A';
  const currency = flight.price?.currency || 'USD';
  
  const handleRequestDetails = () => {
    onRequestDetails(flight.id);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4">
        {/* Airline and flight number */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <div className="flex items-center">
            <span className="bg-blue-50 dark:bg-blue-900/30 rounded-full p-1 mr-2">
              <IoAirplaneOutline className="text-blue-500" />
            </span>
            <span className="font-medium">{outbound.firstSegment.carrierCode} {outbound.firstSegment.number}</span>
            <span className="mx-2 font-bold">•</span>
            <span className="text-xs">{formatDate(outbound.departureTime)}</span>
          </div>
          <div className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
            ID: {flight.id}
          </div>
        </div>
        
        {/* Outbound Flight */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {outbound.firstSegment.departure.iataCode}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center px-2">
                <div className="h-[1px] flex-1 bg-gray-300 dark:bg-gray-600"></div>
                <div className="mx-2">{outbound.stopsText}</div>
                <div className="h-[1px] flex-1 bg-gray-300 dark:bg-gray-600"></div>
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {outbound.lastSegment.arrival.iataCode}
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
              <div>{formatTime(outbound.departureTime)}</div>
              <div className="text-xs">{formatDuration(outbound.duration)}</div>
              <div>{formatTime(outbound.arrivalTime)}</div>
            </div>
            
            {/* Layovers */}
            {outbound.layovers.length > 0 && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                {outbound.layovers.map((layover: any, idx: number) => (
                  <div key={idx} className="mb-1">
                    <span className="font-medium">Layover in {layover.airport}:</span> {formatTime(layover.arrivalTime)} - {formatTime(layover.departureTime)} ({layover.duration})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Return Flight (if exists) */}
        {return_ && (
          <>
            <div className="my-3 border-t border-gray-100 dark:border-gray-700 pt-3">
              <div className="flex items-center mb-2">
                <span className="bg-blue-50 dark:bg-blue-900/30 rounded-full p-1 mr-2">
                  <IoAirplaneOutline className="text-blue-500 rotate-180" />
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">{return_.firstSegment.carrierCode} {return_.firstSegment.number}</span>
                  <span className="mx-2 font-bold">•</span>
                  <span>{formatDate(return_.departureTime)}</span>
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <div className="text-lg font-bold text-gray-800 dark:text-white">
                      {return_.firstSegment.departure.iataCode}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center px-2">
                      <div className="h-[1px] flex-1 bg-gray-300 dark:bg-gray-600"></div>
                      <div className="mx-2">{return_.stopsText}</div>
                      <div className="h-[1px] flex-1 bg-gray-300 dark:bg-gray-600"></div>
                    </div>
                    <div className="text-lg font-bold text-gray-800 dark:text-white">
                      {return_.lastSegment.arrival.iataCode}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <div>{formatTime(return_.departureTime)}</div>
                    <div className="text-xs">{formatDuration(return_.duration)}</div>
                    <div>{formatTime(return_.arrivalTime)}</div>
                  </div>
                  
                  {/* Layovers */}
                  {return_.layovers.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                      {return_.layovers.map((layover: any, idx: number) => (
                        <div key={idx} className="mb-1">
                          <span className="font-medium">Layover in {layover.airport}:</span> {formatTime(layover.arrivalTime)} - {formatTime(layover.departureTime)} ({layover.duration})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Price and actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
            ${price}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => toggleExpand(id)}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md flex items-center transition-colors"
            >
              {isExpanded ? 'Hide' : 'Show'} details
              {isExpanded ? (
                <FiChevronDown className="ml-1" />
              ) : (
                <FiChevronRight className="ml-1" />
              )}
            </button>
            <button
              onClick={handleRequestDetails}
              className="px-3 py-1 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md flex items-center transition-colors"
            >
              More info
              <FiExternalLink className="ml-1" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Expanded details section */}
      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
          {/* Outbound details */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 dark:text-white mb-2">Outbound Flight Details</h4>
            {outbound.segments.map((segment: any, idx: number) => (
              <div key={idx} className="mb-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>{segment.carrierCode} {segment.number}</span>
                  <span>{formatDuration(segment.duration)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-xs">
                  <span>{segment.departure.iataCode} {formatTime(new Date(segment.departure.at))}</span>
                  <span>→</span>
                  <span>{segment.arrival.iataCode} {formatTime(new Date(segment.arrival.at))}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Return details */}
          {return_ && (
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Return Flight Details</h4>
              {return_.segments.map((segment: any, idx: number) => (
                <div key={idx} className="mb-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>{segment.carrierCode} {segment.number}</span>
                    <span>{formatDuration(segment.duration)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 text-xs">
                    <span>{segment.departure.iataCode} {formatTime(new Date(segment.departure.at))}</span>
                    <span>→</span>
                    <span>{segment.arrival.iataCode} {formatTime(new Date(segment.arrival.at))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 