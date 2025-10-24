import React, { useState } from 'react';
import { labourAPI, apiHelpers } from '../../services/api';

const SimpleAttendanceWidget = ({ compact = false }) => {
  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const cardStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: compact ? 8 : 10,
    padding: compact ? 12 : 20,
    background: 'white',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    marginBottom: compact ? 12 : 20
  };

  const buttonStyle = {
    padding: compact ? '6px 12px' : '8px 16px',
    borderRadius: '6px',
    border: 'none',
    fontSize: compact ? '12px' : '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    margin: '2px'
  };

  const handleAttendance = async (type) => {
    setMarking(true);
    setMessage('');
    setError('');
    
    try {
      await labourAPI.markAttendance(type);
      setMessage(`✓ Successfully marked ${type.replace('_', ' ')}`);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(info.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: compact ? 8 : 16 
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: compact ? '16px' : '18px',
          color: '#1f2937'
        }}>
          Quick Attendance
        </h3>
      </div>

      {/* Messages */}
      {message && (
        <div style={{ 
          background: '#f0fdf4', 
          color: '#16a34a', 
          padding: '8px 12px', 
          borderRadius: '6px', 
          marginBottom: '12px',
          fontSize: compact ? '12px' : '14px',
          border: '1px solid #bbf7d0'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ 
          background: '#fef2f2', 
          color: '#dc2626', 
          padding: '8px 12px', 
          borderRadius: '6px', 
          marginBottom: '12px',
          fontSize: compact ? '12px' : '14px',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          onClick={() => handleAttendance('check_in')}
          disabled={marking}
          style={{
            ...buttonStyle,
            background: marking ? '#9ca3af' : '#10b981',
            color: 'white'
          }}
        >
          {marking ? 'Processing...' : '✓ Check In'}
        </button>
        
        <button 
          onClick={() => handleAttendance('break')}
          disabled={marking}
          style={{
            ...buttonStyle,
            background: marking ? '#9ca3af' : '#f59e0b',
            color: 'white'
          }}
        >
          {marking ? 'Processing...' : '⏸ Break'}
        </button>
        
        <button 
          onClick={() => handleAttendance('check_out')}
          disabled={marking}
          style={{
            ...buttonStyle,
            background: marking ? '#9ca3af' : '#ef4444',
            color: 'white'
          }}
        >
          {marking ? 'Processing...' : '✗ Check Out'}
        </button>

        <button 
          onClick={() => handleAttendance('overtime')}
          disabled={marking}
          style={{
            ...buttonStyle,
            background: marking ? '#9ca3af' : '#8b5cf6',
            color: 'white'
          }}
        >
          {marking ? 'Processing...' : '⚡ Overtime'}
        </button>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: compact ? '8px' : '12px',
        color: '#6b7280',
        fontSize: compact ? '11px' : '12px',
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        Click the appropriate button to mark your attendance
      </div>
    </div>
  );
};

export default SimpleAttendanceWidget;