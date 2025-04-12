"use client";

import { useState, FormEvent, KeyboardEvent, useRef, useEffect } from 'react';
import { FiSend, FiX, FiMic, FiLoader } from 'react-icons/fi';

interface UserInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isStreaming?: boolean;
}

export default function UserInput({
  onSubmit,
  disabled = false,
  placeholder = "Ask me about travel planning...",
  isStreaming = false
}: UserInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSubmit(message);
      setMessage('');
      
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleReset = () => {
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sticky bottom-0">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2"
      >
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isStreaming}
            placeholder={placeholder}
            rows={1}
            className="w-full resize-none rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 pr-10 text-gray-800 dark:text-gray-200 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-80"
          />
          {message && (
            <button
              type="button"
              onClick={handleReset}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              aria-label="Clear message"
            >
              <FiX className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <button
          type="submit"
          disabled={disabled || !message.trim() || isStreaming}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-blue-600"
        >
          {isStreaming ? (
            <FiLoader className="h-5 w-5 animate-spin" />
          ) : (
            <FiSend className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  );
} 