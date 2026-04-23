import React from 'react';
import { Armchair, Heart } from 'lucide-react';

export default function SeatPicker({ seats, selectedSeats, onSeatClick, currentUserEmail, otherSelectedSeats = [] }) {
  // Group seats by row
  const rows = Array.isArray(seats) ? seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {}) : {};

  const sortedRows = Object.keys(rows).sort().reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem', padding: '4rem 2rem', perspective: '1000px' }}>
      {/* Curved Screen Visualization */}
      <div style={{ width: '100%', maxWidth: '800px', position: 'relative', marginBottom: '2rem' }}>
        <div style={{ 
          height: '10px', 
          background: 'var(--primary)', 
          borderRadius: '50% / 100% 100% 0 0', 
          transform: 'rotateX(-45deg)',
          boxShadow: '0 15px 30px rgba(229, 9, 20, 0.4)',
          filter: 'blur(2px)'
        }}></div>
        <p style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem', 
          fontSize: '0.75rem', 
          color: '#444', 
          letterSpacing: '1rem', 
          textTransform: 'uppercase' 
        }}>SCREEN</p>
      </div>

      {/* Seats Grid */}
      <div style={{ position: 'relative', padding: '2rem' }}>
        {/* Center Zone Highlight Border (Standard VIP area) */}
        <div style={{
          position: 'absolute',
          top: '25%', // Approx rows E-H
          left: '15%', // Approx center cols
          width: '70%',
          height: '50%',
          border: '2px dashed rgba(74, 222, 128, 0.2)',
          borderRadius: '24px',
          pointerEvents: 'none',
          zIndex: 0
        }}>
          <div style={{ 
            position: 'absolute', 
            bottom: '-1.5rem', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            fontSize: '0.65rem', 
            color: '#4ade80', 
            fontWeight: 800,
            letterSpacing: '2px',
            opacity: 0.6
          }}>VÙNG TRUNG TÂM</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', transform: 'rotateX(10deg)', width: '100%', position: 'relative', zIndex: 1 }}>
          {sortedRows.map(row => (
            <div key={row} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '30px', color: '#333', fontWeight: 800, fontSize: '0.9rem' }}>{row}</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {rows[row].sort((a, b) => a.column - b.column).map(seat => {
                  const isSelected = selectedSeats.some(id => Number(id) === Number(seat.seatId));
                  const isOtherSelected = otherSelectedSeats.some(id => Number(id) === Number(seat.seatId));
                  const isOccupied = seat.status === 'Occupied';
                  const isLockedByOthers = (seat.status === 'Locked' && seat.lockedBy !== currentUserEmail) || isOtherSelected;
                  const isLockedByMe = seat.status === 'Locked' && seat.lockedBy === currentUserEmail;

                  // Color logic
                  let baseColor = '#1a1a1a'; 
                  let borderColor = '#333';
                  let iconColor = '#444';

                  if (seat.type === 'VIP') {
                    baseColor = 'rgba(255, 195, 0, 0.05)';
                    borderColor = 'rgba(255, 195, 0, 0.2)';
                    iconColor = 'rgba(255, 195, 0, 0.5)';
                  } else if (seat.type === 'Sweetbox') {
                    baseColor = 'rgba(229, 9, 20, 0.05)';
                    borderColor = 'rgba(229, 9, 20, 0.2)';
                    iconColor = 'rgba(229, 9, 20, 0.5)';
                  }

                  const isActive = !isOccupied && !isLockedByOthers;
                  const isHighlight = isSelected || isLockedByMe;

                  // Blue for both SignalR events AND DB-locked seats by others
                  const isVisualLockedByOthers = isLockedByOthers || isOtherSelected;

                  const finalBg = isHighlight ? 'var(--primary)' : 
                                   isVisualLockedByOthers ? '#3b82f6' : // Blue for others
                                   isOccupied ? '#111' : baseColor;

                  return (
                    <button
                      key={seat.seatId}
                      disabled={!isActive}
                      onClick={() => onSeatClick(seat.seatId)}
                      style={{
                        width: seat.type === 'Sweetbox' ? '80px' : '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isHighlight ? `2px solid var(--primary)` : 
                               isVisualLockedByOthers ? `2px solid #3b82f6` : `1px solid ${borderColor}`,
                        background: finalBg,
                        color: isHighlight || isVisualLockedByOthers ? 'white' : iconColor,
                        borderRadius: seat.type === 'Sweetbox' ? '12px 12px 20px 20px' : '8px 8px 12px 12px',
                        cursor: isActive ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isHighlight ? '0 0 15px var(--primary)' : 
                                   isVisualLockedByOthers ? '0 0 15px #3b82f6' : 'none',
                        opacity: isOccupied ? 0.2 : 1
                      }}
                      title={isVisualLockedByOthers ? 'Người khác đang chọn' : `${row}${seat.column} - ${seat.type}`}
                    >
                      {seat.type === 'Sweetbox' ? <Heart size={24} fill={isHighlight || isVisualLockedByOthers ? "white" : "currentColor"} /> : <Armchair size={18} />}
                    </button>
                  );
                })}
              </div>
              <div style={{ width: '30px', color: '#333', fontWeight: 800, fontSize: '0.9rem', textAlign: 'right' }}>{row}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '3rem', marginTop: '3rem', padding: '1.5rem 3rem', background: '#080808', borderRadius: '40px', border: '1px solid #111' }}>
        <LegendItem color="#1a1a1a" label="Standard" border="#333" />
        <LegendItem color="rgba(255, 195, 0, 0.1)" label="VIP" border="rgba(255, 195, 0, 0.5)" />
        <LegendItem color="rgba(229, 9, 20, 0.1)" label="Sweetbox" border="rgba(229, 9, 20, 0.5)" />
        <LegendItem color="var(--primary)" label="BẠN CHỌN" />
        <LegendItem color="#3b82f6" label="NGƯỜI KHÁC ĐANG CHỌN" border="#3b82f6" />
        <LegendItem color="#111" label="ĐÃ ĐẶT" opacity={0.2} />
      </div>
    </div>
  );
}

function LegendItem({ color, label, border = 'transparent', opacity = 1 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#666', opacity }}>
      <div style={{ width: '14px', height: '14px', background: color, border: `1px solid ${border}`, borderRadius: '3px' }}></div>
      <span style={{ letterSpacing: '1px' }}>{label.toUpperCase()}</span>
    </div>
  );
}
