import React, { useState, useEffect } from 'react';
import { labourAPI, apiHelpers } from '../../services/api';

const QuickAttendanceWidget = ({ showFullHistory = false, compact = false }) => {
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await labourAPI.getCurrentAttendanceStatus();
      setAttendanceStatus(response.data?.status || null);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(info.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAttendance = async (type) => {
    setMarking(true);
    setMessage('');
    setError('');
    
    try {
      await labourAPI.markAttendance(type);
      setMessage(`Successfully marked ${type.replace('_', ' ')}`);
      
      // Refresh status
      await loadStatus();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(info.message);
    } finally {
      setMarking(false);
    }
  };

  const getStatusBadge = (status) => {
    const badgeStyle = {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: compact ? '10px' : '12px',
      fontWeight: '500',
      textTransform: 'uppercase',
      display: 'inline-block'
    };

    switch (status) {
      case 'checked_in':
        return <span style={{...badgeStyle, background: '#dcfce7', color: '#166534'}}>On Duty</span>;
      case 'checked_out':
        return <span style={{...badgeStyle, background: '#fef3c7', color: '#92400e'}}>Off Duty</span>;
      case 'break':
        return <span style={{...badgeStyle, background: '#dbeafe', color: '#1e40af'}}>On Break</span>;
      case 'overtime':
        return <span style={{...badgeStyle, background: '#fce7f3', color: '#be185d'}}>Overtime</span>;
      default:
        return <span style={{...badgeStyle, background: '#f3f4f6', color: '#374151'}}>Not Checked In</span>;
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    loadStatus();
  }, []);

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading attendance status...</div>
      </div>
    );
  }

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
          {compact ? 'Attendance' : 'Quick Attendance'}
        </h3>
        {showFullHistory && (
          <a 
            href="/labour/attendance" 
            style={{ 
              color: '#6366f1', 
              textDecoration: 'none', 
              fontSize: compact ? '12px' : '14px' 
            }}
          >
            View Full →
          </a>
        )}
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

      {/* Current Status */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: compact ? '8px' : '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            color: '#6b7280', 
            fontSize: compact ? '12px' : '14px',
            fontWeight: '500'
          }}>
            Status:
          </span>
          {getStatusBadge(attendanceStatus?.status)}
        </div>
        
        {attendanceStatus?.lastAction && (
          <div style={{ 
            color: '#6b7280', 
            fontSize: compact ? '11px' : '12px' 
          }}>
            Last: {new Date(attendanceStatus.lastAction).toLocaleString()}
          </div>
        )}
        
        <div style={{ 
          color: '#9ca3af', 
          fontSize: compact ? '11px' : '12px',
          marginLeft: 'auto'
        }}>
          {getCurrentTime()}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {(!attendanceStatus || attendanceStatus.status === 'checked_out') && (
          <button 
            onClick={() => handleQuickAttendance('check_in')}
            disabled={marking}
            style={{
              ...buttonStyle,
              background: marking ? '#9ca3af' : '#10b981',
              color: 'white',
              cursor: marking ? 'not-allowed' : 'pointer'
            }}
          >
            {marking ? 'Marking...' : '✓ Check In'}
          </button>
        )}
        
        {attendanceStatus && attendanceStatus.status === 'checked_in' && (
          <>
            <button 
              onClick={() => handleQuickAttendance('break')}
              disabled={marking}
              style={{
                ...buttonStyle,
                background: marking ? '#9ca3af' : '#f59e0b',
                color: 'white',
                cursor: marking ? 'not-allowed' : 'pointer'
              }}
            >
              {marking ? 'Marking...' : '⏸ Break'}
            </button>
            <button 
              onClick={() => handleQuickAttendance('check_out')}
              disabled={marking}
              style={{
                ...buttonStyle,
                background: marking ? '#9ca3af' : '#ef4444',
                color: 'white',
                cursor: marking ? 'not-allowed' : 'pointer'
              }}
            >
              {marking ? 'Marking...' : '✗ Check Out'}
            </button>
          </>
        )}

        {attendanceStatus && attendanceStatus.status === 'break' && (
          <button 
            onClick={() => handleQuickAttendance('check_in')}
            disabled={marking}
            style={{
              ...buttonStyle,
              background: marking ? '#9ca3af' : '#10b981',
              color: 'white',
              cursor: marking ? 'not-allowed' : 'pointer'
            }}
          >
            {marking ? 'Marking...' : '▶ Return'}
          </button>
        )}

        {attendanceStatus && attendanceStatus.status === 'checked_out' && (
          <button 
            onClick={() => handleQuickAttendance('overtime')}
            disabled={marking}
            style={{
              ...buttonStyle,
              background: marking ? '#9ca3af' : '#8b5cf6',
              color: 'white',
              cursor: marking ? 'not-allowed' : 'pointer'
            }}
          >
            {marking ? 'Marking...' : '⚡ Overtime'}
          </button>
        )}
      </div>

      {/* Location info */}
      {attendanceStatus?.location && (
        <div style={{
          marginTop: compact ? '8px' : '12px',
          color: '#6b7280',
          fontSize: compact ? '11px' : '12px',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          📍 {attendanceStatus.location}
        </div>
      )}
    </div>
  );
};

export default QuickAttendanceWidget;