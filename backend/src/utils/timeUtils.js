/**
 * Time validation utilities for office hours
 */

/**
 * Check if current time is within office hours (9:00 AM - 5:00 PM)
 * @param {Date} [dateTime] - Optional date to check, defaults to current time
 * @returns {Object} - Result object with isWithinOfficeHours boolean and message
 */
const isWithinOfficeHours = (dateTime = new Date()) => {
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
      : 'Attendance can only be marked during office hours (9:00 AM – 5:00 PM). Please try again during office time.',
    currentHour,
    officeStartHour: OFFICE_START_HOUR,
    officeEndHour: OFFICE_END_HOUR
  };
};

/**
 * Check if a specific time falls within office hours
 * @param {number} hour - Hour in 24-hour format (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {boolean} - True if within office hours
 */
const isTimeWithinOfficeHours = (hour, minute = 0) => {
  const OFFICE_START_HOUR = 9;
  const OFFICE_END_HOUR = 17;
  
  const timeInMinutes = hour * 60 + minute;
  const officeStartInMinutes = OFFICE_START_HOUR * 60;
  const officeEndInMinutes = OFFICE_END_HOUR * 60;
  
  return timeInMinutes >= officeStartInMinutes && timeInMinutes < officeEndInMinutes;
};

/**
 * Get next available office hours time
 * @param {Date} [dateTime] - Optional date to check, defaults to current time
 * @returns {Object} - Next office hours information
 */
const getNextOfficeHours = (dateTime = new Date()) => {
  const tomorrow = new Date(dateTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0); // Set to 9:00 AM tomorrow
  
  return {
    nextOfficeStart: tomorrow,
    formattedTime: tomorrow.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  };
};

/**
 * Validate attendance time and return appropriate response
 * @param {Date} [dateTime] - Optional date to check, defaults to current time
 * @returns {Object} - Validation result
 */
const validateAttendanceTime = (dateTime = new Date()) => {
  const timeCheck = isWithinOfficeHours(dateTime);
  
  if (!timeCheck.isWithinOfficeHours) {
    const nextOfficeHours = getNextOfficeHours(dateTime);
    
    return {
      isValid: false,
      error: true,
      message: timeCheck.message,
      details: {
        currentTime: timeCheck.currentTime,
        officeHours: timeCheck.officeHours,
        nextOfficeStart: nextOfficeHours.formattedTime
      }
    };
  }
  
  return {
    isValid: true,
    error: false,
    message: 'Attendance can be marked now',
    details: {
      currentTime: timeCheck.currentTime,
      officeHours: timeCheck.officeHours
    }
  };
};

module.exports = {
  isWithinOfficeHours,
  isTimeWithinOfficeHours,
  getNextOfficeHours,
  validateAttendanceTime
};