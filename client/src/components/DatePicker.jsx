import React, { useState, useRef, useEffect, useMemo } from 'react';

const DatePicker = ({ selectedDate, onSelectDate, label = "Select Date", minDate = new Date(), maxDays = 30 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = selectedDate || new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateLabel = (date) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const calendarDays = useMemo(() => {
    const { year, month } = viewMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + maxDays);

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push({ type: 'empty' });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      date.setHours(0, 0, 0, 0);
      const isPast = date < today;
      const isBeyondMax = date > maxDate;
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDate && 
        date.getTime() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();

      cells.push({
        type: 'day', day: d, date,
        disabled: isPast || isBeyondMax,
        isToday, isSelected
      });
    }
    return cells;
  }, [viewMonth, selectedDate, maxDays]);

  const prevMonth = (e) => {
    e.stopPropagation();
    setViewMonth(v => {
      const d = new Date(v.year, v.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    setViewMonth(v => {
      const d = new Date(v.year, v.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const monthName = new Date(viewMonth.year, viewMonth.month).toLocaleString('default', { month: 'long' });

  return (
    <div className="datepicker-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <label className="label" style={{ marginBottom: '8px', display: 'block' }}>{label}</label>
      
      {/* Trigger Input */}
      <div 
        className="datepicker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--surface-2)',
          border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border-2)'}`,
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'var(--success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff'
        }}>
          <i className="ti ti-calendar" style={{ fontSize: '18px' }}></i>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DEPARTURE</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }}>
            {formatDateLabel(selectedDate)}
          </div>
        </div>
        <i className="ti ti-calendar-event" style={{ fontSize: '16px', color: 'var(--text-4)' }}></i>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="datepicker-dropdown card" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '8px',
          width: '280px',
          zIndex: 1000,
          padding: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          background: '#252525', // Matches image style better
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {monthName} {viewMonth.year} <i className="ti ti-chevron-down" style={{ fontSize: '10px', opacity: 0.5 }}></i>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={prevMonth} className="btn-nav">↑</button>
              <button onClick={nextMonth} className="btn-nav">↓</button>
            </div>
          </div>

          {/* Weekdays */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {calendarDays.map((cell, i) => {
              if (cell.type === 'empty') return <div key={i} />;
              
              const isPast = cell.disabled;
              const isSelected = cell.isSelected;
              
              return (
                <div 
                  key={i}
                  onClick={() => !isPast && (onSelectDate(cell.date), setIsOpen(false))}
                  style={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: cell.isToday || isSelected ? 600 : 400,
                    cursor: isPast ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    transition: 'all 0.15s ease',
                    color: isPast ? 'rgba(255,255,255,0.15)' : isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                    background: isSelected ? 'rgba(255,255,255,0.15)' : 'transparent',
                    border: isSelected ? '1px solid #fff' : 'none',
                    position: 'relative'
                  }}
                  onMouseEnter={e => !isPast && !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => !isPast && !isSelected && (e.currentTarget.style.background = 'transparent')}
                >
                  {cell.day}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button 
              className="btn-link" 
              onClick={(e) => { e.stopPropagation(); onSelectDate(null); setIsOpen(false); }}
              style={{ fontSize: '12px', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Clear
            </button>
            <button 
              className="btn-link" 
              onClick={(e) => { e.stopPropagation(); onSelectDate(new Date()); setIsOpen(false); }}
              style={{ fontSize: '12px', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Today
            </button>
          </div>
        </div>
      )}

      <style>{`
        .btn-nav {
          width: 24px;
          height: 24px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .btn-nav:hover { background: rgba(255,255,255,0.05); color: #fff; }
      `}</style>
    </div>
  );
};

export default DatePicker;
