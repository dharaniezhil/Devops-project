import React, { useState, useEffect, useCallback } from 'react';
import { labourAPI, apiHelpers } from '../../../services/api';
import MonthlyAttendanceChart from '../../../components/attendance/MonthlyAttendanceChart';
import { canMarkAttendance, isWithinOfficeHours, getTimeUntilOfficeHours } from '../../../utils/timeUtils';

const LabourAttendance = () => {
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [location, setLocation] = useState('');
  const [remarks, setRemarks] = useState('');
  const [showMarkForm, setShowMarkForm] = useState(false);
  const [actionType, setActionType] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyFilters, setHistoryFilters] = useState({
    startDate: '',
    endDate: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceTimeCheck, setAttendanceTimeCheck] = useState({ canMark: true, message: '' });

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
    margin: '5px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: '#10b981',
    color: 'white'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: '#ef4444',
    color: 'white'
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statusRes, historyRes, statsRes, leaveRes] = await Promise.all([
        labourAPI.getCurrentAttendanceStatus(),
        labourAPI.getAttendanceHistory({ 
          page: historyPage, 
          limit: 10,
          month: historyFilters.month,
          year: historyFilters.year
        }),
        labourAPI.getAttendanceStats({ 
          month: historyFilters.month,
          year: historyFilters.year 
        }),
        labourAPI.getLeaveStatus().catch(() => ({ data: { isOnLeave: false } }))
      ]);
      
      setAttendanceStatus(statusRes.data?.status || null);
      setAttendanceHistory(historyRes.data?.attendance || []);
      setAttendanceStats(statsRes.data?.stats || {});
      setIsOnLeave(leaveRes.data?.isOnLeave || false);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(info.message);
    } finally {
      setLoading(false);
    }
  }, [historyPage, historyFilters.month, historyFilters.year]);

  const checkAttendanceTime = useCallback(() => {
    const now = new Date();
    setCurrentTime(now);
    const timeCheck = canMarkAttendance(now);
    setAttendanceTimeCheck(timeCheck);
  }, []);

  const handleMarkAttendance = async (type) => {
    setMarking(true);
    setError('');
    setSuccess('');
    
    // Check time restrictions before proceeding
    const timeCheck = canMarkAttendance();
    if (!timeCheck.canMark) {
      setError(timeCheck.message);
      setMarking(false);
      return;
    }
    
    try {
      const response = await labourAPI.markAttendance(type, location, remarks);
      setSuccess(`Successfully marked ${type.replace('_', ' ')}`);
      setLocation('');
      setRemarks('');
      setShowMarkForm(false);
      
      // Refresh data after a delay
      setTimeout(async () => {
        try {
          const statusRes = await labourAPI.getCurrentAttendanceStatus();
          setAttendanceStatus(statusRes.data?.status || null);
        } catch (err) {
          // Ignore refresh errors
        }
        setSuccess('');
      }, 1500);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(info.message);
    } finally {
      setMarking(false);
    }
  };

  const handleBreakToggle = async () => {
    setMarking(true);
    setError('');
    setSuccess('');
    
    // Check time restrictions before proceeding
    const timeCheck = canMarkAttendance();
    if (!timeCheck.canMark) {
      setError(timeCheck.message);
      setMarking(false);
      return;
    }
    
    try {
      const response = await labourAPI.toggleBreak(location, remarks);
      setSuccess(response.data.message);
      setLocation('');
      setRemarks('');
      setShowMarkForm(false);
      
      // Refresh data after a delay
      setTimeout(async () => {
        try {
          const statusRes = await labourAPI.getCurrentAttendanceStatus();
          setAttendanceStatus(statusRes.data?.status || null);
        } catch (err) {
          // Ignore refresh errors
        }
        setSuccess('');
      }, 1500);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(info.message);
    } finally {
      setMarking(false);
    }
  };

  const handleLeave = async () => {
    setMarking(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await labourAPI.markLeave(location, remarks || 'On leave for the day');
      setSuccess('Successfully marked as on leave');
      setLocation('');
      setRemarks('');
      setShowMarkForm(false);
      
      // Refresh data after a delay
      setTimeout(async () => {
        try {
          await loadData();
        } catch (err) {
          // Ignore refresh errors
        }
        setSuccess('');
      }, 1500);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(info.message);
    } finally {
      setMarking(false);
    }
  };

  const openMarkForm = (type) => {
    setActionType(type);
    setShowMarkForm(true);
    setError('');
    setSuccess('');
  };

  const handleFormSubmit = () => {
    if (actionType === 'leave') {
      handleLeave();
    } else {
      handleMarkAttendance(actionType);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badgeStyle = {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'uppercase'
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
        return <span style={{...badgeStyle, background: '#f3f4f6', color: '#374151'}}>Unknown</span>;
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check time restrictions on component mount and every minute
  useEffect(() => {
    checkAttendanceTime();
    const timer = setInterval(checkAttendanceTime, 60000); // Check every minute
    
    return () => clearInterval(timer);
  }, [checkAttendanceTime]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div>Loading attendance data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24, color: '#1f2937' }}>My Attendance</h2>

      {error && (
        <div style={{ 
          background: '#fef2f2', 
          color: '#dc2626', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          background: '#f0fdf4', 
          color: '#16a34a', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid #bbf7d0'
        }}>
          {success}
        </div>
      )}

      {/* Office Hours Restriction Notice */}
      {!attendanceTimeCheck.canMark && (
        <div style={{
          background: '#fef3c7',
          color: '#d97706',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #fcd34d',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            ⏰ {attendanceTimeCheck.message}
          </div>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            Current Time: {attendanceTimeCheck.details?.currentTime || currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
          <div style={{ fontSize: '14px' }}>
            Office Hours: {attendanceTimeCheck.details?.officeHours || '9:00 AM - 5:00 PM'}
          </div>
          {isWithinOfficeHours(currentTime).currentHour < 9 && (
            <div style={{ fontSize: '14px', marginTop: '8px', fontStyle: 'italic' }}>
              {getTimeUntilOfficeHours(currentTime)}
            </div>
          )}
        </div>
      )}

      {/* Current Status and Quick Actions */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0' }}>Current Status</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Status: </span>
            {attendanceStatus ? getStatusBadge(attendanceStatus.status) : 
             <span style={{ color: '#6b7280' }}>Not checked in</span>}
          </div>
          {attendanceStatus?.lastAction && (
            <div>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>
                Last action: {formatDateTime(attendanceStatus.lastAction)}
              </span>
            </div>
          )}
        </div>

        {isOnLeave && (
          <div style={{
            background: '#fef3c7',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #fcd34d',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#d97706', fontWeight: '500', fontSize: '16px' }}>
              🏠 You are on leave today
            </div>
            <div style={{ color: '#b45309', fontSize: '14px', marginTop: '4px' }}>
              All attendance actions are disabled. Contact admin if this is incorrect.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {/* Leave Button - Available when not on leave and (no status OR check_out) */}
          <button 
            style={{
              ...primaryButtonStyle, 
              background: (!attendanceTimeCheck.canMark || isOnLeave || (attendanceStatus && attendanceStatus.status && attendanceStatus.status !== 'check_out' && attendanceStatus.status !== null)) ? '#9ca3af' : '#f97316',
              opacity: (!attendanceTimeCheck.canMark || isOnLeave || (attendanceStatus && attendanceStatus.status && attendanceStatus.status !== 'check_out' && attendanceStatus.status !== null)) ? 0.6 : 1,
              cursor: (!attendanceTimeCheck.canMark || isOnLeave || (attendanceStatus && attendanceStatus.status && attendanceStatus.status !== 'check_out' && attendanceStatus.status !== null)) ? 'not-allowed' : 'pointer'
            }}
            onClick={() => openMarkForm('leave')}
            disabled={marking || !attendanceTimeCheck.canMark || isOnLeave || (attendanceStatus && attendanceStatus.status && attendanceStatus.status !== 'check_out' && attendanceStatus.status !== null)}
            title={
              isOnLeave ? 'Already on leave today' :
              (attendanceStatus && attendanceStatus.status && attendanceStatus.status !== 'check_out' && attendanceStatus.status !== null) ? 'Cannot mark leave after other attendance actions' : 
              'Mark as on leave for the day'
            }
          >
            🏠 {isOnLeave ? 'Already on Leave' :
                   (attendanceStatus && attendanceStatus.status && attendanceStatus.status !== 'check_out' && attendanceStatus.status !== null) ? 'Leave (Unavailable)' : 
                   'Mark Leave'}
          </button>
          
          {!isOnLeave && attendanceTimeCheck.canMark && (!attendanceStatus || attendanceStatus.status === 'check_out') && (
            <button 
              style={primaryButtonStyle}
              onClick={() => openMarkForm('check_in')}
              disabled={marking || !attendanceTimeCheck.canMark}
            >
              Check In
            </button>
          )}
          
          {/* Break toggle button - available when checked in or on duty and not on leave */}
          {!isOnLeave && attendanceTimeCheck.canMark && attendanceStatus && (attendanceStatus.status === 'check_in' || attendanceStatus.status === 'on_duty' || attendanceStatus.status === 'break') && (
            <button 
              style={{
                ...buttonStyle, 
                background: attendanceStatus.status === 'break' ? '#10b981' : '#f59e0b', 
                color: 'white',
                opacity: !attendanceTimeCheck.canMark ? 0.6 : 1
              }}
              onClick={handleBreakToggle}
              disabled={marking || !attendanceTimeCheck.canMark}
            >
              {attendanceStatus.status === 'break' ? 'End Break' : 'Start Break'}
            </button>
          )}
          
          {/* Check out button - available when checked in, on duty, or on break and not on leave */}
          {!isOnLeave && attendanceTimeCheck.canMark && attendanceStatus && (attendanceStatus.status === 'check_in' || attendanceStatus.status === 'on_duty' || attendanceStatus.status === 'break') && (
            <button 
              style={secondaryButtonStyle}
              onClick={() => openMarkForm('check_out')}
              disabled={marking || !attendanceTimeCheck.canMark}
            >
              Check Out
            </button>
          )}

          {/* Overtime button - available when not on leave */}
          {!isOnLeave && attendanceTimeCheck.canMark && (
            <button 
              style={{
                ...buttonStyle, 
                background: '#8b5cf6', 
                color: 'white',
                opacity: !attendanceTimeCheck.canMark ? 0.6 : 1
              }}
              onClick={() => openMarkForm('overtime')}
              disabled={marking || !attendanceTimeCheck.canMark}
            >
              Mark Overtime
            </button>
          )}
        </div>
      </div>

      {/* Mark Attendance Form */}
      {showMarkForm && (
        <div style={cardStyle}>
          <h4 style={{ margin: '0 0 16px 0' }}>
            Mark {actionType.replace('_', ' ').toUpperCase()}
          </h4>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Location (Optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter your current location"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Remarks (Optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any additional remarks"
                rows="3"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={primaryButtonStyle}
                onClick={handleFormSubmit}
                disabled={marking}
              >
                {marking ? 'Marking...' : `Mark ${actionType.replace('_', ' ')}`}
              </button>
              <button
                style={{...buttonStyle, background: '#6b7280', color: 'white'}}
                onClick={() => setShowMarkForm(false)}
                disabled={marking}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {attendanceStats && Object.keys(attendanceStats).length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px 0' }}>Monthly Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                {attendanceStats.totalDays || 0}
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>Days Worked</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                {attendanceStats.totalHours ? `${Math.round(attendanceStats.totalHours)}h` : '0h'}
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>Total Hours</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>
                {attendanceStats.overtimeHours ? `${Math.round(attendanceStats.overtimeHours)}h` : '0h'}
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>Overtime</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                {attendanceStats.avgHoursPerDay ? `${Math.round(attendanceStats.avgHoursPerDay)}h` : '0h'}
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>Avg/Day</div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Attendance Chart */}
      <MonthlyAttendanceChart 
        month={historyFilters.month} 
        year={historyFilters.year} 
      />

      {/* Attendance History */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Attendance History</h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={historyFilters.month}
              onChange={(e) => setHistoryFilters({...historyFilters, month: parseInt(e.target.value)})}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={historyFilters.year}
              onChange={(e) => setHistoryFilters({...historyFilters, year: parseInt(e.target.value)})}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {attendanceHistory.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
            No attendance records found for the selected period.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Action</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Time</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Location</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.map((record, index) => (
                  <tr key={record._id || index}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                      {new Date(record.timestamp).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                      {getStatusBadge(record.type)}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                      {record.location || '-'}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                      {record.remarks || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabourAttendance;