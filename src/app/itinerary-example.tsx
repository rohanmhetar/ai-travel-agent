"use client";

import ItineraryView from "@/components/ItineraryView";

export default function ItineraryExample() {
  // Sample itinerary data
  const itineraryData = {
    title: "Japan Adventure - Tokyo & Kyoto",
    days: [
      {
        date: "June 10, 2023",
        day: 1,
        location: "Tokyo, Japan",
        events: [
          {
            id: "event-1",
            time: "14:00",
            title: "Check-in at Shinjuku Park Hotel",
            description: "Modern hotel in central Tokyo with views of Shinjuku Gyoen National Garden. Room amenities include free Wi-Fi, flat-screen TV, and minibar.\n\nAddress: 2-5-1 Yoyogi, Shibuya-ku, Tokyo 151-0053\nPhone: +81-3-5361-7111",
            type: "accommodation",
            location: "Shinjuku, Tokyo",
          },
          {
            id: "event-2",
            time: "17:30",
            title: "Evening walk in Shinjuku",
            description: "Explore the vibrant streets of Shinjuku, one of Tokyo's most bustling districts. Visit Shinjuku Golden Gai, a network of narrow alleys filled with tiny bars, and see the famous neon lights of Kabukicho.",
            type: "activity",
            location: "Shinjuku, Tokyo",
            duration: "2 hours"
          },
          {
            id: "event-3",
            time: "20:00",
            title: "Dinner at Ichiran Ramen",
            description: "Enjoy an authentic Japanese dining experience at the famous Ichiran Ramen, known for their tonkotsu ramen and individual dining booths. Order via the vending machine at the entrance and customize your ramen to your taste.",
            type: "dining",
            location: "Shinjuku, Tokyo",
            duration: "1 hour"
          }
        ]
      },
      {
        date: "June 11, 2023",
        day: 2,
        location: "Tokyo, Japan",
        events: [
          {
            id: "event-4",
            time: "08:00",
            title: "Breakfast at hotel",
            description: "Buffet breakfast at the hotel restaurant with Japanese and Western options.",
            type: "dining",
            location: "Shinjuku Park Hotel",
            duration: "1 hour"
          },
          {
            id: "event-5",
            time: "09:30",
            title: "Tsukiji Outer Market",
            description: "Visit the lively outer market of the former Tsukiji Fish Market. Sample fresh seafood, Japanese street food, and browse shops selling kitchen tools and souvenirs.",
            type: "activity",
            location: "Tsukiji, Tokyo",
            duration: "2.5 hours"
          },
          {
            id: "event-6",
            time: "13:00",
            title: "Tokyo National Museum",
            description: "Explore Japan's oldest and largest museum, home to the world's largest collection of Japanese art and antiquities. Don't miss the samurai armor, ancient pottery, and beautiful ukiyo-e paintings.",
            type: "activity",
            location: "Ueno Park, Tokyo",
            duration: "3 hours"
          },
          {
            id: "event-7",
            time: "19:00",
            title: "Dinner in Akihabara",
            description: "Experience dinner in the anime and electronics district of Akihabara. Visit a themed cafe or try a traditional izakaya for casual Japanese dining.",
            type: "dining",
            location: "Akihabara, Tokyo",
            duration: "2 hours"
          }
        ]
      },
      {
        date: "June 12, 2023",
        day: 3,
        location: "Tokyo to Kyoto, Japan",
        events: [
          {
            id: "event-8",
            time: "07:30",
            title: "Check-out from Shinjuku Park Hotel",
            description: "Check out and store luggage with the concierge if needed.",
            type: "accommodation",
            location: "Shinjuku, Tokyo",
          },
          {
            id: "event-9",
            time: "09:15",
            title: "Shinkansen to Kyoto",
            description: "Take the bullet train from Tokyo Station to Kyoto Station. The journey takes approximately 2 hours and 15 minutes on the Nozomi Shinkansen.\n\nReservation: Car 14, Seats 3A and 3B\nTrain Number: Nozomi 123",
            type: "transportation",
            location: "Tokyo Station → Kyoto Station",
            duration: "2h 15m"
          },
          {
            id: "event-10",
            time: "12:00",
            title: "Check-in at Kyoto Century Hotel",
            description: "Modern hotel conveniently located near Kyoto Station. Room includes free Wi-Fi, flat-screen TV, and traditional Japanese tea set.\n\nAddress: 680 Higashi Shiokoji-cho, Shimogyo-ku, Kyoto 600-8216\nPhone: +81-75-351-0111",
            type: "accommodation",
            location: "Shimogyo-ku, Kyoto",
          },
          {
            id: "event-11",
            time: "14:00",
            title: "Fushimi Inari Shrine",
            description: "Visit the iconic shrine famous for its thousands of vermilion torii gates that wind through the hills behind the main shrine buildings. The full trail takes about 2-3 hours to walk, but you can turn back at any point.",
            type: "activity",
            location: "Fushimi Ward, Kyoto",
            duration: "3 hours"
          },
          {
            id: "event-12",
            time: "19:00",
            title: "Dinner in Pontocho Alley",
            description: "Experience traditional Kyoto dining in this atmospheric narrow alley lined with restaurants. Many establishments have terraces overlooking the Kamogawa River during summer months.",
            type: "dining",
            location: "Central Kyoto",
            duration: "2 hours"
          }
        ]
      }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Itinerary Example</h1>
      <ItineraryView 
        title={itineraryData.title}
        days={itineraryData.days}
      />
    </div>
  );
} 