import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Ticket, Home, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  
  const success = searchParams.get('success') === 'true' || searchParams.get('vnp_ResponseCode') === '00';
  const ticketId = searchParams.get('ticketId') || searchParams.get('vnp_TxnRef');

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus(success ? 'success' : 'failed');
    }, 1500);

    // Fallback confirm for localhost (when IPN cannot reach us)
    if (success && ticketId) {
      const confirmPayment = async () => {
        try {
          // Use the same query string from VNPAY to confirm on backend
          await api.get(`/payment/vnpay-ipn${window.location.search}`);
        } catch (err) {
          console.error("Auto-confirm failed", err);
        }
      };
      confirmPayment();
    }

    return () => clearTimeout(timer);
  }, [success, ticketId]);

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="ui-panel" style={{ maxWidth: '500px', width: '100%', padding: '4rem 2rem', textAlign: 'center' }}>
        {status === 'processing' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <div className="spinner" style={{ width: '60px', height: '60px' }}></div>
            <h2 style={{ fontFamily: 'Prata', margin: 0 }}>Verifying Payment...</h2>
            <p style={{ color: '#666', margin: 0 }}>Please wait while we confirm your transaction with VNPAY.</p>
          </div>
        ) : status === 'success' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(0, 255, 136, 0.1)', padding: '2rem', borderRadius: '50%', marginBottom: '1rem' }}>
              <CheckCircle size={80} color="#00ff88" />
            </div>
            <h1 style={{ fontFamily: 'Prata', fontSize: '2.5rem', margin: 0 }}>Payment Successful!</h1>
            <p style={{ color: '#888', maxWidth: '300px', margin: '0 auto 2rem' }}>
              Your seats are secured. A confirmation email has been sent to your inbox.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <button 
                onClick={() => navigate(`/ticket-success/${ticketId}`)} 
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1.2rem' }}
              >
                <Ticket size={20} /> VIEW MY TICKET
              </button>
              <button 
                onClick={() => navigate('/')} 
                style={{ background: 'transparent', border: '1px solid #222', color: '#666', padding: '1.2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
              >
                <Home size={20} /> BACK TO HOME
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(255, 59, 48, 0.1)', padding: '2rem', borderRadius: '50%', marginBottom: '1rem' }}>
              <XCircle size={80} color="#ff3b30" />
            </div>
            <h1 style={{ fontFamily: 'Prata', fontSize: '2.5rem', margin: 0 }}>Payment Failed</h1>
            <p style={{ color: '#888', maxWidth: '300px', margin: '0 auto 2rem' }}>
              We couldn't process your payment. Don't worry, your seats haven't been charged.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <button 
                onClick={() => navigate(-1)} 
                className="btn-primary"
                style={{ background: 'white', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1.2rem' }}
              >
                TRY AGAIN <ArrowRight size={20} />
              </button>
              <button 
                onClick={() => navigate('/')} 
                style={{ background: 'transparent', border: '1px solid #222', color: '#666', padding: '1.2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
              >
                <Home size={20} /> BACK TO HOME
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
