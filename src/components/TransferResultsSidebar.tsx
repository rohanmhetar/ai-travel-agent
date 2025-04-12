"use client";

import { useState } from 'react';
import { FiX, FiChevronRight, FiChevronDown, FiMapPin, FiCalendar, FiDollarSign, FiInfo, FiExternalLink, FiClock } from 'react-icons/fi';
import { FaTaxi, FaBusAlt, FaCar } from 'react-icons/fa';

interface TransferResultsSidebarProps {
  results: any[];
  onClose: () => void;
  onRequestDetails: (transferId: string) => void;
}

export default function TransferResultsSidebar({ 
  results, 
  onClose,
  onRequestDetails 
}: TransferResultsSidebarProps) {
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
          <FaTaxi className="mr-2 text-yellow-500" />
          Transfer Results ({results.length})
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
          {results.map((transfer, index) => (
            <TransferCard 
              key={index} 
              transfer={transfer} 
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

// Format currency with Intl API
const formatCurrency = (amount: number | string, currencyCode: string) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(numericAmount);
  } catch (error) {
    // Fallback in case of invalid currency code
    return `${currencyCode} ${numericAmount}`;
  }
};

// Format date/time
const formatDateTime = (dateTimeStr: string) => {
  try {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  } catch (error) {
    return { date: 'Invalid date', time: '' };
  }
};

// Helper to get vehicle icon
const getVehicleIcon = (vehicleCode: string) => {
  // Return appropriate icon based on vehicle type/code
  switch(vehicleCode?.toUpperCase()) {
    case 'SEDAN':
    case 'LMN':
      return <FaCar className="text-gray-700 dark:text-gray-300" />;
    case 'VAN':
    case 'MPV':
      return <FaBusAlt className="text-gray-700 dark:text-gray-300" />;
    default:
      return <FaTaxi className="text-gray-700 dark:text-gray-300" />;
  }
};

// Transfer Card Component
function TransferCard({ 
  transfer, 
  index, 
  expandedItems, 
  toggleExpand,
  onRequestDetails
}: { 
  transfer: any;
  index: number;
  expandedItems: Record<string, boolean>;
  toggleExpand: (id: string) => void;
  onRequestDetails: (transferId: string) => void;
}) {
  const id = `transfer-${index}`;
  const isExpanded = expandedItems[id] || false;
  
  const handleRequestDetails = () => {
    onRequestDetails(transfer.id);
  };

  // Get locations from the transfer data
  const startLocation = transfer.start?.locationCode || 'Unknown Start';
  const endLocation = transfer.end?.name || transfer.end?.address?.cityName || transfer.end?.locationCode || 'Unknown Destination';
  
  // Calculate price information
  const price = transfer.quotation?.monetaryAmount || '0';
  const currency = transfer.quotation?.currencyCode || 'USD';
  
  // Format departure time
  const { date, time } = formatDateTime(transfer.start?.dateTime || new Date().toISOString());
  
  // Get transfer type and vehicle info
  const transferType = transfer.transferType || 'PRIVATE';
  const vehicleCode = transfer.vehicle?.code || '';
  const vehicleDescription = transfer.vehicle?.description || 'Vehicle';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4">
        {/* Transfer header */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <div className="flex items-center">
            <span className="bg-yellow-50 dark:bg-yellow-900/30 rounded-full p-1 mr-2">
              {getVehicleIcon(vehicleCode)}
            </span>
            <span className="font-medium">{transferType} TRANSFER</span>
            {transfer.id && (
              <>
                <span className="mx-2 font-bold">•</span>
                <span className="text-xs">ID: {transfer.id}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Transfer route */}
        <div className="flex flex-col mb-3">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
            {startLocation} → {endLocation}
          </h3>
          
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
            <div className="flex items-center">
              <FiCalendar className="mr-1" size={14} />
              <span>{date}</span>
            </div>
            <div className="flex items-center">
              <FiClock className="mr-1" size={14} />
              <span>{time}</span>
            </div>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2">
            {/* Vehicle info */}
            <div className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center">
              {getVehicleIcon(vehicleCode)}
              <span className="ml-1">{vehicleDescription}</span>
            </div>
            
            {/* Distance if available */}
            {transfer.distance && (
              <div className="text-sm px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full flex items-center">
                <FiMapPin className="mr-1" size={14} />
                <span>{transfer.distance.value} {transfer.distance.unit}</span>
              </div>
            )}
            
            {/* Service provider */}
            {transfer.serviceProvider?.name && (
              <div className="text-sm px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full">
                {transfer.serviceProvider.name}
              </div>
            )}
          </div>
        </div>
        
        {/* Price and actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="font-bold text-lg text-yellow-600 dark:text-yellow-400">
            {formatCurrency(price, currency)}
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
              className="px-3 py-1 text-sm text-white bg-yellow-500 hover:bg-yellow-600 rounded-md flex items-center transition-colors"
            >
              More Info
              <FiExternalLink className="ml-1" />
            </button>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3 bg-gray-50 dark:bg-gray-850">
          {/* Vehicle details */}
          {transfer.vehicle && (
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Vehicle</h3>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center mb-1">
                  {getVehicleIcon(transfer.vehicle.code)}
                  <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">{transfer.vehicle.description || transfer.vehicle.code}</span>
                </div>
                {transfer.vehicle.seats && transfer.vehicle.seats.length > 0 && (
                  <div className="mt-1">
                    <span className="font-medium">Seats:</span> {transfer.vehicle.seats[0].count || 'N/A'}
                  </div>
                )}
                {transfer.vehicle.baggages && transfer.vehicle.baggages.length > 0 && (
                  <div className="mt-1">
                    <span className="font-medium">Baggage:</span> {transfer.vehicle.baggages[0].count || 'N/A'} {transfer.vehicle.baggages[0].size || ''} bags
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Price details */}
          {transfer.quotation && (
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Price Details</h3>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-sm">
                {transfer.quotation.base && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Base Price:</span>
                    <span>{formatCurrency(transfer.quotation.base.monetaryAmount, transfer.quotation.currencyCode)}</span>
                  </div>
                )}
                
                {transfer.quotation.discount && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount:</span>
                    <span>-{formatCurrency(transfer.quotation.discount.monetaryAmount, transfer.quotation.currencyCode)}</span>
                  </div>
                )}
                
                {transfer.quotation.totalTaxes && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Taxes:</span>
                    <span>{formatCurrency(transfer.quotation.totalTaxes.monetaryAmount, transfer.quotation.currencyCode)}</span>
                  </div>
                )}
                
                {transfer.quotation.fees && transfer.quotation.fees.length > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Fees:</span>
                    <span>{formatCurrency(transfer.quotation.fees[0].monetaryAmount, transfer.quotation.currencyCode)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  <span>Total:</span>
                  <span>
                    {(() => {
                      // Calculate correctly summed total
                      let calculatedTotal = 0;
                      
                      // Add base amount
                      if (transfer.quotation.base?.monetaryAmount) {
                        calculatedTotal += parseFloat(transfer.quotation.base.monetaryAmount);
                      }
                      
                      // Add taxes
                      if (transfer.quotation.totalTaxes?.monetaryAmount) {
                        calculatedTotal += parseFloat(transfer.quotation.totalTaxes.monetaryAmount);
                      }
                      
                      // Subtract discount
                      if (transfer.quotation.discount?.monetaryAmount) {
                        calculatedTotal -= parseFloat(transfer.quotation.discount.monetaryAmount);
                      }
                      
                      // Add fees
                      if (transfer.quotation.fees && transfer.quotation.fees.length > 0) {
                        calculatedTotal += parseFloat(transfer.quotation.fees[0].monetaryAmount || 0);
                      }
                      
                      // Display corrected total (or API total if calculation fails)
                      return formatCurrency(calculatedTotal || transfer.quotation.monetaryAmount, transfer.quotation.currencyCode);
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Location details */}
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Route</h3>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start mb-2">
                <div className="w-20 font-medium">From:</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-700 dark:text-gray-300">{startLocation}</div>
                  <div className="text-xs mt-0.5">{time} on {date}</div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-20 font-medium">To:</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-700 dark:text-gray-300">{endLocation}</div>
                  {transfer.end?.address && (
                    <div className="text-xs mt-0.5">
                      {transfer.end.address.line && `${transfer.end.address.line}, `}
                      {transfer.end.address.cityName && `${transfer.end.address.cityName}, `}
                      {transfer.end.address.countryCode}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Cancellation policies if available */}
          {transfer.cancellationRules && transfer.cancellationRules.length > 0 && (
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cancellation Policy</h3>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                {transfer.cancellationRules.map((rule: any, idx: number) => (
                  <div key={idx} className="mb-1 last:mb-0">
                    {rule.metricType === 'DAYS' && (
                      <span>
                        {rule.metricMin === '0' && rule.metricMax === '1' 
                          ? 'Within 24 hours of departure: ' 
                          : `${rule.metricMin}-${rule.metricMax} days before departure: `}
                        {rule.feeType === 'PERCENTAGE' && `${rule.feeValue}% fee`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 