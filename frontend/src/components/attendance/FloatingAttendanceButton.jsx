import React, { useState, useEffect } from 'react';
import { labourAPI, apiHelpers } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const FloatingAttendanceButton = () => {
  const { user } = useAuth();
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [showWidget, setShowWidget] = useState(false);
  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOnLeave, setIsOnLeave] = useState(false);

  const handleQuickAttendance = async (type) => {
    setMarking(true);
    setMessage('');
    
    try {
      await labourAPI.markAttendance(type);
      setMessage(`✓ ${type.replace('_', ' ')}`);
      
      // Refresh status
      try {
        const response = await labourAPI.getCurrentAttendanceStatus();
        setAttendanceStatus(response.data?.status || null);
      } catch (err) {
        // Ignore status refresh errors
      }
      
      // Clear message after 2 seconds
      setTimeout(() => {
        setMessage('');
        setShowWidget(false);
      }, 2000);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setMessage(`✗ ${info.message}`);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setMarking(false);
    }
  };

  const handleBreakToggle = async () => {
    setMarking(true);
    setMessage('');
    
    try {
      const response = await labourAPI.toggleBreak();
      setMessage(`✓ ${response.data.message}`);
      
      // Refresh status
      try {
        const statusResponse = await labourAPI.getCurrentAttendanceStatus();
        setAttendanceStatus(statusResponse.data?.status || null);
      } catch (err) {
        // Ignore status refresh errors
      }
      
      // Clear message after 2 seconds
      setTimeout(() => {
        setMessage('');
        setShowWidget(false);
      }, 2000);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setMessage(`✗ ${info.message}`);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setMarking(false);
    }
  };

  const handleLeave = async () => {
    setMarking(true);
    setMessage('');
    
    try {
      await labourAPI.markLeave('', 'On leave for the day');
      setMessage('✓ Marked as on leave');
      
      // Refresh status
      try {
        const [statusResponse, leaveResponse] = await Promise.all([
          labourAPI.getCurrentAttendanceStatus(),
          labourAPI.getLeaveStatus()
        ]);
        setAttendanceStatus(statusResponse.data?.status || null);
        setIsOnLeave(leaveResponse.data?.isOnLeave || false);
      } catch (err) {
        // Ignore status refresh errors
      }
      
      // Clear message after 2 seconds
      setTimeout(() => {
        setMessage('');
        setShowWidget(false);
      }, 2000);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setMessage(`✗ ${info.message}`);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setMarking(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'check_in':
      case 'checked_in': return '#10b981';
      case 'check_out':
      case 'checked_out': return '#ef4444';
      case 'break': return '#f59e0b';
      case 'on_duty': return '#10b981';
      case 'overtime': return '#8b5cf6';
      case 'leave': return '#f97316';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'check_in':
      case 'checked_in': return '✓';
      case 'check_out':
      case 'checked_out': return '✗';
      case 'break': return '⏸';
      case 'on_duty': return '▶';
      case 'overtime': return '⚡';
      case 'leave': return '🏠';
      default: return '○';
    }
  };

  const getPrimaryAction = () => {
    if (!attendanceStatus || attendanceStatus.status === 'check_out') {
      return { type: 'check_in', label: 'Check In', color: '#10b981', icon: '✓' };
    }
    if (attendanceStatus.status === 'check_in' || attendanceStatus.status === 'on_duty') {
      return { type: 'check_out', label: 'Check Out', color: '#ef4444', icon: '✗' };
    }
    if (attendanceStatus.status === 'break') {
      return { type: 'check_out', label: 'Check Out', color: '#ef4444', icon: '✗' };
    }
    return { type: 'check_in', label: 'Check In', color: '#10b981', icon: '✓' };
  };

  useEffect(() => {
    if (user && user.role === 'labour') {
      const loadStatusInternal = async () => {
        try {
          setLoading(true);
          const [statusResponse, leaveResponse] = await Promise.all([
            labourAPI.getCurrentAttendanceStatus(),
            labourAPI.getLeaveStatus().catch(() => ({ data: { isOnLeave: false } }))
          ]);
          setAttendanceStatus(statusResponse.data?.status || null);
          setIsOnLeave(leaveResponse.data?.isOnLeave || false);
        } catch (err) {
          // Silently fail for floating widget
        } finally {
          setLoading(false);
        }
      };
      
      loadStatusInternal();
      // Refresh every 5 minutes
      const interval = setInterval(loadStatusInternal, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Only show for labour users
  if (!user || user.role !== 'labour') {
    return null;
  }

  const floatingButtonStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: 'none',
    background: loading ? '#9ca3af' : getStatusColor(attendanceStatus?.status),
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    transform: showWidget ? 'scale(1.1)' : 'scale(1)'
  };

  const widgetStyle = {
    position: 'fixed',
    bottom: '90px',
    right: '20px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    zIndex: 999,
    minWidth: '200px',
    maxWidth: '280px'
  };

  if (loading) {
    return (
      <button style={floatingButtonStyle} disabled>
        ⏳
      </button>
    );
  }

  const primaryAction = getPrimaryAction();

  return (
    <>
      {/* Floating Button */}
      <button 
        style={floatingButtonStyle}
        onClick={() => setShowWidget(!showWidget)}
        title={`Current status: ${attendanceStatus?.status || 'Not checked in'}`}
      >
        {getStatusIcon(attendanceStatus?.status)}
      </button>

      {/* Popup Widget */}
      {showWidget && (
        <div style={widgetStyle}>
          {/* Close Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', color: '#1f2937' }}>Quick Attendance</h4>
            <button 
              onClick={() => setShowWidget(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Status Display */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '12px',
            padding: '8px',
            background: '#f9fafb',
            borderRadius: '6px'
          }}>
            <span style={{ 
              color: getStatusColor(attendanceStatus?.status),
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              {getStatusIcon(attendanceStatus?.status)}
            </span>
            <span style={{ fontSize: '14px', color: '#374151' }}>
              {attendanceStatus?.status ? 
                attendanceStatus.status.replace('_', ' ').toUpperCase() : 
                'NOT CHECKED IN'
              }
            </span>
          </div>

          {/* Message */}
          {message && (
            <div style={{
              padding: '8px',
              borderRadius: '6px',
              marginBottom: '12px',
              background: message.startsWith('✓') ? '#f0fdf4' : '#fef2f2',
              color: message.startsWith('✓') ? '#16a34a' : '#dc2626',
              fontSize: '12px',
              textAlign: 'center'
            }}>
              {message}
            </div>
          )}

          {/* Leave Status Warning */}
          {isOnLeave && (
            <div style={{
              padding: '8px',
              borderRadius: '6px',
              marginBottom: '12px',
              background: '#fef3c7',
              color: '#d97706',
              fontSize: '12px',
              textAlign: 'center',
              border: '1px solid #fcd34d'
            }}>
              🏠 You are on leave today
            </div>
          )}

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {/* Leave Button - show when not on leave yet */}
            {!isOnLeave && (
              <button
                onClick={handleLeave}
                disabled={marking || (attendanceStatus && attendanceStatus.status !== 'check_out')}
                style={{
                  background: marking || (attendanceStatus && attendanceStatus.status !== 'check_out') ? '#9ca3af' : '#f97316',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: marking || (attendanceStatus && attendanceStatus.status !== 'check_out') ? 'not-allowed' : 'pointer',
                  opacity: (attendanceStatus && attendanceStatus.status !== 'check_out') ? 0.6 : 1
                }}
                title={(attendanceStatus && attendanceStatus.status !== 'check_out') ? 'Cannot mark leave after other attendance' : 'Mark as on leave for the day'}
              >
                {marking ? '...' : 
                 (attendanceStatus && attendanceStatus.status !== 'check_out') ? '🏠 N/A' : '🏠 Leave'}
              </button>
            )}
            
            {/* Primary Action Button - disabled when on leave */}
            {!isOnLeave && (
              <button
                onClick={() => handleQuickAttendance(primaryAction.type)}
                disabled={marking}
                style={{
                  background: marking ? '#9ca3af' : primaryAction.color,
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: marking ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {marking ? '...' : `${primaryAction.icon} ${primaryAction.label}`}
              </button>
            )}

            {/* Break toggle button - show when checked in, on duty, or on break and not on leave */}
            {!isOnLeave && attendanceStatus && (attendanceStatus.status === 'check_in' || attendanceStatus.status === 'on_duty' || attendanceStatus.status === 'break') && (
              <button
                onClick={handleBreakToggle}
                disabled={marking}
                style={{
                  background: marking ? '#9ca3af' : (attendanceStatus.status === 'break' ? '#10b981' : '#f59e0b'),
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: marking ? 'not-allowed' : 'pointer'
                }}
              >
                {attendanceStatus.status === 'break' ? '▶ End Break' : '⏸ Break'}
              </button>
            )}
          </div>

          {/* Link to full page */}
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <a 
              href="/labour/attendance" 
              style={{ 
                color: '#6366f1', 
                textDecoration: 'none', 
                fontSize: '12px' 
              }}
            >
              View Full Attendance →
            </a>
          </div>
        </div>
      )}

      {/* Backdrop to close widget */}
      {showWidget && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 998
          }}
          onClick={() => setShowWidget(false)}
        />
      )}
    </>
  );
};

export default FloatingAttendanceButton;