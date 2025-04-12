"use client";

import { useState } from 'react';
import { FiX, FiChevronRight, FiChevronDown, FiCalendar, FiDollarSign, FiInfo, FiExternalLink, FiMapPin } from 'react-icons/fi';
import { MdOutlineLocalActivity } from 'react-icons/md';

interface ActivityResultsSidebarProps {
  results: any[];
  onClose: () => void;
  onRequestDetails: (activityId: string) => void;
}

export default function ActivityResultsSidebar({ 
  results, 
  onClose,
  onRequestDetails 
}: ActivityResultsSidebarProps) {
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
          <MdOutlineLocalActivity className="mr-2 text-green-500" />
          Activity Results ({results.length})
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
          {results.map((activity, index) => (
            <ActivityCard 
              key={index} 
              activity={activity} 
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

// Activity Card Component
function ActivityCard({ 
  activity, 
  index, 
  expandedItems, 
  toggleExpand,
  onRequestDetails
}: { 
  activity: any;
  index: number;
  expandedItems: Record<string, boolean>;
  toggleExpand: (id: string) => void;
  onRequestDetails: (activityId: string) => void;
}) {
  const id = `activity-${index}`;
  const isExpanded = expandedItems[id] || false;
  
  const handleRequestDetails = () => {
    onRequestDetails(activity.id);
  };

  // Function to format currency
  const formatCurrency = (amount: number, currencyCode: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback in case of invalid currency code
      return `${currencyCode} ${amount}`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4">
        {/* Activity header */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <div className="flex items-center">
            <span className="bg-green-50 dark:bg-green-900/30 rounded-full p-1 mr-2">
              <MdOutlineLocalActivity className="text-green-500" />
            </span>
            <span className="font-medium">{activity.category || 'Activity'}</span>
            {activity.duration && (
              <>
                <span className="mx-2 font-bold">•</span>
                <span className="text-xs">{activity.duration}</span>
              </>
            )}
          </div>
          {activity.id && (
            <div className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              ID: {activity.id}
            </div>
          )}
        </div>
        
        {/* Activity name and details */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{activity.name}</h3>
          
          {activity.shortDescription && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {activity.shortDescription}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2 mt-2">
            {activity.price && (
              <div className="text-sm px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full flex items-center">
                {/* Dynamic currency icon based on currency code */}
                {activity.price.currencyCode === 'JPY' ? (
                  <span className="mr-1 font-bold text-blue-700 dark:text-blue-300">¥</span>
                ) : activity.price.currencyCode === 'EUR' ? (
                  <span className="mr-1 font-bold text-blue-700 dark:text-blue-300">€</span>
                ) : activity.price.currencyCode === 'GBP' ? (
                  <span className="mr-1 font-bold text-blue-700 dark:text-blue-300">£</span>
                ) : (
                  <FiDollarSign className="mr-1" size={14} />
                )}
                <span>{formatCurrency(activity.price.amount, activity.price.currencyCode)}</span>
              </div>
            )}
            
            {activity.rating && (
              <div className="text-sm px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-full flex items-center">
                ⭐ {parseFloat(activity.rating).toFixed(1)}
              </div>
            )}
            
            {activity.location && (
              <div className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center">
                <FiMapPin className="mr-1" size={14} />
                <span>{activity.location}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          {activity.price && (
            <div className="font-bold text-lg text-green-600 dark:text-green-400">
              {formatCurrency(activity.price.amount, activity.price.currencyCode)}
            </div>
          )}
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
              className="px-3 py-1 text-sm text-white bg-green-500 hover:bg-green-600 rounded-md flex items-center transition-colors"
            >
              More Info
              <FiExternalLink className="ml-1" />
            </button>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3 bg-gray-50 dark:bg-gray-850">
          {/* Activity details */}
          {activity.shortDescription && (
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-lg">
                {activity.shortDescription}
              </p>
            </div>
          )}
          
          {/* Location information */}
          {(activity.geoCode || activity.location) && (
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-lg">
                {activity.location && <div className="mb-1">{activity.location}</div>}
                {activity.geoCode && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <div>Latitude: {activity.geoCode.latitude}</div>
                    <div>Longitude: {activity.geoCode.longitude}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Optional time slots */}
          {activity.timeSlots && activity.timeSlots.length > 0 && (
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Available Times</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {activity.timeSlots.map((slot: string, idx: number) => (
                    <div key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {slot}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Price details */}
          {activity.price && (
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Price</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center">
                  <span className="font-medium">
                    {formatCurrency(activity.price.amount, activity.price.currencyCode)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Booking link if available */}
          {activity.bookingLink && (
            <a 
              href={activity.bookingLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full text-center bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors mt-3"
            >
              Book Now
            </a>
          )}
        </div>
      )}
    </div>
  );
}