/**
 * Date utilities for the travel agent application
 */

/**
 * Current date constants
 */
const CURRENT_YEAR = 2025; // Hardcoded to avoid system clock issues
const CURRENT_MONTH = 4; // April (1-12)
const CURRENT_DAY = 15; // Mid-month default

/**
 * Maps month names to their numerical values (1-12)
 */
const MONTH_MAP: Record<string, number> = {
  'jan': 1, 'january': 1,
  'feb': 2, 'february': 2,
  'mar': 3, 'march': 3,
  'apr': 4, 'april': 4,
  'may': 5,
  'jun': 6, 'june': 6,
  'jul': 7, 'july': 7,
  'aug': 8, 'august': 8,
  'sep': 9, 'sept': 9, 'september': 9,
  'oct': 10, 'october': 10,
  'nov': 11, 'november': 11,
  'dec': 12, 'december': 12
};

/**
 * Convert relative date expressions into proper YYYY-MM-DD format.
 * Handles various common date formats and expressions.
 * 
 * @param dateStr User's date expression (e.g., "next month", "May 15", etc.)
 * @returns Properly formatted date string in YYYY-MM-DD format
 */
export function parseSmartDate(dateStr: string): string {
  if (!dateStr) {
    throw new Error('Date string is required');
  }
  
  // Clean up the input
  const cleaned = dateStr.trim().toLowerCase();
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  
  // Handle relative date expressions
  if (cleaned.includes('next month')) {
    const nextMonth = CURRENT_MONTH < 12 ? CURRENT_MONTH + 1 : 1;
    const year = nextMonth === 1 ? CURRENT_YEAR + 1 : CURRENT_YEAR;
    return `${year}-${nextMonth.toString().padStart(2, '0')}-15`;
  }
  
  if (cleaned.includes('next week')) {
    // Just return a date 7 days from the 15th of current month
    return `${CURRENT_YEAR}-${CURRENT_MONTH.toString().padStart(2, '0')}-22`;
  }
  
  if (cleaned.includes('tomorrow')) {
    return `${CURRENT_YEAR}-${CURRENT_MONTH.toString().padStart(2, '0')}-${(CURRENT_DAY + 1).toString().padStart(2, '0')}`;
  }
  
  if (cleaned.includes('today')) {
    return `${CURRENT_YEAR}-${CURRENT_MONTH.toString().padStart(2, '0')}-${CURRENT_DAY.toString().padStart(2, '0')}`;
  }
  
  // Handle "next [month name]"
  const nextMonthMatch = cleaned.match(/next\s+(\w+)(?:\s+(\d{1,2}))?/i);
  if (nextMonthMatch) {
    const monthName = nextMonthMatch[1];
    const day = nextMonthMatch[2] ? parseInt(nextMonthMatch[2], 10) : 15;
    
    // Handle "next month" as a general concept
    if (monthName === 'month') {
      const nextMonth = CURRENT_MONTH < 12 ? CURRENT_MONTH + 1 : 1;
      const year = nextMonth === 1 ? CURRENT_YEAR + 1 : CURRENT_YEAR;
      return `${year}-${nextMonth.toString().padStart(2, '0')}-15`;
    }
    
    // Handle specific month name
    const month = MONTH_MAP[monthName];
    if (!month) {
      throw new Error(`Unknown month: ${monthName}`);
    }
    
    // If the month is in the past or current month, use next year's occurrence
    const year = (month < CURRENT_MONTH || (month === CURRENT_MONTH && day < CURRENT_DAY)) 
      ? CURRENT_YEAR + 1 
      : CURRENT_YEAR;
    
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  
  // Handle month and day (e.g., "May 15", "May 15th", "15th of May")
  const monthDayPattern1 = /(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?/i;
  const monthDayPattern2 = /(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(\w+)/i;
  
  let monthStr, dayStr;
  
  const match1 = cleaned.match(monthDayPattern1);
  const match2 = cleaned.match(monthDayPattern2);
  
  if (match1) {
    monthStr = match1[1];
    dayStr = match1[2];
  } else if (match2) {
    monthStr = match2[2];
    dayStr = match2[1];
  }
  
  if (monthStr && dayStr) {
    const month = MONTH_MAP[monthStr];
    if (!month) {
      throw new Error(`Unknown month: ${monthStr}`);
    }
    
    const day = parseInt(dayStr, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      throw new Error(`Invalid day: ${dayStr}`);
    }
    
    // Use the current year, or next year if the date has already passed
    const year = (month < CURRENT_MONTH || (month === CURRENT_MONTH && day < CURRENT_DAY))
      ? CURRENT_YEAR + 1
      : CURRENT_YEAR;
    
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  
  // Try to parse MM-DD format
  const mmddMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (mmddMatch) {
    const month = parseInt(mmddMatch[1], 10);
    const day = parseInt(mmddMatch[2], 10);
    
    if (month < 1 || month > 12) {
      throw new Error(`Invalid month: ${month}`);
    }
    
    if (day < 1 || day > 31) {
      throw new Error(`Invalid day: ${day}`);
    }
    
    // Use the current year, or next year if the date has already passed
    const year = (month < CURRENT_MONTH || (month === CURRENT_MONTH && day < CURRENT_DAY))
      ? CURRENT_YEAR + 1
      : CURRENT_YEAR;
    
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  
  // Handle month only (e.g., "May", "November")
  for (const [monthName, monthNum] of Object.entries(MONTH_MAP)) {
    if (cleaned === monthName || cleaned.includes(monthName)) {
      // Use the 15th of the month as default day
      const year = (monthNum < CURRENT_MONTH) ? CURRENT_YEAR + 1 : CURRENT_YEAR;
      return `${year}-${monthNum.toString().padStart(2, '0')}-15`;
    }
  }
  
  // If all else fails, make a best guess based on the current date
  // Here we assume "next month" when we can't parse the date
  const nextMonth = CURRENT_MONTH < 12 ? CURRENT_MONTH + 1 : 1;
  const year = nextMonth === 1 ? CURRENT_YEAR + 1 : CURRENT_YEAR;
  
  console.warn(`Could not parse date: "${dateStr}" - defaulting to next month`);
  return `${year}-${nextMonth.toString().padStart(2, '0')}-15`;
} 