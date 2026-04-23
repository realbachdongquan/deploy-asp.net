import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Ticket as TicketIcon, Calendar, MapPin, ChevronRight, LayoutGrid, Clock, CheckCircle2, AlertCircle, Award, Gem, Star } from 'lucide-react';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketsRes, membershipRes] = await Promise.all([
          api.get('/tickets/my-tickets'),
          api.get('/memberships/mine')
        ]);
        setTickets(ticketsRes.data);
        setMembership(membershipRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00ff88', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: 'rgba(0, 255, 136, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '20px' }}>
            <CheckCircle2 size={12} /> PAID
          </div>
        );
      case 'pending':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffcc00', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: 'rgba(255, 204, 0, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '20px' }}>
            <Clock size={12} /> PENDING
          </div>
        );
      default:
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ff3b30', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: 'rgba(255, 59, 48, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '20px' }}>
            <AlertCircle size={12} /> {status || 'UNKNOWN'}
          </div>
        );
    }
  };

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
      <div className="spinner" style={{ width: '50px', height: '50px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)' }}></div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#000', padding: '4rem 5%', color: 'white' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: 'var(--primary)', padding: '1.2rem', borderRadius: '20px', boxShadow: '0 10px 30px rgba(255, 0, 0, 0.3)' }}>
              <TicketIcon color="white" size={32} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '3rem', fontFamily: 'Prata', letterSpacing: '-1px' }}>MY TICKETS</h1>
              <p style={{ margin: 0, color: '#666', fontSize: '1rem' }}>You have {tickets.length} active bookings</p>
            </div>
          </div>
        </div>

        {/* Loyalty Membership Card */}
        {membership && (
          <div className="ui-panel" style={{ 
            padding: '2.5rem', 
            marginBottom: '4rem', 
            background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)',
            border: '1px solid #222',
            borderRadius: '32px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Decoration */}
            <div style={{ 
              position: 'absolute', 
              top: '-20%', 
              right: '-10%', 
              width: '300px', 
              height: '300px', 
              background: membership.tierName === 'Diamond' ? 'radial-gradient(circle, rgba(229, 9, 20, 0.1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255, 195, 0, 0.05) 0%, transparent 70%)',
              filter: 'blur(50px)',
              pointerEvents: 'none'
            }}></div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ 
                  padding: '0.8rem', 
                  background: membership.tierName === 'Diamond' ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255, 195, 0, 0.2)', 
                  color: membership.tierName === 'Diamond' ? 'var(--primary)' : 'var(--accent)',
                  borderRadius: '16px'
                }}>
                  {membership.tierName === 'Diamond' ? <Gem size={28} /> : membership.tierName === 'Gold' ? <Award size={28} /> : <Star size={28} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.8rem', letterSpacing: '2px' }}>{membership.tierName.toUpperCase()}</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#666', fontWeight: 800 }}>MEMBER SINCE {new Date().getFullYear()}</p>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.8rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>
                    {membership.accumulatedPoints.toLocaleString()}
                    <span style={{ fontSize: '0.9rem', color: '#444', marginLeft: '0.5rem' }}>PTS</span>
                  </div>
                  {membership.tierName !== 'Diamond' && (
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
                      Next Tier: <span style={{ color: '#aaa' }}>{membership.tierName === 'Standard' ? 'Gold (1,000 pts)' : 'Diamond (5,000 pts)'}</span>
                    </div>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div style={{ height: '6px', background: '#111', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(100, (membership.accumulatedPoints / (membership.tierName === 'Standard' ? 1000 : 5000)) * 100)}%`, 
                    height: '100%', 
                    background: 'var(--primary)',
                    boxShadow: '0 0 10px var(--primary)',
                    transition: 'width 1s ease-out'
                  }}></div>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid #1a1a1a' }}>
              <h4 style={{ margin: '0 0 1.2rem 0', fontSize: '0.8rem', color: '#444', letterSpacing: '2px' }}>TIER BENEFITS</h4>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <BenefitItem text="5% points back on every ticket" active={true} />
                <BenefitItem text="Exclusive birthday gift" active={membership.tierName !== 'Standard'} />
                <BenefitItem text="VIP lounge access" active={membership.tierName === 'Diamond'} />
                <BenefitItem text="Zero cancellation fees" active={membership.tierName === 'Diamond'} />
              </ul>
            </div>
          </div>
        )}

        {tickets.length === 0 ? (
          <div className="ui-panel" style={{ padding: '8rem 2rem', textAlign: 'center', background: 'linear-gradient(145deg, #050505, #0a0a0a)', border: '1px solid #111' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '2rem' }}>
              <LayoutGrid size={80} color="#1a1a1a" />
              <TicketIcon size={40} color="#333" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            </div>
            <h3 style={{ color: '#888', fontSize: '1.5rem', fontFamily: 'Prata', marginBottom: '1rem' }}>Your ticket collection is empty</h3>
            <p style={{ color: '#444', maxWidth: '400px', margin: '0 auto 3rem' }}>
              Once you book a movie, your digital tickets will appear here with all the details.
            </p>
            <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '1.2rem 3rem', borderRadius: '12px', fontWeight: 700 }}>
              EXPLORE MOVIES
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {tickets.map(ticket => (
              <div 
                key={ticket.id} 
                onClick={() => navigate(`/ticket-success/${ticket.id}`)}
                className="ui-panel"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '2.5rem', 
                  padding: '2rem', 
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  background: 'linear-gradient(90deg, #050505 0%, #0a0a0a 100%)',
                  border: '1px solid #111',
                  borderRadius: '24px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-5px) scale(1.01)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#111';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Movie Poster */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img 
                    src={ticket.showtime?.movie?.posterUrl} 
                    style={{ width: '100px', height: '150px', borderRadius: '16px', objectFit: 'cover', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }} 
                    alt="poster" 
                  />
                  <div style={{ position: 'absolute', top: -10, left: -10 }}>
                    {getStatusBadge(ticket.paymentStatus)}
                  </div>
                </div>
                
                {/* Main Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '3px', textTransform: 'uppercase', opacity: 0.8 }}>
                      #{ticket.bookingCode}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.8rem', fontFamily: 'Prata', lineHeight: 1.2 }}>
                    {ticket.showtime?.movie?.title}
                  </h3>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#999', fontSize: '0.9rem' }}>
                      <div style={{ background: '#111', padding: '0.5rem', borderRadius: '8px' }}><Calendar size={16} color="var(--primary)" /></div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: 800, textTransform: 'uppercase' }}>Date & Time</div>
                        <div style={{ color: '#ccc' }}>{new Date(ticket.showtime?.startTime).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#999', fontSize: '0.9rem' }}>
                      <div style={{ background: '#111', padding: '0.5rem', borderRadius: '8px' }}><MapPin size={16} color="var(--primary)" /></div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: 800, textTransform: 'uppercase' }}>Location</div>
                        <div style={{ color: '#ccc' }}>{ticket.showtime?.room?.cinema?.name} • {ticket.showtime?.room?.name}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seats Column */}
                <div style={{ textAlign: 'right', paddingRight: '1rem' }}>
                  <div style={{ color: '#444', fontSize: '0.7rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '2px' }}>SEATS</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                    {ticket.ticketSeats?.map(ts => ts.seat?.rowSymbol + ts.seat?.columnNumber).join(', ')}
                  </div>
                </div>

                <div style={{ background: '#111', padding: '1rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight color="var(--primary)" size={24} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BenefitItem({ text, active }) {
  return (
    <li style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.8rem', 
      fontSize: '0.85rem', 
      color: active ? '#ccc' : '#222',
      textDecoration: active ? 'none' : 'line-through'
    }}>
      <CheckCircle2 size={16} color={active ? 'var(--primary)' : '#111'} />
      {text}
    </li>
  );
}
