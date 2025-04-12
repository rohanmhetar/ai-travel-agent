"use client";

import { useState } from 'react';
import { FiCalendar, FiMapPin, FiClock, FiHome, FiActivity, FiChevronDown, FiChevronUp, FiInfo } from 'react-icons/fi';

interface ItineraryEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  type: 'accommodation' | 'activity' | 'transportation' | 'dining';
  location?: string;
  duration?: string;
}

interface ItineraryDay {
  date: string;
  day: number;
  location: string;
  events: ItineraryEvent[];
}

interface ItineraryViewProps {
  title: string;
  days: ItineraryDay[];
}

export default function ItineraryView({ title, days }: ItineraryViewProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleDay = (dayIndex: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayIndex)) {
      newExpanded.delete(dayIndex);
    } else {
      newExpanded.add(dayIndex);
    }
    setExpandedDays(newExpanded);
  };

  const toggleEvent = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  // Helper function to get event icon based on type
  const getEventIcon = (type: ItineraryEvent['type']) => {
    switch (type) {
      case 'accommodation':
        return <FiHome className="h-5 w-5" />;
      case 'activity':
        return <FiActivity className="h-5 w-5" />;
      case 'transportation':
        return <FiClock className="h-5 w-5" />;
      case 'dining':
        return <FiInfo className="h-5 w-5" />;
      default:
        return <FiInfo className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 dark:bg-blue-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <FiCalendar className="mr-2" /> {title}
        </h2>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {days.map((day, index) => (
          <div key={index} className="overflow-hidden">
            <button
              onClick={() => toggleDay(index)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-bold rounded-full h-10 w-10 flex items-center justify-center mr-4">
                  {day.day}
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">{day.date}</h3>
                  <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mt-1">
                    <FiMapPin className="mr-1" /> {day.location}
                  </div>
                </div>
              </div>
              <div>
                {expandedDays.has(index) ? (
                  <FiChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <FiChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
            </button>

            {expandedDays.has(index) && (
              <div className="px-6 pb-4">
                <div className="space-y-4">
                  {day.events.map((event) => (
                    <div 
                      key={event.id} 
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <div 
                        className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between cursor-pointer"
                        onClick={() => toggleEvent(event.id)}
                      >
                        <div className="flex items-center">
                          <div className="mr-3 flex-shrink-0 text-blue-600 dark:text-blue-400">
                            {getEventIcon(event.type)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-200">{event.title}</div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <FiClock className="mr-1 h-3 w-3" /> {event.time}
                              {event.location && (
                                <>
                                  <span className="mx-2">•</span>
                                  <FiMapPin className="mr-1 h-3 w-3" /> {event.location}
                                </>
                              )}
                              {event.duration && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>{event.duration}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          {expandedEvents.has(event.id) ? (
                            <FiChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <FiChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {expandedEvents.has(event.id) && (
                        <div className="p-4 bg-white dark:bg-gray-900">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                            {event.description}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 