'use client';

import { useState, useEffect } from 'react';
import { USER_PREFERENCES } from '@/utils/config';
import { HelpCircle } from 'lucide-react';

export default function TruncationToggle() {
  const [truncationEnabled, setTruncationEnabled] = useState(USER_PREFERENCES.API_TRUNCATION.ENABLED);

  // Update the global config when the toggle changes
  const handleToggleChange = () => {
    const newValue = !truncationEnabled;
    setTruncationEnabled(newValue);
    USER_PREFERENCES.API_TRUNCATION.ENABLED = newValue;
    
    // Save preference to localStorage for persistence
    localStorage.setItem('api_truncation_enabled', newValue.toString());
  };

  // Load preference from localStorage on component mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('api_truncation_enabled');
    if (savedPreference !== null) {
      const parsedValue = savedPreference === 'true';
      setTruncationEnabled(parsedValue);
      USER_PREFERENCES.API_TRUNCATION.ENABLED = parsedValue;
    }
  }, []);

  return (
    <div className="flex items-center gap-2 p-2 text-sm">
      <div className="group relative">
        <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
        <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 hidden group-hover:block z-10">
          <p><strong>Compact Mode:</strong> Reduces API response size for better performance.</p>
          <p><strong>Full Response:</strong> Shows complete uncompressed API responses with all details.</p>
        </div>
      </div>
      <label htmlFor="truncation-toggle" className="flex items-center cursor-pointer">
        <div className="relative">
          <input
            id="truncation-toggle"
            type="checkbox"
            className="sr-only"
            checked={truncationEnabled}
            onChange={handleToggleChange}
          />
          <div className={`block w-10 h-6 rounded-full ${truncationEnabled ? 'bg-blue-600' : 'bg-green-600'}`}></div>
          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${truncationEnabled ? 'transform translate-x-4' : ''}`}></div>
        </div>
        <div className="ml-3 text-gray-700 dark:text-gray-300">
          {truncationEnabled ? 'Compact API Responses' : 'Full API Responses'}
        </div>
      </label>
    </div>
  );
} 