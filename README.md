# AI Travel Agent

An AI-powered travel agent that uses real-time Amadeus API data to search for flights, hotels, activities, and transfers.



https://github.com/user-attachments/assets/33be5328-b049-4d53-9dc4-13c44ddc816f



## Quick Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/yourusername/travel-agent.git
   cd travel-agent
   npm install
   ```

2. **Set Up API Keys**
   - Create a `.env.local` file in the project root:
   ```
   # OpenAI API Key (Required)
   OPENAI_API_KEY=your_openai_api_key_here

   # Amadeus API Credentials (Required)
   AMADEUS_API_KEY=your_amadeus_api_key_here
   AMADEUS_API_SECRET=your_amadeus_api_secret_here
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

## Detailed Setup Guide

### Prerequisites
- Node.js 18+ and npm installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Amadeus API key and secret (Steps below)

### Getting Amadeus API Credentials
1. Create a free account at [Amadeus for Developers](https://developers.amadeus.com/)
2. After login, navigate to "My Self-Service Workspace"
3. Create a new application with the following APIs enabled:
   - Flight Offers Search
   - Hotel Search
   - Points of Interest
   - Airport & City Search
   - Transfer Search 
4. After creating the application, copy the API Key and API Secret

### Environment Variables Explained
- `OPENAI_API_KEY`: Your OpenAI API key for AI chat capabilities
- `AMADEUS_API_KEY`: Your Amadeus API key from the developer portal
- `AMADEUS_API_SECRET`: Your Amadeus API secret from the developer portal

### Troubleshooting
- **API Rate Limits**: Amadeus free tier has rate limits (5 calls/second, 5000 calls/month)
- **CORS Issues**: Run the app on http://localhost:3000 to avoid CORS problems
- **OpenAI Errors**: Check if your OpenAI API key is valid and has sufficient credits

## Usage Guide

### Example Queries
- "Find flights from NYC to Paris from May 10 to May 17, 2025"
- "Show me hotels in London near the city center"
- "What activities are available in Barcelona next week?"
- "I need a transfer from CDG airport to the Eiffel Tower"
- "Help me plan a trip to Rome for next month"

### Features
- **Real-time Data**: All flight, hotel, activity, and transfer information is from live Amadeus APIs
- **Multi-step Trip Planning**: The system guides users through booking flights, hotels, activities and transfers
- **Interactive Results**: Sidebars display detailed search results that can be further explored
- **Show Your Work**: See the API calls and reasoning behind each recommendation

## Development Information

### Project Structure
```
travel-agent/
├── public/           # Static assets
├── src/
│   ├── app/          # Next.js app router files
│   │   ├── api/      # API routes for backend functionality
│   │   │   ├── chat/           # Main chat API endpoint
│   │   │   ├── chat-status/    # API status tracking
│   │   │   └── chat/stream/    # Streaming API endpoint
│   ├── components/   # React components
│   │   ├── Chat.tsx            # Main chat interface
│   │   ├── FlightResultsSidebar.tsx  # Flight results display
│   │   └── TravelResults.tsx   # Hotel results display
│   ├── utils/        # Utility functions
│   │   ├── amadeus.ts          # Amadeus API client
│   │   ├── config.ts           # Configuration settings
│   │   ├── dates.ts            # Date formatting helpers
│   │   └── openai.ts           # OpenAI API integration
│   └── app/page.tsx  # Main application page
└── .env.local        # Environment variables (create this)
```

### Key Technologies
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **APIs**: OpenAI API (GPT models), Amadeus Travel APIs
- **Data Handling**: TypeScript, JSON

### Customization
- Edit `src/utils/config.ts` to adjust:
  - AI models (GPT-4o, GPT-3.5-Turbo)
  - API response limits
  - UI preferences

## License
MIT

# Travel Agent Performance Improvements

This project includes several optimizations to make the chat interface more responsive and efficient:

## Performance Enhancements

1. **GPT-4o-mini Integration**: Using the faster, more efficient GPT-4o-mini model by default for better response times and reduced token usage.

2. **API Response Compression**: All API responses are heavily compressed to reduce token usage:
   - Limiting arrays to 1-2 items per type
   - Reducing object nesting depth
   - Truncating long string values
   - Removing unnecessary data like dictionaries and metadata

3. **Configurable Settings**: New configuration file (`src/utils/config.ts`) providing centralized control over:
   - Model selection (gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo)
   - Response token limits
   - API response compression settings
   - Maximum results per API type

4. **Improved API Call Visibility**: "Show Your Work" section always displays for travel-related queries, even when no API calls were made or when they fail.

## Usage

The system is designed to maintain context while significantly reducing token usage. This makes it much more responsive and cost-effective, especially for complex travel queries that involve multiple API calls.

For advanced users who need full context, the POWERFUL model option can be enabled in the configuration.
