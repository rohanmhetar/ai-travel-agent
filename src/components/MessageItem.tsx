"use client";

import { FiUser } from 'react-icons/fi';
import { BsRobot } from 'react-icons/bs';
import ReactMarkdown from 'react-markdown';
import { IoAirplaneOutline } from 'react-icons/io5';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id: string;
  isStreaming?: boolean;
  hasFlightResults?: boolean;
}

interface MessageItemProps {
  message: Message;
  onViewFlightResults?: () => void;
}

export default function MessageItem({ message, onViewFlightResults }: MessageItemProps) {
  const isUser = message.role === 'user';
  
  // Format code blocks in message
  let formattedContent = message.content || '';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`flex max-w-[85%] ${
          isUser
            ? 'bg-blue-500 text-white rounded-2xl rounded-tr-none shadow-sm'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-none shadow-sm'
        } p-4`}
      >
        <div className="flex-shrink-0 mr-4">
          {isUser ? (
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
              <FiUser className="text-white" />
            </div>
          ) : (
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <BsRobot className="text-blue-500 dark:text-blue-400" />
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className={`font-medium ${isUser ? 'text-blue-50' : 'text-gray-800 dark:text-gray-100'}`}>
            {isUser ? 'You' : 'Travel Agent'}
          </div>
          <div className={`mt-1 message-content ${isUser ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
            {message.isStreaming ? (
              <div className="flex items-center h-6">
                <div className="dot-typing"></div>
              </div>
            ) : (
              <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'dark:prose-invert'}`}>
                <ReactMarkdown 
                  disallowedElements={['img']}
                  unwrapDisallowed
                >
                  {formattedContent}
                </ReactMarkdown>
                
                {/* Flight Results Prompt */}
                {!isUser && message.hasFlightResults && onViewFlightResults && (
                  <div 
                    className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 text-blue-500 dark:text-blue-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                    onClick={onViewFlightResults}
                  >
                    <IoAirplaneOutline className="text-lg" />
                    <span className="font-medium">View flight options in sidebar</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 