import React, { useState, useEffect } from 'react';
import { adminAPI, apiHelpers } from '../../../services/api';

const ManageAttendance = () => {
  const [currentlyOnDuty, setCurrentlyOnDuty] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [attendanceReport, setAttendanceReport] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('onDuty');
  const [filters, setFilters] = useState({
    labourName: '',
    date: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: '',
    page: 1,
    limit: 20
  });
  const [selectedLabour, setSelectedLabour] = useState('');
  const [editingAttendance, setEditingAttendance] = useState(null);

  const cardStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 20,
    background: 'white',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    marginBottom: 20
  };

  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    margin: '2px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: '#3b82f6',
    color: 'white'
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const promises = [];
      
      if (activeTab === 'onDuty') {
        promises.push(adminAPI.getCurrentlyOnDuty());
      } else if (activeTab === 'allAttendance') {
        promises.push(adminAPI.getAllAttendance(filters));
      } else if (activeTab === 'reports') {
        promises.push(adminAPI.getAttendanceReport({
          month: filters.month,
          year: filters.year
        }));
      }

      const results = await Promise.all(promises);
      
      if (activeTab === 'onDuty') {
        setCurrentlyOnDuty(results[0].data?.labours || []);
      } else if (activeTab === 'allAttendance') {
        setAllAttendance(results[0].data?.attendance || []);
      } else if (activeTab === 'reports') {
        setAttendanceReport(results[0].data?.report || {});
      }
      
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(info.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAttendance = async (id, updatedData) => {
    try {
      await adminAPI.updateAttendance(id, updatedData);
      setSuccess('Attendance updated successfully');
      setEditingAttendance(null);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(info.message);
    }
  };

  const handleDeleteAttendance = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }
    
    try {
      await adminAPI.deleteAttendance(id);
      setSuccess('Attendance record deleted successfully');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(info.message);
    }
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
      case 'on_duty':
        return <span style={{...badgeStyle, background: '#dcfce7', color: '#166534'}}>On Duty</span>;
      case 'check_out':
        return <span style={{...badgeStyle, background: '#fef3c7', color: '#92400e'}}>Off Duty</span>;
      case 'break':
        return <span style={{...badgeStyle, background: '#dbeafe', color: '#1e40af'}}>On Break</span>;
      case 'overtime':
        return <span style={{...badgeStyle, background: '#fce7f3', color: '#be185d'}}>Overtime</span>;
      case 'leave':
        return <span style={{...badgeStyle, background: '#fef2f2', color: '#dc2626'}}>On Leave</span>;
      default:
        return <span style={{...badgeStyle, background: '#f3f4f6', color: '#374151'}}>Unknown</span>;
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

  const formatDuration = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  useEffect(() => {
    loadData();
  }, [activeTab, filters.page, filters.month, filters.year]);

  // Add debounced effect for search and status filter
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === 'allAttendance') {
        loadData();
      }
    }, 500); // 500ms debounce for search

    return () => clearTimeout(timeoutId);
  }, [filters.labourName, filters.date, filters.status]);

  const tabStyle = (tab) => ({
    ...buttonStyle,
    background: activeTab === tab ? '#3b82f6' : '#f3f4f6',
    color: activeTab === tab ? 'white' : '#374151',
    margin: '0 4px'
  });

  return (
    <div className="theme-page-bg" style={{ padding: 24, maxWidth: '1400px', margin: '0 auto' }}>
      <h2 className="theme-text-primary" style={{ marginBottom: 24 }}>Attendance Management</h2>

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

      {/* Tab Navigation */}
      <div style={{ marginBottom: 24 }}>
        <button 
          style={tabStyle('onDuty')}
          onClick={() => setActiveTab('onDuty')}
        >
          Currently On Duty
        </button>
        <button 
          style={tabStyle('allAttendance')}
          onClick={() => setActiveTab('allAttendance')}
        >
          All Attendance
        </button>
        <button 
          style={tabStyle('reports')}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </div>

      {/* Currently On Duty Tab */}
      {activeTab === 'onDuty' && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px 0' }}>Currently On Duty Staff</h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : currentlyOnDuty.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
              No staff currently on duty.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {currentlyOnDuty.map((labour) => (
                <div key={labour._id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: 4 }}>
                      {labour.name} ({labour.employeeId})
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: 4 }}>
                      {labour.department} • {labour.phone}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {getStatusBadge(labour.currentStatus)}
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        Since: {formatDateTime(labour.lastCheckIn)}
                      </span>
                      {labour.location && (
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          Location: {labour.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      style={{...buttonStyle, background: '#10b981', color: 'white'}}
                      onClick={() => setSelectedLabour(labour._id)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Attendance Tab */}
      {activeTab === 'allAttendance' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>Attendance Records</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search by labour name..."
                value={filters.labourName}
                onChange={(e) => setFilters({...filters, labourName: e.target.value})}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">All Status</option>
                <option value="check_in">Checked In</option>
                <option value="check_out">Checked Out</option>
                <option value="break">On Break</option>
                <option value="overtime">Overtime</option>
                <option value="leave">On Leave</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : allAttendance.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
              No attendance records found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Labour</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Time</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Action</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Location</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Remarks</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allAttendance.map((record, index) => (
                    <tr key={record._id || index}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{record.labour?.name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {record.labour?.employeeId}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        {new Date(record.timestamp).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        {getStatusBadge(record.type)}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        {record.location || '-'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        {record.remarks || '-'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            style={{...buttonStyle, background: '#f59e0b', color: 'white', fontSize: '12px'}}
                            onClick={() => setEditingAttendance(record)}
                          >
                            Edit
                          </button>
                          <button
                            style={{...buttonStyle, background: '#ef4444', color: 'white', fontSize: '12px'}}
                            onClick={() => handleDeleteAttendance(record._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>Attendance Reports</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                value={filters.month}
                onChange={(e) => setFilters({...filters, month: parseInt(e.target.value)})}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={filters.year}
                onChange={(e) => setFilters({...filters, year: parseInt(e.target.value)})}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading report...</div>
          ) : (
            <>
              {/* Summary Stats */}
              {attendanceReport.summary && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ marginBottom: 16 }}>Summary</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                        {attendanceReport.summary.totalLabours}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>Total Staff</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                        {attendanceReport.summary.avgAttendanceRate}%
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>Avg Attendance</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                        {formatDuration(attendanceReport.summary.totalHours * 60)}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>Total Hours</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>
                        {formatDuration(attendanceReport.summary.overtimeHours * 60)}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>Overtime Hours</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Report */}
              {attendanceReport.details && attendanceReport.details.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: 16 }}>Individual Reports</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Labour</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Days Worked</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Total Hours</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Overtime</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Attendance Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceReport.details.map((labour, index) => (
                          <tr key={labour.labourId || index}>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                              <div>
                                <div style={{ fontWeight: '500' }}>{labour.name}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                  {labour.employeeId}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                              {labour.daysWorked}
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                              {formatDuration(labour.totalHours * 60)}
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                              {formatDuration(labour.overtimeHours * 60)}
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                              {labour.attendanceRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Edit Attendance Modal */}
      {editingAttendance && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: 20 }}>Edit Attendance Record</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Labour: {editingAttendance.labour?.name}
                </label>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Type
                </label>
                <select
                  value={editingAttendance.type}
                  onChange={(e) => setEditingAttendance({...editingAttendance, type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="check_in">Check In</option>
                  <option value="check_out">Check Out</option>
                  <option value="break">Break</option>
                  <option value="overtime">Overtime</option>
                  <option value="leave">Leave</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Location
                </label>
                <input
                  type="text"
                  value={editingAttendance.location || ''}
                  onChange={(e) => setEditingAttendance({...editingAttendance, location: e.target.value})}
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
                  Remarks
                </label>
                <textarea
                  value={editingAttendance.remarks || ''}
                  onChange={(e) => setEditingAttendance({...editingAttendance, remarks: e.target.value})}
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
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  style={{...buttonStyle, background: '#6b7280', color: 'white'}}
                  onClick={() => setEditingAttendance(null)}
                >
                  Cancel
                </button>
                <button
                  style={primaryButtonStyle}
                  onClick={() => handleUpdateAttendance(editingAttendance._id, {
                    type: editingAttendance.type,
                    location: editingAttendance.location,
                    remarks: editingAttendance.remarks
                  })}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAttendance;