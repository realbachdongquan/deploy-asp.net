import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { QrCode, CheckCircle, XCircle, User, Film, Ticket, Camera, Keyboard, RefreshCw } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function AdminScanner() {
  const [bookingCode, setBookingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('camera'); // 'camera' or 'manual'
  const scannerRef = useRef(null);

  useEffect(() => {
    if (mode === 'camera' && !result) {
      const scanner = new Html5QrcodeScanner('reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      });

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
        }
      };
    }
  }, [mode, result]);

  const onScanSuccess = (decodedText) => {
    // If it's a URL, extract the code or just use the text
    let code = decodedText;
    if (decodedText.includes('/')) {
        const parts = decodedText.split('/');
        code = parts[parts.length - 1];
    }
    
    if (scannerRef.current) {
        scannerRef.current.clear().then(() => {
            handleVerifyCode(code);
        }).catch(err => console.error(err));
    } else {
        handleVerifyCode(code);
    }
  };

  const onScanFailure = (err) => {
    // Quietly ignore scan failures (they happen constantly when no QR is in view)
  };

  const handleVerifyCode = async (code) => {
    if (!code) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await api.post(`/tickets/verify/${code}`);
      setResult(res.data);
      setBookingCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      // If error, allow retry by switching back to scanner after 3 seconds or manual
      if (mode === 'camera') {
          setTimeout(() => setError(null), 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e?.preventDefault();
    handleVerifyCode(bookingCode);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="ui-panel" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <div style={{ padding: '0.8rem', background: 'rgba(229, 9, 20, 0.1)', color: 'var(--primary)', borderRadius: '12px' }}>
                    <QrCode size={28} />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.6rem', fontFamily: 'Prata', letterSpacing: '1px' }}>TICKET AUTHENTICATOR</h2>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#555' }}>Real-time verification system for cinema entry</p>
                </div>
            </div>
            
            <div style={{ display: 'flex', background: '#0a0a0a', padding: '0.3rem', borderRadius: '12px', border: '1px solid #111' }}>
                <button 
                    onClick={() => { setMode('camera'); setResult(null); setError(null); }}
                    style={{ 
                        padding: '0.6rem 1.2rem', border: 'none', borderRadius: '10px', cursor: 'pointer',
                        background: mode === 'camera' ? 'var(--primary)' : 'transparent',
                        color: mode === 'camera' ? 'white' : '#666',
                        display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', fontWeight: 700, transition: '0.3s'
                    }}
                >
                    <Camera size={16} /> CAMERA
                </button>
                <button 
                    onClick={() => { setMode('manual'); setResult(null); setError(null); }}
                    style={{ 
                        padding: '0.6rem 1.2rem', border: 'none', borderRadius: '10px', cursor: 'pointer',
                        background: mode === 'manual' ? 'var(--primary)' : 'transparent',
                        color: mode === 'manual' ? 'white' : '#666',
                        display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', fontWeight: 700, transition: '0.3s'
                    }}
                >
                    <Keyboard size={16} /> MANUAL
                </button>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr' : (mode === 'camera' ? '1fr' : '1fr'), gap: '2rem' }}>
          
          {/* Scanner / Input Area */}
          {!result && (
            <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
              {mode === 'camera' ? (
                <div style={{ position: 'relative' }}>
                    <div id="reader" style={{ border: 'none', background: '#000', borderRadius: '16px', overflow: 'hidden' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '250px', height: '250px', border: '2px solid var(--primary)', borderRadius: '24px', pointerEvents: 'none', boxShadow: '0 0 0 1000px rgba(0,0,0,0.5)' }}></div>
                    <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#666', fontSize: '0.8rem', letterSpacing: '2px' }}>CENTER QR CODE IN THE BOX</p>
                </div>
              ) : (
                <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <input 
                        type="text" 
                        placeholder="ENTER BOOKING CODE" 
                        value={bookingCode}
                        onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                        autoFocus
                        style={{ 
                        width: '100%', background: '#080808', border: '1px solid #222', color: 'white', 
                        padding: '1.5rem', fontSize: '1.5rem', letterSpacing: '4px', textAlign: 'center',
                        fontWeight: 900, outline: 'none', borderRadius: '12px'
                        }}
                    />
                    <button 
                        type="submit" 
                        disabled={loading || !bookingCode}
                        className="btn-primary"
                        style={{ padding: '1.2rem', fontSize: '1rem', borderRadius: '12px' }}
                    >
                        {loading ? <RefreshCw className="spinner" /> : 'VERIFY TICKET'}
                    </button>
                </form>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && !result && (
            <div style={{ 
                maxWidth: '500px', margin: '1rem auto', padding: '1.5rem', 
                background: 'rgba(229, 9, 20, 0.1)', border: '1px solid var(--danger)', 
                color: 'var(--danger)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' 
            }}>
                <XCircle />
                <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div style={{ 
                maxWidth: '600px', margin: '0 auto', width: '100%',
                padding: '3rem', background: 'rgba(74, 222, 128, 0.05)', border: '1px solid #4ade80', 
                borderRadius: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '50%' }}></div>
                
                <div style={{ color: '#4ade80', marginBottom: '2rem' }}>
                    <CheckCircle size={64} strokeWidth={1.5} />
                </div>
                
                <h3 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0', color: 'white' }}>ENTRY GRANTED</h3>
                <p style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.9rem', marginBottom: '3rem', letterSpacing: '1px' }}>{result.message || 'VALID TICKET DETECTED'}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '16px' }}>
                    <InfoItem icon={<Film size={16} />} label="MOVIE" value={result.movie} />
                    <InfoItem icon={<User size={16} />} label="CUSTOMER" value={result.customer} />
                    <InfoItem icon={<Ticket size={16} />} label="SEATS" value={result.seats} color="var(--primary)" />
                    <InfoItem icon={<Clock size={16} />} label="SHOWTIME" value={result.showtime || 'N/A'} />
                </div>

                <button 
                    onClick={() => {setResult(null); setBookingCode('');}}
                    className="btn-primary"
                    style={{ 
                        width: '100%', marginTop: '3rem', padding: '1.2rem', 
                        background: 'white', color: 'black', border: 'none',
                        fontWeight: 800, fontSize: '0.9rem', letterSpacing: '2px'
                    }}
                >
                    SCAN NEXT TICKET
                </button>
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        #reader__status_span { display: none !important; }
        #reader__dashboard_section_csr button {
            background: #111 !important;
            border: 1px solid #222 !important;
            color: #888 !important;
            padding: 0.5rem 1rem !important;
            border-radius: 8px !important;
            font-size: 0.7rem !important;
            text-transform: uppercase !important;
            font-weight: 800 !important;
            cursor: pointer !important;
        }
        #reader__dashboard_section_csr button:hover {
            background: var(--primary) !important;
            color: white !important;
        }
        #reader video { border-radius: 12px !important; }
      `}} />
    </div>
  );
}

function InfoItem({ icon, label, value, color = 'white' }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.65rem', color: '#555', fontWeight: 800, letterSpacing: '1px' }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {value}
            </div>
        </div>
    );
}
