import React from 'react';

const StatusBadge = ({ status }) => {
  const normalizedStatus = status?.toUpperCase() || 'WAITING';
  
  const getStyle = () => {
    const baseStyle = {
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      padding: '3px 9px',
      borderRadius: '5px',
      display: 'inline-flex',
      alignItems: 'center'
    };

    switch (normalizedStatus) {
      case 'WAITING':
        return { ...baseStyle, background: 'var(--warning-dim)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.18)' };
      case 'CALLED':
        return { ...baseStyle, background: 'var(--info-dim)', color: 'var(--info)', border: '1px solid rgba(59,130,246,0.18)' };
      case 'SERVING':
        return { ...baseStyle, background: 'var(--accent-dim)', color: 'var(--accent-2)', border: '1px solid rgba(99,102,241,0.18)' };
      case 'SERVED':
        return { ...baseStyle, background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.18)' };
      case 'SKIPPED':
        return { ...baseStyle, background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.18)' };
      case 'CANCELLED':
        return { ...baseStyle, background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.18)' };
      case 'PENDING':
        return { ...baseStyle, background: 'var(--warning-dim)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.18)' };
      case 'CONFIRMED':
        return { ...baseStyle, background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.18)' };
      case 'COMPLETED':
        return { ...baseStyle, background: 'rgba(255,255,255,.04)', color: 'var(--text-3)', border: '1px solid var(--border)' };
      default:
        return { ...baseStyle, background: 'var(--warning-dim)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.18)' };
    }
  };

  return (
    <span style={getStyle()}>
      {normalizedStatus}
    </span>
  );
};

export default StatusBadge;
