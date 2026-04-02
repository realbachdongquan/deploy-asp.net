import React from 'react';
import { Armchair } from 'lucide-react';

export default function SeatPicker({ seats, selectedSeats, onSeatClick, currentUserEmail }) {
  // Group seats by row
  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  // Sort rows alphabetically
  const sortedRows = Object.keys(rows).sort();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '2rem' }}>
      {/* Screen Visualization */}
      <div style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
        <div style={{ 
          height: '4px', 
          background: 'linear-gradient(to right, transparent, var(--primary), transparent)',
          marginBottom: '1rem',
          boxShadow: '0 10px 20px rgba(229, 9, 20, 0.3)'
        }}></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase' }}>SCREEN</p>
      </div>

      {/* Seats Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sortedRows.map(row => (
          <div key={row} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '20px', color: '#444', fontWeight: 700, fontSize: '0.8rem' }}>{row}</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {rows[row].sort((a, b) => a.column - b.column).map(seat => {
                const isSelected = selectedSeats.includes(seat.seatId);
                const isOccupied = seat.status === 'Occupied';
                const isLockedByOthers = seat.status === 'Locked' && seat.lockedBy !== currentUserEmail;
                const isLockedByMe = seat.status === 'Locked' && seat.lockedBy === currentUserEmail;

                let stateClass = 'available';
                if (isOccupied) stateClass = 'occupied';
                else if (isLockedByOthers) stateClass = 'locked-others';
                else if (isLockedByMe || isSelected) stateClass = 'selected';

                return (
                  <button
                    key={seat.seatId}
                    disabled={isOccupied || isLockedByOthers}
                    onClick={() => onSeatClick(seat.seatId)}
                    style={{
                      width: '35px',
                      height: '35px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #333',
                      background: isOccupied ? '#1a1a1a' : 
                                  isLockedByOthers ? 'var(--accent)' :
                                  (isSelected || isLockedByMe) ? 'var(--primary)' : 'transparent',
                      color: isLockedByOthers ? 'black' : 'white',
                      opacity: isOccupied ? 0.3 : 1,
                      cursor: (isOccupied || isLockedByOthers) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    title={`${row}${seat.column} - ${seat.type}`}
                  >
                    <Armchair size={16} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '15px', height: '15px', border: '1px solid #333' }}></div> AVAILABLE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '15px', height: '15px', background: 'var(--primary)' }}></div> SELECTED
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '15px', height: '15px', background: 'var(--accent)' }}></div> LOCKED
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '15px', height: '15px', background: '#1a1a1a', opacity: 0.3 }}></div> OCCUPIED
        </div>
      </div>
    </div>
  );
}
