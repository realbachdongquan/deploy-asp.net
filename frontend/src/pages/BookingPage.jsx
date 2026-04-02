import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import showtimeSignalR from '../services/signalr';
import SeatPicker from '../components/SeatPicker';
import { Clock, Ticket, CreditCard, ChevronLeft } from 'lucide-react';

export default function BookingPage() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  const currentUserEmail = JSON.parse(localStorage.getItem('user'))?.email;

  const fetchSeats = useCallback(async (updatedSeats = null) => {
    if (updatedSeats) {
      setSeats(updatedSeats);
      return;
    }
    try {
      const res = await api.get(`/booking/seats/${showtimeId}`);
      setSeats(res.data);
    } catch (err) {
      console.error("Error fetching seats", err);
    }
  }, [showtimeId]);

  useEffect(() => {
    const fetchShowtime = async () => {
      try {
        const res = await api.get(`/showtimes/${showtimeId}`);
        setShowtime(res.data);
      } catch (err) {
        console.error(err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchShowtime();
    fetchSeats();

    // Start SignalR
    showtimeSignalR.startConnection(showtimeId, fetchSeats);

    return () => {
      showtimeSignalR.stopConnection(showtimeId);
    };
  }, [showtimeId, fetchSeats, navigate]);

  // Timer logic
  useEffect(() => {
    if (selectedSeats.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setSelectedSeats([]);
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedSeats]);

  const handleSeatClick = async (seatId) => {
    if (selectedSeats.includes(seatId)) {
        try {
            await api.post('/booking/unlock', { showtimeId: parseInt(showtimeId), seatIds: [seatId] });
            setSelectedSeats(prev => prev.filter(id => id !== seatId));
        } catch (err) {
            console.error("Error unlocking seat", err);
        }
        return;
    }

    try {
      // Try to lock seat on server
      await api.post('/booking/lock', { showtimeId: parseInt(showtimeId), seatIds: [seatId] });
      setSelectedSeats(prev => [...prev, seatId]);
      setTimeLeft(300); // Reset timer on new lock
    } catch (err) {
      alert("This seat is currently being held by another user.");
      fetchSeats(); // Refresh seats to show latest status
    }
  };

  const handleCheckout = async () => {
    setBookingLoading(true);
    try {
      const res = await api.post('/booking/checkout', {
        showtimeId: parseInt(showtimeId),
        seatIds: selectedSeats,
        paymentMethod: 'VNPAY'
      });
      alert(`Booking Successful! Your Code: ${res.data.bookingCode}`);
      navigate('/tickets');
    } catch (err) {
      alert("Checkout failed. Your session may have expired.");
      setSelectedSeats([]);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '10rem', textAlign: 'center' }}><div className="spinner"></div></div>;

  const totalAmount = selectedSeats.length * (showtime?.movie?.basePrice * showtime?.customPriceMultiplier || 50000);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="ui-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={() => navigate(-1)} className="action-btn" style={{ padding: '0.5rem' }}><ChevronLeft /></button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'white' }}>{showtime?.movie?.title}</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {showtime?.room?.name} • {new Date(showtime?.startTime).toLocaleString()}
            </p>
          </div>
        </div>
        {selectedSeats.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 195, 0, 0.1)', padding: '0.75rem 1.5rem', color: 'var(--accent)', fontWeight: 700 }}>
            <Clock size={20} />
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        {/* Main Seat Area */}
        <div className="ui-panel" style={{ background: '#050505' }}>
          <SeatPicker 
            seats={seats} 
            selectedSeats={selectedSeats} 
            onSeatClick={handleSeatClick} 
            currentUserEmail={currentUserEmail}
          />
        </div>

        {/* Order Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="ui-panel" style={{ padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Ticket className="text-primary" /> YOUR ORDER
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Seats ({selectedSeats.length})</span>
                <span style={{ color: 'white' }}>{selectedSeats.length * 50000} VND</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem', paddingTop: '1rem', borderTop: '1px solid #222' }}>
                <span>TOTAL</span>
                <span style={{ color: 'var(--primary)' }}>{totalAmount.toLocaleString()} VND</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>PAYMENT METHOD</p>
              <div style={{ padding: '1rem', background: '#000', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--accent)', fontWeight: 700 }}>
                <CreditCard /> VNPay (Simulator)
              </div>
            </div>

            <button 
              className="btn-primary" 
              disabled={selectedSeats.length === 0 || bookingLoading} 
              onClick={handleCheckout}
              style={{ width: '100%', marginTop: '2rem', padding: '1rem', fontSize: '1rem' }}
            >
              {bookingLoading ? 'PROCESSING...' : 'CONFIRM PURCHASE'}
            </button>
          </div>

          <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center' }}>
            By clicking confirm, you agree to our Terms of Service.
          </div>
        </div>
      </div>
    </div>
  );
}
