// src/utils/constants.js

// Complaint Status Constants
export const COMPLAINT_STATUSES = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',  // Backend expects two words with space
  RESOLVED: 'Resolved'
};

// Status flow order for UI display
export const STATUS_ORDER = [
  COMPLAINT_STATUSES.PENDING,
  COMPLAINT_STATUSES.IN_PROGRESS,
  COMPLAINT_STATUSES.RESOLVED
];

// Status colors for UI
export const STATUS_COLORS = {
  [COMPLAINT_STATUSES.PENDING]: '#fbbf24',     // Yellow
  [COMPLAINT_STATUSES.IN_PROGRESS]: '#3b82f6', // Blue  
  [COMPLAINT_STATUSES.RESOLVED]: '#10b981'     // Green
};

// Status icons for UI
export const STATUS_ICONS = {
  [COMPLAINT_STATUSES.PENDING]: '⏳',
  [COMPLAINT_STATUSES.IN_PROGRESS]: '🔄',
  [COMPLAINT_STATUSES.RESOLVED]: '✅'
};

// Default status when admin assigns complaint
export const DEFAULT_STATUS = COMPLAINT_STATUSES.PENDING;

// Valid status transitions for validation
export const STATUS_TRANSITIONS = {
  [COMPLAINT_STATUSES.PENDING]: [COMPLAINT_STATUSES.IN_PROGRESS, COMPLAINT_STATUSES.RESOLVED],
  [COMPLAINT_STATUSES.IN_PROGRESS]: [COMPLAINT_STATUSES.PENDING, COMPLAINT_STATUSES.RESOLVED],
  [COMPLAINT_STATUSES.RESOLVED]: [COMPLAINT_STATUSES.PENDING, COMPLAINT_STATUSES.IN_PROGRESS]
};

// Helper function to get status display name
export const getStatusDisplayName = (status) => {
  return STATUS_ORDER.includes(status) ? status : COMPLAINT_STATUSES.PENDING;
};

// Helper function to validate status
export const isValidStatus = (status) => {
  return STATUS_ORDER.includes(status);
};