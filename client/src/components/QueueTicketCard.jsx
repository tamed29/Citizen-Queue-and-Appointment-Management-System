import React from 'react';
import StatusBadge from './StatusBadge';

const QueueTicketCard = ({ ticket, onCancel }) => {
  const { ticketNumber, status, service, createdAt, isPriority } = ticket;

  const cardStyle = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '10px'
  };

  const leftStyle = {
    minWidth: '80px'
  };

  const ticketNumberStyle = {
    fontSize: '24px',
    fontWeight: '600',
    color: 'var(--accent)',
    fontFamily: "'DM Mono', monospace"
  };

  const middleStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  };

  const serviceNameStyle = {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-1)'
  };

  const centerNameStyle = {
    fontSize: '12px',
    color: 'var(--text-3)'
  };

  const timeTakenStyle = {
    fontSize: '12px',
    color: 'var(--text-3)'
  };

  const rightStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px'
  };

  const priorityBadgeStyle = {
    fontSize: '10px',
    color: 'var(--accent-2)',
    fontWeight: '600'
  };

  return (
    <div className="card" style={cardStyle}>
      <div style={leftStyle}>
        <div style={ticketNumberStyle}>{ticketNumber}</div>
        {isPriority && <div style={priorityBadgeStyle}>⭑ PRIORITY</div>}
      </div>

      <div style={middleStyle}>
        <div style={serviceNameStyle}>{service.name}</div>
        <div style={centerNameStyle}>{service.center?.name || 'Service Center'}</div>
        <div style={timeTakenStyle}>
          Taken at {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div style={rightStyle}>
        <StatusBadge status={status} />
        {onCancel && status === 'WAITING' && (
          <button 
            onClick={() => onCancel(ticket.id)}
            className="btn btn-danger btn-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default QueueTicketCard;
