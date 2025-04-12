"use client";

import { useState } from 'react';
import { FiX, FiChevronRight, FiChevronDown, FiCalendar, FiDollarSign, FiClock, FiMapPin, FiInfo, FiExternalLink } from 'react-icons/fi';
import { FaTaxi } from 'react-icons/fa';

interface TravelResultsProps {
  results: any[];
  onClose: () => void;
  onRequestHotelDetails?: (hotelId: string, hotelName: string) => void;
}

export default function TravelResults({ results, onClose, onRequestHotelDetails }: TravelResultsProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Determine result type and render appropriate component
  const renderResultItems = () => {
    // Check if results are flight offers
    if (results.length > 0 && results[0]?.type === 'flight-offer') {
      return (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <span className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded mr-2">
              <FiInfo className="text-blue-500 dark:text-blue-400" />
            </span>
            Flight Offers ({results.length})
          </h2>
          {results.map((flight, index) => (
            <FlightCard key={index} flight={flight} index={index} expandedItems={expandedItems} toggleExpand={toggleExpand} />
          ))}
        </div>
      );
    }
    // Check if results are hotel listings - use multiple checks to cover different API responses
    else if (
      results.length > 0 && 
      (results[0]?.hotelId || // Direct hotel data
       (results[0]?.name && results[0]?.geoCode) || // Hotel by city 
       results[0]?.chainCode) // Another common hotel property
    ) {
      return (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <span className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded mr-2">
              <FiInfo className="text-blue-500 dark:text-blue-400" />
            </span>
            Hotels ({results.length})
          </h2>
          {results.map((hotel, index) => (
            <HotelCard 
              key={index} 
              hotel={hotel} 
              index={index} 
              expandedItems={expandedItems} 
              toggleExpand={toggleExpand}
              onRequestDetails={onRequestHotelDetails} 
            />
          ))}
        </div>
      );
    }
    // Check if results are activities
    else if (results.length > 0 && results[0]?.type === 'activity') {
      return (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <span className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded mr-2">
              <FiInfo className="text-blue-500 dark:text-blue-400" />
            </span>
            Activities ({results.length})
          </h2>
          {results.map((activity, index) => (
            <ActivityCard key={index} activity={activity} index={index} expandedItems={expandedItems} toggleExpand={toggleExpand} />
          ))}
        </div>
      );
    }
    // Check if results are transfers
    else if (results.length > 0 && results[0]?.type === 'transfer-offer') {
      return (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <span className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded mr-2">
              <FiInfo className="text-blue-500 dark:text-blue-400" />
            </span>
            Transfer Offers ({results.length})
          </h2>
          {results.map((transfer, index) => (
            <TransferCard key={index} transfer={transfer} index={index} expandedItems={expandedItems} toggleExpand={toggleExpand} />
          ))}
        </div>
      );
    }
    // Generic results display
    else {
      return (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <span className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded mr-2">
              <FiInfo className="text-blue-500 dark:text-blue-400" />
            </span>
            Results ({results.length})
          </h2>
          {results.map((result, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-300 overflow-auto max-h-60">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="w-[400px] bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 overflow-y-auto relative h-screen flex flex-col">
      <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Travel Results</h1>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close results"
        >
          <FiX className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      <div className="flex-1 p-5 overflow-y-auto">
        {renderResultItems()}
      </div>
    </div>
  );
}

// Flight Card Component
function FlightCard({ flight, index, expandedItems, toggleExpand }: { 
  flight: any;
  index: number;
  expandedItems: Record<string, boolean>;
  toggleExpand: (id: string) => void;
}) {
  const id = `flight-${index}`;
  const isExpanded = expandedItems[id] || false;
  
  const itinerary = flight.itineraries[0];
  const firstSegment = itinerary?.segments[0];
  const lastSegment = itinerary?.segments[itinerary.segments.length - 1];
  
  const departureTime = new Date(firstSegment?.departure.at);
  const arrivalTime = new Date(lastSegment?.arrival.at);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDuration = (duration: string) => {
    // Parse PT10H30M format
    const hours = duration.match(/(\d+)H/)?.[1] || '0';
    const minutes = duration.match(/(\d+)M/)?.[1] || '0';
    return `${hours}h ${minutes}m`;
  };
  
  const price = flight.price?.total || 'N/A';
  const currency = flight.price?.currency || 'USD';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={() => toggleExpand(id)}
      >
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1.5">
              <span className="font-medium">
                {firstSegment?.departure.iataCode} → {lastSegment?.arrival.iataCode}
              </span>
              <span className="mx-2">•</span>
              <span>{formatDuration(itinerary.duration)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-baseline">
                <span className="text-lg font-bold text-gray-800 dark:text-white">{formatTime(departureTime)}</span>
                <FiChevronRight className="text-gray-400" />
                <span className="text-lg font-bold text-gray-800 dark:text-white">{formatTime(arrivalTime)}</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {price} {currency}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {flight.travelerPricings?.length || 1} passenger{flight.travelerPricings?.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
          <div className="ml-3 bg-gray-100 dark:bg-gray-700 rounded-full p-1.5">
            {isExpanded ? <FiChevronDown className="text-gray-500 dark:text-gray-400" /> : <FiChevronRight className="text-gray-500 dark:text-gray-400" />}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3 bg-gray-50 dark:bg-gray-850">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Flight Details</h3>
          
          {itinerary.segments.map((segment: any, i: number) => (
            <div key={i} className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:mb-0 last:pb-0">
              <div className="flex items-center mb-1.5">
                <div className="w-16 text-sm font-medium text-gray-700 dark:text-gray-300">{segment.carrierCode}</div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{segment.departure.iataCode}</span>
                    <span className="text-gray-400 dark:text-gray-500 mx-1.5">→</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{segment.arrival.iataCode}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Flight {segment.number} • {formatDuration(segment.duration)}
                  </div>
                </div>
              </div>
              
              <div className="flex text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded-lg">
                <div className="w-16 flex items-center">
                  <FiCalendar className="mr-1" size={12} />
                  {new Date(segment.departure.at).toLocaleDateString()}
                </div>
                <div className="flex-1 flex items-center">
                  <FiClock className="mr-1" size={12} />
                  {formatTime(new Date(segment.departure.at))} - {formatTime(new Date(segment.arrival.at))}
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-3 text-sm bg-white dark:bg-gray-800 p-3 rounded-lg">
            <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
              <span>Base fare:</span>
              <span>{flight.price.base} {currency}</span>
            </div>
            {flight.price.fees?.map((fee: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                <span>{fee.type}:</span>
                <span>{fee.amount} {currency}</span>
              </div>
            ))}
            <div className="flex justify-between items-center font-bold mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
              <span>Total:</span>
              <span>{flight.price.grandTotal || flight.price.total} {currency}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hotel Card Component
function HotelCard({ 
  hotel, 
  index, 
  expandedItems, 
  toggleExpand,
  onRequestDetails 
}: { 
  hotel: any;
  index: number;
  expandedItems: Record<string, boolean>;
  toggleExpand: (id: string) => void;
  onRequestDetails?: (hotelId: string, hotelName: string) => void;
}) {
  const id = `hotel-${index}`;
  const isExpanded = expandedItems[id] || false;

  const handleRequestDetails = () => {
    if (onRequestDetails && (hotel.hotelId || hotel.id)) {
      onRequestDetails(hotel.hotelId || hotel.id, hotel.name);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={() => toggleExpand(id)}
      >
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="font-semibold text-gray-800 dark:text-white mb-1">{hotel.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {hotel.address?.countryCode && (
                <span>{hotel.address.countryCode}</span>
              )}
              {hotel.iataCode && !hotel.address?.countryCode && (
                <span>{hotel.iataCode}</span>
              )}
              {hotel.distance && (
                <span className="ml-2">• {hotel.distance.value} {hotel.distance.unit}</span>
              )}
            </div>
          </div>
          <div className="ml-3 bg-gray-100 dark:bg-gray-700 rounded-full p-1.5">
            {isExpanded ? <FiChevronDown className="text-gray-500 dark:text-gray-400" /> : <FiChevronRight className="text-gray-500 dark:text-gray-400" />}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3 bg-gray-50 dark:bg-gray-850">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Hotel Details</h3>
          
          <div className="space-y-3 text-sm">
            {hotel.geoCode && (
              <div className="flex items-start bg-white dark:bg-gray-800 p-3 rounded-lg">
                <FiMapPin className="mt-0.5 mr-2 text-gray-500 dark:text-gray-400" size={16} />
                <div className="text-gray-600 dark:text-gray-400">
                  <div>Latitude: {hotel.geoCode.latitude}</div>
                  <div>Longitude: {hotel.geoCode.longitude}</div>
                </div>
              </div>
            )}
            
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
              {hotel.chainCode && (
                <div className="flex items-center mb-2 text-gray-600 dark:text-gray-400">
                  <span className="text-gray-600 dark:text-gray-400 mr-2">Chain:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{hotel.chainCode}</span>
                </div>
              )}
              
              {(hotel.hotelId || hotel.id) && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="text-gray-600 dark:text-gray-400 mr-2">Hotel ID:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{hotel.hotelId || hotel.id}</span>
                </div>
              )}
              
              {hotel.dupeId && (
                <div className="flex items-center text-gray-600 dark:text-gray-400 mt-2">
                  <span className="text-gray-600 dark:text-gray-400 mr-2">Dupe ID:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{hotel.dupeId}</span>
                </div>
              )}
            </div>

            {onRequestDetails && (hotel.hotelId || hotel.id) && (
              <div className="mt-4">
                <button
                  onClick={handleRequestDetails}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md flex items-center justify-center w-full transition-colors"
                >
                  Ask about this hotel
                  <FiExternalLink className="ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Activity Card Component
function ActivityCard({ activity, index, expandedItems, toggleExpand }: { 
  activity: any;
  index: number;
  expandedItems: Record<string, boolean>;
  toggleExpand: (id: string) => void;
}) {
  const id = `activity-${index}`;
  const isExpanded = expandedItems[id] || false;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={() => toggleExpand(id)}
      >
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="font-semibold text-gray-800 dark:text-white">{activity.name}</div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1.5">
              {activity.price && (
                <div className="flex items-center">
                  <FiDollarSign className="mr-1" size={14} />
                  <span>{activity.price.amount} {activity.price.currencyCode}</span>
                </div>
              )}
              {activity.rating && (
                <div className="ml-3">⭐ {parseFloat(activity.rating).toFixed(1)}</div>
              )}
            </div>
          </div>
          <div className="ml-3 bg-gray-100 dark:bg-gray-700 rounded-full p-1.5">
            {isExpanded ? <FiChevronDown className="text-gray-500 dark:text-gray-400" /> : <FiChevronRight className="text-gray-500 dark:text-gray-400" />}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3 bg-gray-50 dark:bg-gray-850">
          {activity.shortDescription && (
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-lg">{activity.shortDescription}</p>
            </div>
          )}
          
          {activity.geoCode && (
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-lg">
                <div>Latitude: {activity.geoCode.latitude}</div>
                <div>Longitude: {activity.geoCode.longitude}</div>
              </div>
            </div>
          )}
          
          {activity.bookingLink && (
            <a 
              href={activity.bookingLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors mt-3"
            >
              Book Now
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// Transfer Card Component
function TransferCard({ 
  transfer, 
  index, 
  expandedItems, 
  toggleExpand 
}: { 
  transfer: any;
  index: number;
  expandedItems: Record<string, boolean>;
  toggleExpand: (id: string) => void;
}) {
  const id = `transfer-${index}`;
  const isExpanded = expandedItems[id] || false;
  
  // Get locations from the transfer data
  const startLocation = transfer.start?.locationCode || 'Unknown Start';
  const endLocation = transfer.end?.name || transfer.end?.address?.cityName || transfer.end?.locationCode || 'Unknown Destination';
  
  // Calculate price information
  const price = transfer.quotation?.monetaryAmount || '0';
  const currency = transfer.quotation?.currencyCode || 'USD';
  
  // Format departure time
  const transferDateTime = transfer.start?.dateTime 
    ? new Date(transfer.start.dateTime) 
    : new Date();
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  // Get transfer type and vehicle info
  const transferType = transfer.transferType || 'PRIVATE';
  const vehicleDescription = transfer.vehicle?.description || 'Vehicle';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={() => toggleExpand(id)}
      >
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1.5">
              <span className="font-medium">
                {startLocation} → {endLocation}
              </span>
              <span className="mx-2">•</span>
              <span>{transferType}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <FiCalendar className="mr-1 text-gray-400" size={14} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(transferDateTime)}</span>
                </div>
                <div className="flex items-center">
                  <FiClock className="mr-1 text-gray-400" size={14} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{formatTime(transferDateTime)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {price} {currency}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {vehicleDescription}
                </div>
              </div>
            </div>
          </div>
          <div className="ml-4">
            {isExpanded ? (
              <FiChevronDown className="text-gray-400" />
            ) : (
              <FiChevronRight className="text-gray-400" />
            )}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
          {/* Vehicle details */}
          {transfer.vehicle && (
            <div className="mb-2">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Vehicle:</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {transfer.vehicle.description || transfer.vehicle.code}
                {transfer.vehicle.seats && transfer.vehicle.seats.length > 0 && (
                  <span> • {transfer.vehicle.seats[0].count || ''} seats</span>
                )}
              </div>
            </div>
          )}
          
          {/* Price details */}
          {transfer.quotation && (
            <div className="mb-2">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Price:</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {transfer.quotation.monetaryAmount} {transfer.quotation.currencyCode}
                {transfer.quotation.base && (
                  <div>Base: {transfer.quotation.base.monetaryAmount} {transfer.quotation.currencyCode}</div>
                )}
              </div>
            </div>
          )}
          
          {/* Service provider */}
          {transfer.serviceProvider?.name && (
            <div className="mb-2">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Service Provider:</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{transfer.serviceProvider.name}</div>
            </div>
          )}
          
          {/* ID for reference */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Transfer ID: {transfer.id}
          </div>
        </div>
      )}
    </div>
  );
} 