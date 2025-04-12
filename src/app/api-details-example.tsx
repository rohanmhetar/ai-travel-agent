"use client";

import { useState } from 'react';
import ApiCallDetails from '../components/ApiCallDetails';

export default function ApiDetailsExample() {
  // Sample API calls
  const sampleApiCalls = [
    {
      apiName: 'searchFlights',
      endpoint: '/v2/shopping/flight-offers',
      requestData: {
        originLocationCode: 'JFK',
        destinationLocationCode: 'CDG',
        departureDate: '2023-12-15',
        adults: 1,
        max: 5
      },
      responseData: {
        data: [
          {
            type: 'flight-offer',
            id: '1',
            source: 'GDS',
            price: {
              currency: 'USD',
              total: '540.02',
              base: '450.00',
              fees: [
                {
                  amount: '50.02',
                  type: 'SUPPLIER'
                },
                {
                  amount: '40.00',
                  type: 'TICKETING'
                }
              ]
            },
            itineraries: [
              {
                duration: 'PT8H30M',
                segments: [
                  {
                    departure: {
                      iataCode: 'JFK',
                      at: '2023-12-15T18:00:00'
                    },
                    arrival: {
                      iataCode: 'CDG',
                      at: '2023-12-16T07:30:00'
                    },
                    carrierCode: 'AF',
                    number: '1234',
                    duration: 'PT8H30M'
                  }
                ]
              }
            ],
            travelerPricings: [
              {
                travelerId: '1',
                fareOption: 'STANDARD',
                travelerType: 'ADULT',
                price: {
                  currency: 'USD',
                  total: '540.02'
                }
              }
            ]
          }
        ],
        dictionaries: {
          carriers: {
            'AF': 'Air France'
          }
        }
      }
    },
    {
      apiName: 'searchHotelsByCity',
      endpoint: '/v1/reference-data/locations/hotels/by-city',
      requestData: {
        cityCode: 'PAR',
        radius: 5,
        radiusUnit: 'KM',
        ratings: '3,4,5',
        hotelSource: 'ALL'
      },
      responseData: {
        data: [
          {
            chainCode: 'AC',
            iataCode: 'PAR',
            dupeId: 700033769,
            name: 'GRAND HOTEL PARIS',
            hotelId: 'ACPAR423',
            geoCode: {
              latitude: 48.87373,
              longitude: 2.29568
            },
            address: {
              countryCode: 'FR'
            },
            distance: {
              value: 1.2,
              unit: 'KM'
            }
          },
          {
            chainCode: 'RT',
            iataCode: 'PAR',
            dupeId: 700060867,
            name: 'HOTEL EIFFEL TOWER VIEW',
            hotelId: 'RTPAR621',
            geoCode: {
              latitude: 48.85837,
              longitude: 2.29450
            },
            address: {
              countryCode: 'FR'
            },
            distance: {
              value: 2.3,
              unit: 'KM'
            }
          }
        ],
        meta: {
          count: 2,
          links: {
            self: "https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=PAR"
          }
        }
      }
    },
    {
      apiName: 'searchActivities',
      endpoint: '/v1/shopping/activities',
      requestData: {
        latitude: 48.8566,
        longitude: 2.3522,
        radius: 20
      },
      responseData: {
        data: [
          {
            id: "3548",
            type: "activity",
            name: "Eiffel Tower Priority Access",
            shortDescription: "Skip the line to the 2nd floor of the Eiffel Tower",
            geoCode: {
              latitude: 48.8583,
              longitude: 2.2945
            },
            price: {
              amount: "42.00",
              currencyCode: "EUR"
            },
            pictures: ["https://example.com/eiffel.jpg"],
            bookingLink: "https://example.com/book/3548"
          },
          {
            id: "5912",
            type: "activity",
            name: "Louvre Museum Guided Tour",
            shortDescription: "Guided 2-hour tour of the Louvre's masterpieces",
            geoCode: {
              latitude: 48.8606,
              longitude: 2.3376
            },
            price: {
              amount: "65.00",
              currencyCode: "EUR"
            },
            pictures: ["https://example.com/louvre.jpg"],
            bookingLink: "https://example.com/book/5912"
          }
        ],
        meta: {
          count: 2,
          links: {
            self: "https://test.api.amadeus.com/v1/shopping/activities?latitude=48.8566&longitude=2.3522"
          }
        }
      }
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Amadeus API Calls Example</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          This example demonstrates the collapsible "Show Your Work" component that displays Amadeus API call details. 
          Each expandable section below shows a different type of Amadeus API call with its request parameters and response data.
        </p>
        
        <div className="space-y-4">
          {sampleApiCalls.map((apiCall, index) => (
            <ApiCallDetails 
              key={index}
              apiName={apiCall.apiName}
              endpoint={apiCall.endpoint}
              requestData={apiCall.requestData}
              responseData={apiCall.responseData}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 