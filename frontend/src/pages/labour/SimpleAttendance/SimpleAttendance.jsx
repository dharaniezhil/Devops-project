import React, { useState, useEffect } from 'react';
import { labourAPI, apiHelpers } from '../../../services/api';

const SimpleAttendance = () => {
  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [isOnLeave, setIsOnLeave] = useState(false);

  const cardStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 20,
    background: 'white',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    marginBottom: 20
  };

  const buttonStyle = {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    margin: '8px'
  };

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get today's date
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      // Fetch current status, today's attendance, and leave status
      const [statusRes, historyRes, leaveRes] = await Promise.all([
        labourAPI.getCurrentAttendanceStatus().catch(() => ({ data: { status: null } })),
        labourAPI.getAttendanceHistory({ 
          limit: 10,
          month: today.getMonth() + 1,
          year: today.getFullYear()
        }).catch(() => ({ data: { attendance: [] } })),
        labourAPI.getLeaveStatus().catch(() => ({ data: { isOnLeave: false } }))
      ]);
      
      const status = statusRes.data?.status;
      const allAttendance = historyRes.data?.attendance || [];
      const onLeaveToday = leaveRes.data?.isOnLeave || false;
      
      // Filter today's attendance
      const todayRecords = allAttendance.filter(record => {
        const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
        return recordDate === todayString;
      });
      
      // Check if already checked in today
      const hasCheckedIn = todayRecords.some(record => record.type === 'check_in');
      
      // Get recent history (excluding today)
      const recentRecords = allAttendance.filter(record => {
        const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
        return recordDate !== todayString;
      }).slice(0, 5);
      
      // Set state
      setAttendanceStatus(status);
      setCurrentStatus(status?.status || null);
      setTodayAttendance(todayRecords);
      setRecentHistory(recentRecords);
      setHasCheckedInToday(hasCheckedIn);
      setIsOnLeave(onLeaveToday);
      
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(`Failed to load attendance data: ${info.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = async (type) => {
    setMarking(true);
    setMessage('');
    setError('');
    
    try {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Check for half-day work (check-in after 12 PM)
      let location = '';
      let remarks = '';
      
      if (type === 'check_in' && currentHour >= 12) {
        setIsHalfDay(true);
        remarks = 'Half-day work (Check-in after 12 PM)';
        location = 'Half Day';
      }
      
      const response = await labourAPI.markAttendance(type, location, remarks);
      
      let successMessage = `✅ Successfully marked ${type.replace('_', ' ')} at ${now.toLocaleTimeString()}`;
      if (type === 'check_in' && currentHour >= 12) {
        successMessage += ' (Half Day)';
      }
      
      setMessage(successMessage);
      
      // Refresh attendance data
      await loadAttendanceData();
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(`❌ Error: ${info.message}`);
      setTimeout(() => setError(''), 8000);
    } finally {
      setMarking(false);
    }
  };

  // New break toggle function
  const handleBreakToggle = async () => {
    setMarking(true);
    setMessage('');
    setError('');
    
    try {
      const response = await labourAPI.toggleBreak();
      
      const now = new Date();
      setMessage(`✅ ${response.data.message} at ${now.toLocaleTimeString()}`);
      
      // Refresh attendance data
      await loadAttendanceData();
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(`❌ Error: ${info.message}`);
      setTimeout(() => setError(''), 8000);
    } finally {
      setMarking(false);
    }
  };

  // Leave handler function
  const handleLeave = async () => {
    setMarking(true);
    setMessage('');
    setError('');
    
    try {
      const response = await labourAPI.markLeave('', 'On leave for the day');
      
      const now = new Date();
      setMessage(`✅ Successfully marked as on leave at ${now.toLocaleTimeString()}`);
      
      // Refresh attendance data
      await loadAttendanceData();
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(`❌ Error: ${info.message}`);
      setTimeout(() => setError(''), 8000);
    } finally {
      setMarking(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status) => {
    const badgeStyle = {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'uppercase',
      display: 'inline-block'
    };

    switch (status) {
      case 'check_in':
      case 'checked_in':
        return <span style={{...badgeStyle, background: '#dcfce7', color: '#166534'}}>Check In</span>;
      case 'check_out':
      case 'checked_out':
        return <span style={{...badgeStyle, background: '#fef3c7', color: '#92400e'}}>Check Out</span>;
      case 'break':
        return <span style={{...badgeStyle, background: '#dbeafe', color: '#1e40af'}}>On Break</span>;
      case 'on_duty':
        return <span style={{...badgeStyle, background: '#dcfce7', color: '#166534'}}>On Duty</span>;
      case 'overtime':
        return <span style={{...badgeStyle, background: '#fce7f3', color: '#be185d'}}>Overtime</span>;
      case 'leave':
        return <span style={{...badgeStyle, background: '#fef3c7', color: '#d97706'}}>On Leave</span>;
      default:
        return <span style={{...badgeStyle, background: '#f3f4f6', color: '#374151'}}>Not Checked In</span>;
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 24, color: '#1f2937' }}>Labour Attendance System</h2>
        <div style={{ padding: '40px', color: '#6b7280', fontSize: '16px' }}>
          <div>⏳ Loading attendance data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24, color: '#1f2937', textAlign: 'center' }}>
        Labour Attendance System
      </h2>

      {/* Current Status Section */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0' }}>Current Status</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '500' }}>Status:</span>
            {getStatusBadge(currentStatus)}
          </div>
          {attendanceStatus?.lastAction && (
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Last action: {formatDateTime(attendanceStatus.lastAction)}
            </div>
          )}
        </div>
        
        {hasCheckedInToday && (
          <div style={{ 
            background: '#f0fdf4', 
            padding: '12px', 
            borderRadius: '6px', 
            border: '1px solid #bbf7d0',
            marginBottom: '12px'
          }}>
            <div style={{ color: '#16a34a', fontWeight: '500', marginBottom: '4px' }}>
              ✅ Already checked in today
            </div>
            <div style={{ color: '#059669', fontSize: '14px' }}>
              Check-in button will be disabled until tomorrow
            </div>
          </div>
        )}
        
        {isOnLeave && (
          <div style={{ 
            background: '#fef3c7', 
            padding: '12px', 
            borderRadius: '6px', 
            border: '1px solid #fcd34d',
            marginBottom: '12px'
          }}>
            <div style={{ color: '#d97706', fontWeight: '500' }}>
              🏠 You are on leave today
            </div>
            <div style={{ color: '#b45309', fontSize: '14px' }}>
              All attendance actions are disabled. Contact admin if this is incorrect.
            </div>
          </div>
        )}
        
        {isHalfDay && (
          <div style={{ 
            background: '#fef3c7', 
            padding: '12px', 
            borderRadius: '6px', 
            border: '1px solid #fcd34d',
            marginBottom: '12px'
          }}>
            <div style={{ color: '#d97706', fontWeight: '500' }}>
              ⚠️ Half Day Work Detected
            </div>
            <div style={{ color: '#b45309', fontSize: '14px' }}>
              Checked in after 12 PM - Marked as half-day work
            </div>
          </div>
        )}
      </div>

      {/* Today's Attendance Details */}
      {todayAttendance.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px 0' }}>Today's Attendance</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {todayAttendance.map((record, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getStatusBadge(record.type)}
                  {record.location && (
                    <span style={{ color: '#6b7280', fontSize: '12px' }}>📍 {record.location}</span>
                  )}
                </div>
                <div style={{ color: '#374151', fontSize: '14px' }}>
                  {formatDateTime(record.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div style={{ 
          background: '#f0fdf4', 
          color: '#16a34a', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          fontSize: '16px',
          border: '1px solid #bbf7d0',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ 
          background: '#fef2f2', 
          color: '#dc2626', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          fontSize: '16px',
          border: '1px solid #fecaca',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Main Attendance Card */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>
          Mark Your Attendance
        </h3>
        
        <p style={{ 
          textAlign: 'center', 
          color: '#6b7280', 
          marginBottom: '24px',
          fontSize: '16px'
        }}>
          Choose the appropriate action for your current work status
        </p>

        {/* Action Buttons Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          justifyItems: 'center'
        }}>
          {/* Check In Button */}
          <button 
            onClick={() => handleAttendance('check_in')}
            disabled={marking || hasCheckedInToday || isOnLeave}
            style={{
              ...buttonStyle,
              background: (marking || hasCheckedInToday || isOnLeave) ? '#9ca3af' : '#10b981',
              color: 'white',
              minWidth: '180px',
              cursor: (marking || hasCheckedInToday || isOnLeave) ? 'not-allowed' : 'pointer',
              opacity: (hasCheckedInToday || isOnLeave) ? 0.6 : 1
            }}
            title={isOnLeave ? 'Cannot check in while on leave' : hasCheckedInToday ? 'Already checked in today' : 'Mark your arrival at work'}
          >
            {marking ? '⏳ Processing...' : hasCheckedInToday ? '✅ Already Checked In' : '✅ Check In'}
          </button>
          
          {/* Break Toggle Button - Only show if checked in and not on leave */}
          {!isOnLeave && (currentStatus === 'check_in' || currentStatus === 'on_duty' || currentStatus === 'break') && (
            <button 
              onClick={handleBreakToggle}
              disabled={marking}
              style={{
                ...buttonStyle,
                background: marking ? '#9ca3af' : (currentStatus === 'break' ? '#10b981' : '#f59e0b'),
                color: 'white',
                minWidth: '180px'
              }}
              title={currentStatus === 'break' ? 'Click to end break and return to work' : 'Click to start your break'}
            >
              {marking ? '⏳ Processing...' : 
               currentStatus === 'break' ? '▶️ End Break' : '⏸️ Start Break'}
            </button>
          )}
          
          {/* Check Out Button - Only show if checked in, on duty, or on break and not on leave */}
          {!isOnLeave && (currentStatus === 'check_in' || currentStatus === 'on_duty' || currentStatus === 'break') && (
            <button 
              onClick={() => handleAttendance('check_out')}
              disabled={marking}
              style={{
                ...buttonStyle,
                background: marking ? '#9ca3af' : '#ef4444',
                color: 'white',
                minWidth: '180px'
              }}
              title="Mark when you're leaving for the day"
            >
              {marking ? '⏳ Processing...' : '❌ Check Out'}
            </button>
          )}

          {/* Leave Button - Available when not on leave and (no attendance OR last action was check_out) */}
          <button 
            onClick={handleLeave}
            disabled={marking || isOnLeave || (todayAttendance.length > 0 && currentStatus !== 'check_out' && currentStatus !== null)}
            style={{
              ...buttonStyle,
              background: (marking || isOnLeave || (todayAttendance.length > 0 && currentStatus !== 'check_out' && currentStatus !== null)) ? '#9ca3af' : '#f97316',
              color: 'white',
              minWidth: '180px',
              opacity: (isOnLeave || (todayAttendance.length > 0 && currentStatus !== 'check_out' && currentStatus !== null)) ? 0.6 : 1,
              cursor: (marking || isOnLeave || (todayAttendance.length > 0 && currentStatus !== 'check_out' && currentStatus !== null)) ? 'not-allowed' : 'pointer'
            }}
            title={
              isOnLeave ? 'Already on leave today' :
              (todayAttendance.length > 0 && currentStatus !== 'check_out' && currentStatus !== null) ? 'Can only mark leave at start of day or after checking out' : 
              'Mark as on leave for the day'
            }
          >
            {marking ? '⏳ Processing...' : 
             isOnLeave ? '🏠 Already on Leave' :
             (todayAttendance.length > 0 && currentStatus !== 'check_out' && currentStatus !== null) ? '🏠 Leave (Unavailable)' : '🏠 Mark Leave'}
          </button>
          
          {/* Overtime Button - Show only when not on leave */}
          {!isOnLeave && (
            <button 
              onClick={() => handleAttendance('overtime')}
              disabled={marking}
              style={{
                ...buttonStyle,
                background: marking ? '#9ca3af' : '#8b5cf6',
                color: 'white',
                minWidth: '180px'
              }}
              title="Mark when working beyond regular hours"
            >
              {marking ? '⏳ Processing...' : '⚡ Mark Overtime'}
            </button>
          )}
        </div>
      </div>

      {/* Recent Attendance History */}
      {recentHistory.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px 0' }}>Recent Attendance History</h3>
          <div style={{ display: 'grid', gap: '6px' }}>
            {recentHistory.map((record, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                background: index % 2 === 0 ? '#f9fafb' : 'white',
                borderRadius: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getStatusBadge(record.type)}
                  {record.remarks && (
                    <span style={{ color: '#6b7280', fontSize: '12px', fontStyle: 'italic' }}>
                      {record.remarks}
                    </span>
                  )}
                </div>
                <div style={{ color: '#374151', fontSize: '13px' }}>
                  {formatDateTime(record.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={cardStyle}>
        <h4 style={{ margin: '0 0 12px 0' }}>Instructions & Rules:</h4>
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ padding: '8px', background: '#f0f9ff', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
            <strong style={{ color: '#1e40af' }}>✅ Check In:</strong>
            <div style={{ color: '#1e3a8a', fontSize: '14px', marginTop: '2px' }}>
              • Mark your arrival at work<br/>
              • Can only check in once per day<br/>
              • Check-in after 12 PM = Half Day
            </div>
          </div>
          <div style={{ padding: '8px', background: '#fef3c7', borderRadius: '4px', border: '1px solid #fcd34d' }}>
            <strong style={{ color: '#d97706' }}>⏸️ Break Toggle:</strong>
            <div style={{ color: '#b45309', fontSize: '14px', marginTop: '2px' }}>
              • First click: Start break<br/>
              • Second click: End break (back on duty)<br/>
              • Only available after check-in
            </div>
          </div>
          <div style={{ padding: '8px', background: '#fef2f2', borderRadius: '4px', border: '1px solid #fecaca' }}>
            <strong style={{ color: '#dc2626' }}>❌ Check Out:</strong>
            <div style={{ color: '#b91c1c', fontSize: '14px', marginTop: '2px' }}>
              • Mark when leaving for the day<br/>
              • Only available after check-in
            </div>
          </div>
          <div style={{ padding: '8px', background: '#fef3c7', borderRadius: '4px', border: '1px solid #fcd34d' }}>
            <strong style={{ color: '#d97706' }}>🏠 Leave:</strong>
            <div style={{ color: '#b45309', fontSize: '14px', marginTop: '2px' }}>
              • Mark when taking leave for the day<br/>
              • Only available before any other attendance<br/>
              • Disables all other attendance actions
            </div>
          </div>
          <div style={{ padding: '8px', background: '#faf5ff', borderRadius: '4px', border: '1px solid #d8b4fe' }}>
            <strong style={{ color: '#7c3aed' }}>⚡ Overtime:</strong>
            <div style={{ color: '#6b21a8', fontSize: '14px', marginTop: '2px' }}>
              • Mark when working beyond regular hours<br/>
              • Available when not on leave
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <a 
          href="/labour/dashboard" 
          style={{ 
            color: '#6366f1', 
            textDecoration: 'none',
            fontSize: '16px'
          }}
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
};

export default SimpleAttendance;