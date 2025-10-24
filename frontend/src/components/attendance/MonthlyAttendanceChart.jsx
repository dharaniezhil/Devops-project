import React, { useState, useEffect } from 'react';
import { labourAPI } from '../../services/api';

const MonthlyAttendanceChart = ({ month, year }) => {
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadChartData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await labourAPI.getMonthlyChart(month, year);
      const data = response.data;
      
      setChartData(data.chartData || []);
      setSummary(data.summary || {});
    } catch (err) {
      console.error('Error loading chart data:', err);
      setError('Failed to load attendance chart data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChartData();
  }, [month, year]);

  const getMonthName = (monthNum) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[monthNum - 1] || 'Unknown';
  };

  const getDayColor = (day) => {
    if (day.isOnLeave) return '#fef3c7'; // Orange for leave
    if (!day.present) return '#f3f4f6'; // Gray for absent
    if (day.isHalfDay) return '#fde68a'; // Light yellow for half day
    if (day.workingHours >= 8) return '#dcfce7'; // Green for full day
    if (day.workingHours > 0) return '#dbeafe'; // Blue for partial day
    return '#f3f4f6'; // Gray default
  };

  const getDayTitle = (day) => {
    if (day.isOnLeave) return 'On Leave';
    if (!day.present) return 'Absent';
    if (day.isHalfDay) return `Half Day (${day.workingHours}h)`;
    if (day.workingHours >= 8) return `Full Day (${day.workingHours}h)`;
    if (day.workingHours > 0) return `Partial Day (${day.workingHours}h)`;
    return 'No data';
  };

  if (loading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <div>⏳ Loading attendance chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        color: '#dc2626',
        textAlign: 'center'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      padding: '20px',
      background: 'white',
      boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        color: '#1f2937',
        textAlign: 'center'
      }}>
        Attendance Chart - {getMonthName(month)} {year}
      </h3>

      {/* Summary Stats */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              {summary.workingDays}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              Working Days
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
              {summary.halfDays}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              Half Days
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
              {summary.totalHours}h
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              Total Hours
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
              {summary.avgHoursPerDay}h
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              Avg Hours/Day
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
        marginBottom: '16px'
      }}>
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{
            padding: '8px 4px',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151',
            background: '#f3f4f6',
            borderRadius: '4px'
          }}>
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {chartData.map((day, index) => {
          const dayOfWeek = new Date(day.date).getDay();
          const isToday = day.date === new Date().toISOString().split('T')[0];
          
          return (
            <div
              key={index}
              style={{
                minHeight: '40px',
                padding: '6px 4px',
                background: getDayColor(day),
                border: isToday ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative'
              }}
              title={getDayTitle(day)}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: isToday ? '600' : '500',
                color: '#374151'
              }}>
                {day.day}
              </div>
              
              {/* Activity indicators */}
              <div style={{
                display: 'flex',
                gap: '2px',
                marginTop: '2px'
              }}>
                {day.checkIn > 0 && (
                  <div style={{
                    width: '4px',
                    height: '4px',
                    background: '#10b981',
                    borderRadius: '50%'
                  }} title="Checked In" />
                )}
                {day.breaks > 0 && (
                  <div style={{
                    width: '4px',
                    height: '4px',
                    background: '#f59e0b',
                    borderRadius: '50%'
                  }} title="Breaks" />
                )}
                {day.overtime > 0 && (
                  <div style={{
                    width: '4px',
                    height: '4px',
                    background: '#8b5cf6',
                    borderRadius: '50%'
                  }} title="Overtime" />
                )}
                {day.leave > 0 && (
                  <div style={{
                    width: '4px',
                    height: '4px',
                    background: '#f97316',
                    borderRadius: '50%'
                  }} title="Leave" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        justifyContent: 'center',
        padding: '12px 0',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            borderRadius: '2px'
          }} />
          <span style={{ fontSize: '12px', color: '#374151' }}>Full Day (8+ hours)</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '2px'
          }} />
          <span style={{ fontSize: '12px', color: '#374151' }}>On Leave</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: '#fde68a',
            border: '1px solid #f59e0b',
            borderRadius: '2px'
          }} />
          <span style={{ fontSize: '12px', color: '#374151' }}>Half Day</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: '#dbeafe',
            border: '1px solid #93c5fd',
            borderRadius: '2px'
          }} />
          <span style={{ fontSize: '12px', color: '#374151' }}>Partial Day</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '2px'
          }} />
          <span style={{ fontSize: '12px', color: '#374151' }}>Absent</span>
        </div>
      </div>

      {/* Activity Legend */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        justifyContent: 'center',
        padding: '8px 0 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#10b981',
            borderRadius: '50%'
          }} />
          <span style={{ fontSize: '11px', color: '#6b7280' }}>Check-in</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#f59e0b',
            borderRadius: '50%'
          }} />
          <span style={{ fontSize: '11px', color: '#6b7280' }}>Break</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#8b5cf6',
            borderRadius: '50%'
          }} />
          <span style={{ fontSize: '11px', color: '#6b7280' }}>Overtime</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#f97316',
            borderRadius: '50%'
          }} />
          <span style={{ fontSize: '11px', color: '#6b7280' }}>Leave</span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyAttendanceChart;