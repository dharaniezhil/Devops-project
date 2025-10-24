// src/utils/statusVerification.js
// Utility to verify status consistency across the application

import { COMPLAINT_STATUSES, STATUS_ORDER, isValidStatus } from './constants';

/**
 * Verify that all complaints have valid statuses
 * @param {Array} complaints - Array of complaint objects
 * @returns {Object} - Verification result with stats and issues
 */
export const verifyComplaintStatuses = (complaints) => {
  if (!Array.isArray(complaints)) {
    return {
      valid: false,
      error: 'Complaints is not an array',
      stats: null,
      issues: []
    };
  }

  const issues = [];
  const statusCounts = {
    [COMPLAINT_STATUSES.PENDING]: 0,
    [COMPLAINT_STATUSES.IN_PROGRESS]: 0,
    [COMPLAINT_STATUSES.RESOLVED]: 0,
    'INVALID': 0
  };

  const invalidStatuses = new Set();

  complaints.forEach((complaint, index) => {
    const status = complaint?.status;
    
    if (!status) {
      issues.push({
        type: 'MISSING_STATUS',
        complaintId: complaint?._id || complaint?.id || `index-${index}`,
        message: 'Complaint has no status field'
      });
      statusCounts.INVALID++;
      return;
    }

    if (isValidStatus(status)) {
      statusCounts[status]++;
    } else {
      statusCounts.INVALID++;
      invalidStatuses.add(status);
      issues.push({
        type: 'INVALID_STATUS',
        complaintId: complaint?._id || complaint?.id || `index-${index}`,
        status: status,
        message: `Invalid status: "${status}". Expected one of: ${STATUS_ORDER.join(', ')}`
      });
    }
  });

  const stats = {
    total: complaints.length,
    pending: statusCounts[COMPLAINT_STATUSES.PENDING],
    inprogress: statusCounts[COMPLAINT_STATUSES.IN_PROGRESS],
    resolved: statusCounts[COMPLAINT_STATUSES.RESOLVED],
    invalid: statusCounts.INVALID,
    invalidStatuses: Array.from(invalidStatuses)
  };

  return {
    valid: issues.length === 0,
    stats,
    issues,
    summary: {
      totalComplaints: complaints.length,
      validComplaints: complaints.length - statusCounts.INVALID,
      invalidComplaints: statusCounts.INVALID,
      uniqueInvalidStatuses: invalidStatuses.size
    }
  };
};

/**
 * Log complaint status verification to console
 * @param {Array} complaints - Array of complaint objects
 * @param {string} context - Context for logging (e.g., 'ManageComplaints', 'Dashboard')
 */
export const logStatusVerification = (complaints, context = 'Unknown') => {
  const verification = verifyComplaintStatuses(complaints);
  
  console.group(`🔍 Status Verification - ${context}`);
  console.log('📊 Stats:', verification.stats);
  
  if (verification.valid) {
    console.log('✅ All complaint statuses are valid');
  } else {
    console.warn(`⚠️ Found ${verification.issues.length} issues:`);
    verification.issues.forEach(issue => {
      console.warn(`  - ${issue.type}: ${issue.message}`, issue);
    });
  }
  
  if (verification.stats.invalidStatuses.length > 0) {
    console.warn('❌ Invalid statuses found:', verification.stats.invalidStatuses);
  }
  
  console.groupEnd();
  
  return verification;
};

/**
 * Normalize complaint statuses for legacy compatibility
 * @param {Array} complaints - Array of complaint objects
 * @returns {Array} - Array of complaints with normalized statuses
 */
export const normalizeComplaintStatuses = (complaints) => {
  if (!Array.isArray(complaints)) {
    return [];
  }

  const statusMigrationMap = {
    // Various formats of In Progress
    'In Progress': COMPLAINT_STATUSES.IN_PROGRESS,
    'in progress': COMPLAINT_STATUSES.IN_PROGRESS,
    'IN PROGRESS': COMPLAINT_STATUSES.IN_PROGRESS,
    'Inprogress': COMPLAINT_STATUSES.IN_PROGRESS,  // Handle single word format
    'inprogress': COMPLAINT_STATUSES.IN_PROGRESS,
    'INPROGRESS': COMPLAINT_STATUSES.IN_PROGRESS,
    // Legacy statuses
    'Assigned': COMPLAINT_STATUSES.PENDING, // Legacy: Assigned becomes Pending
    'Completed': COMPLAINT_STATUSES.RESOLVED, // Legacy: Completed becomes Resolved
    'Rejected': COMPLAINT_STATUSES.RESOLVED, // Legacy: Rejected becomes Resolved
  };

  return complaints.map(complaint => {
    if (!complaint || typeof complaint !== 'object') {
      return complaint;
    }

    const originalStatus = complaint.status;
    let normalizedStatus = originalStatus;

    // Apply migration if needed
    if (statusMigrationMap[originalStatus]) {
      normalizedStatus = statusMigrationMap[originalStatus];
    }

    // If still not valid, default to Pending
    if (!isValidStatus(normalizedStatus)) {
      normalizedStatus = COMPLAINT_STATUSES.PENDING;
    }

    return {
      ...complaint,
      status: normalizedStatus,
      // Keep track of original status if it was changed
      ...(originalStatus !== normalizedStatus && { originalStatus })
    };
  });
};

/**
 * Calculate stats from complaints array
 * @param {Array} complaints - Array of complaint objects
 * @returns {Object} - Stats object with counts
 */
export const calculateComplaintStats = (complaints) => {
  const normalizedComplaints = normalizeComplaintStatuses(complaints);
  const verification = verifyComplaintStatuses(normalizedComplaints);
  
  return {
    total: verification.stats.total,
    pending: verification.stats.pending,
    inprogress: verification.stats.inprogress,
    resolved: verification.stats.resolved,
    valid: verification.valid,
    issues: verification.issues.length
  };
};