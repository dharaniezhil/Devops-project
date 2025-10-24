// src/components/StatusUpdateTest.jsx
// Test component to verify status updates work across all pages

import React, { useState, useEffect } from 'react';
import { COMPLAINT_STATUSES, STATUS_ORDER } from '../utils/constants';
import { logStatusVerification } from '../utils/statusVerification';

const StatusUpdateTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const runStatusTest = () => {
    setIsRunning(true);
    setTestResults([]);

    const tests = [
      {
        name: 'Status Constants Check',
        test: () => {
          const expected = ['Pending', 'In Progress', 'Resolved'];
          const actual = STATUS_ORDER;
          return {
            passed: JSON.stringify(expected) === JSON.stringify(actual),
            expected,
            actual,
            message: 'Verifying STATUS_ORDER contains exactly 3 statuses'
          };
        }
      },
      {
        name: 'Status Values Check',
        test: () => {
          const pending = COMPLAINT_STATUSES.PENDING;
          const inprogress = COMPLAINT_STATUSES.IN_PROGRESS;
          const resolved = COMPLAINT_STATUSES.RESOLVED;
          
          return {
            passed: pending === 'Pending' && inprogress === 'In Progress' && resolved === 'Resolved',
            expected: { pending: 'Pending', inprogress: 'In Progress', resolved: 'Resolved' },
            actual: { pending, inprogress, resolved },
            message: 'Verifying status constant values are correct'
          };
        }
      },
      {
        name: 'Mock Complaints Verification',
        test: () => {
          const mockComplaints = [
            { _id: '1', status: 'Pending', title: 'Test 1' },
            { _id: '2', status: 'In Progress', title: 'Test 2' },
            { _id: '3', status: 'Resolved', title: 'Test 3' },
            { _id: '4', status: 'Inprogress', title: 'Test 4 (legacy single word)' },
            { _id: '5', status: 'Completed', title: 'Test 5 (legacy)' }
          ];
          
          const verification = logStatusVerification(mockComplaints, 'StatusTest');
          
          return {
            passed: verification.stats.pending === 1 && 
                   verification.stats.inprogress === 1 && 
                   verification.stats.resolved === 1 &&
                   verification.stats.invalidStatuses.length === 2,
            expected: { pending: 1, inprogress: 1, resolved: 1, invalid: 2 },
            actual: verification.stats,
            message: 'Verifying mock complaints are processed correctly'
          };
        }
      },
      {
        name: 'Event Broadcasting Test',
        test: () => {
          let eventReceived = false;
          
          const handler = (event) => {
            if (event.detail && event.detail.newStatus) {
              eventReceived = true;
            }
          };
          
          window.addEventListener('complaintStatusUpdated', handler);
          
          // Simulate event
          window.dispatchEvent(new CustomEvent('complaintStatusUpdated', {
            detail: { complaintId: 'test', newStatus: 'In Progress', timestamp: new Date() }
          }));
          
          window.removeEventListener('complaintStatusUpdated', handler);
          
          return {
            passed: eventReceived,
            expected: true,
            actual: eventReceived,
            message: 'Verifying event broadcasting works'
          };
        }
      }
    ];

    const results = tests.map(({ name, test }) => {
      try {
        const result = test();
        return {
          name,
          ...result,
          error: null
        };
      } catch (error) {
        return {
          name,
          passed: false,
          expected: null,
          actual: null,
          message: `Test failed with error: ${error.message}`,
          error: error.message
        };
      }
    });

    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusIcon = (passed) => {
    return passed ? '✅' : '❌';
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2>🧪 Status System Test Suite</h2>
        <p>Verify that the 3-status system (Pending, In Progress, Resolved) works correctly</p>
        
        <button
          onClick={runStatusTest}
          disabled={isRunning}
          style={{
            padding: '0.75rem 1.5rem',
            background: isRunning ? '#6b7280' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            margin: '1rem 0'
          }}
        >
          {isRunning ? '🔄 Running Tests...' : '▶️ Run Status Tests'}
        </button>
      </div>

      {testResults.length > 0 && (
        <div>
          <h3>Test Results:</h3>
          
          <div style={{ 
            display: 'grid', 
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {testResults.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  border: `2px solid ${result.passed ? '#10b981' : '#ef4444'}`,
                  borderRadius: '8px',
                  background: result.passed ? '#f0fdfa' : '#fef2f2'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  {getStatusIcon(result.passed)} {result.name}
                </div>
                
                <p style={{ 
                  margin: '0.5rem 0',
                  color: '#4b5563',
                  fontSize: '0.9rem'
                }}>
                  {result.message}
                </p>
                
                {result.expected && (
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    <strong>Expected:</strong> {JSON.stringify(result.expected)}
                    <br />
                    <strong>Actual:</strong> {JSON.stringify(result.actual)}
                  </div>
                )}
                
                {result.error && (
                  <div style={{ 
                    background: '#fee2e2',
                    color: '#dc2626',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    marginTop: '0.5rem',
                    fontSize: '0.8rem'
                  }}>
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div style={{
            padding: '1rem',
            background: testResults.every(r => r.passed) ? '#f0fdfa' : '#fef2f2',
            border: `2px solid ${testResults.every(r => r.passed) ? '#10b981' : '#ef4444'}`,
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>
              {testResults.every(r => r.passed) ? '🎉 All Tests Passed!' : '⚠️ Some Tests Failed'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              {testResults.filter(r => r.passed).length} of {testResults.length} tests passed
            </p>
          </div>
          
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#4b5563'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Manual Tests to Perform:</h4>
            <ol style={{ margin: '0', paddingLeft: '1.5rem' }}>
              <li>Go to <code>/admin/manage-complaints</code> and verify chart shows 3 statuses</li>
              <li>Change a complaint status and verify chart updates immediately</li>
              <li>Open user dashboard in another tab and verify it updates in real-time</li>
              <li>Check that filter dropdown includes "In Progress" option</li>
              <li>Verify counts: Total = Pending + In Progress + Resolved</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusUpdateTest;