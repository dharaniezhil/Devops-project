// src/utils/statusMigration.js
// Utility functions to help migrate and validate complaint statuses

import { COMPLAINT_STATUSES, isValidStatus } from './constants';

// Legacy status mapping for migration
export const LEGACY_STATUS_MAP = {
  'Pending': COMPLAINT_STATUSES.PENDING,
  'In Progress': COMPLAINT_STATUSES.IN_PROGRESS,
  'Inprogress': COMPLAINT_STATUSES.IN_PROGRESS,
  'Resolved': COMPLAINT_STATUSES.RESOLVED,
  // Legacy statuses that should be migrated
  'Assigned': COMPLAINT_STATUSES.PENDING, // Admin assigns -> Pending
  'Completed': COMPLAINT_STATUSES.RESOLVED, // Labour completes -> Admin resolves
  'Rejected': COMPLAINT_STATUSES.RESOLVED, // Treat as resolved for now
};

/**
 * Migrate a complaint status from legacy format to new format
 * @param {string} legacyStatus - The legacy status
 * @returns {string} - The new status format
 */
export const migrateStatus = (legacyStatus) => {
  if (!legacyStatus) return COMPLAINT_STATUSES.PENDING;
  
  const migrated = LEGACY_STATUS_MAP[legacyStatus];
  return migrated || COMPLAINT_STATUSES.PENDING;
};

/**
 * Migrate an array of complaints to use new status format
 * @param {Array} complaints - Array of complaint objects
 * @returns {Array} - Array of complaints with migrated statuses
 */
export const migrateComplaints = (complaints) => {
  if (!Array.isArray(complaints)) return [];
  
  return complaints.map(complaint => ({
    ...complaint,
    status: migrateStatus(complaint.status)
  }));
};

/**
 * Validate and normalize a status value
 * @param {string} status - Status to validate
 * @returns {string} - Valid status or default
 */
export const normalizeStatus = (status) => {
  if (isValidStatus(status)) return status;
  return migrateStatus(status);
};

/**
 * Get status display information
 * @param {string} status - The status value
 * @returns {Object} - Display information for the status
 */
export const getStatusDisplay = (status) => {
  const normalizedStatus = normalizeStatus(status);
  
  const displays = {
    [COMPLAINT_STATUSES.PENDING]: {
      label: 'Pending',
      icon: '⏳',
      color: '#fbbf24',
      description: 'Complaint has been submitted and is awaiting review'
    },
    [COMPLAINT_STATUSES.IN_PROGRESS]: {
      label: 'Inprogress',
      icon: '🔄',
      color: '#3b82f6',
      description: 'Complaint is being actively worked on'
    },
    [COMPLAINT_STATUSES.RESOLVED]: {
      label: 'Resolved',
      icon: '✅',
      color: '#10b981',
      description: 'Complaint has been resolved and marked complete'
    }
  };
  
  return displays[normalizedStatus] || displays[COMPLAINT_STATUSES.PENDING];
};

/**
 * Check if status transition is valid
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {boolean} - Whether transition is allowed
 */
export const isValidStatusTransition = (fromStatus, toStatus) => {
  const normalizedFrom = normalizeStatus(fromStatus);
  const normalizedTo = normalizeStatus(toStatus);
  
  // Admin can change status to any valid status
  // This implements the manual admin control requirement
  return isValidStatus(normalizedTo);
};