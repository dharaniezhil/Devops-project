/**
 * Time validation utilities for frontend
 */

/**
 * Check if current time is within office hours (9:00 AM - 5:00 PM)
 * @param {Date} [dateTime] - Optional date to check, defaults to current time
 * @returns {Object} - Result object with isWithinOfficeHours boolean and message
 */
export const isWithinOfficeHours = (dateTime = new Date()) => {
  // Define office hours (24-hour format)
  const OFFICE_START_HOUR = 9;  // 9:00 AM
  const OFFICE_END_HOUR = 17;   // 5:00 PM (17:00)

  // Get current hour (0-23)
  const currentHour = dateTime.getHours();
  const currentMinute = dateTime.getMinutes();
  
  // Convert to minutes for more precise comparison
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const officeStartInMinutes = OFFICE_START_HOUR * 60; // 9:00 AM = 540 minutes
  const officeEndInMinutes = OFFICE_END_HOUR * 60;     // 5:00 PM = 1020 minutes

  const isWithin = currentTimeInMinutes >= officeStartInMinutes && currentTimeInMinutes < officeEndInMinutes;

  return {
    isWithinOfficeHours: isWithin,
    currentTime: dateTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    }),
    officeHours: '9:00 AM - 5:00 PM',
    message: isWithin 
      ? 'Within office hours' 
      : 'Attendance can only be marked during office hours (9:00 AM – 5:00 PM)',
    currentHour,
    officeStartHour: OFFICE_START_HOUR,
    officeEndHour: OFFICE_END_HOUR
  };
};

/**
 * Get next available office hours time
 * @param {Date} [dateTime] - Optional date to check, defaults to current time
 * @returns {Object} - Next office hours information
 */
export const getNextOfficeHours = (dateTime = new Date()) => {
  const currentHour = dateTime.getHours();
  let nextStart = new Date(dateTime);
  
  if (currentHour < 9) {
    // If before 9 AM today, next office hours is today at 9 AM
    nextStart.setHours(9, 0, 0, 0);
  } else {
    // If after office hours, next office hours is tomorrow at 9 AM
    nextStart.setDate(nextStart.getDate() + 1);
    nextStart.setHours(9, 0, 0, 0);
  }
  
  return {
    nextOfficeStart: nextStart,
    formattedTime: nextStart.toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  };
};

/**
 * Check if attendance can be marked and return appropriate message
 * @param {Date} [dateTime] - Optional date to check, defaults to current time
 * @returns {Object} - Validation result with canMark boolean and message
 */
export const canMarkAttendance = (dateTime = new Date()) => {
  const timeCheck = isWithinOfficeHours(dateTime);
  
  if (!timeCheck.isWithinOfficeHours) {
    const nextOfficeHours = getNextOfficeHours(dateTime);
    
    return {
      canMark: false,
      message: 'Mark your attendance only during office time (9:00 AM – 5:00 PM)',
      details: {
        currentTime: timeCheck.currentTime,
        officeHours: timeCheck.officeHours,
        nextOfficeStart: nextOfficeHours.formattedTime
      }
    };
  }
  
  return {
    canMark: true,
    message: 'Attendance can be marked now',
    details: {
      currentTime: timeCheck.currentTime,
      officeHours: timeCheck.officeHours
    }
  };
};

/**
 * Format time remaining until office hours
 * @param {Date} [dateTime] - Optional date to check, defaults to current time
 * @returns {string} - Formatted time remaining message
 */
export const getTimeUntilOfficeHours = (dateTime = new Date()) => {
  const currentHour = dateTime.getHours();
  const currentMinute = dateTime.getMinutes();
  
  if (currentHour < 9) {
    const minutesUntil9AM = (9 * 60) - (currentHour * 60 + currentMinute);
    const hoursUntil = Math.floor(minutesUntil9AM / 60);
    const minutesUntil = minutesUntil9AM % 60;
    
    if (hoursUntil > 0) {
      return `Office hours start in ${hoursUntil}h ${minutesUntil}m`;
    } else {
      return `Office hours start in ${minutesUntil} minutes`;
    }
  }
  
  return 'Office hours have ended for today';
};

export default {
  isWithinOfficeHours,
  getNextOfficeHours,
  canMarkAttendance,
  getTimeUntilOfficeHours
};