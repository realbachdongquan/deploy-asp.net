import { Link } from 'react-router-dom';
import { Film, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      padding: '2rem',
      textAlign: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(229,9,20,0.06) 0%, transparent 70%)'
    }}>
      {/* Glitch-style 404 */}
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: 'clamp(6rem, 15vw, 12rem)', 
          fontWeight: 900, 
          color: 'transparent',
          WebkitTextStroke: '2px rgba(229,9,20,0.3)',
          fontFamily: 'Prata',
          lineHeight: 1,
          letterSpacing: '0.1em'
        }}>
          404
        </h1>
        <h1 style={{ 
          fontSize: 'clamp(6rem, 15vw, 12rem)', 
          fontWeight: 900, 
          color: 'var(--primary)',
          fontFamily: 'Prata',
          lineHeight: 1,
          position: 'absolute',
          top: 0, left: 0,
          letterSpacing: '0.1em',
          opacity: 0.15
        }}>
          404
        </h1>
      </div>

      <div style={{ 
        background: 'var(--primary)', 
        padding: '0.5rem', 
        borderRadius: '8px',
        marginBottom: '1.5rem'
      }}>
        <Film color="white" size={28} />
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', fontFamily: 'Prata' }}>
        Reel Not Found
      </h2>
      <p style={{ color: '#666', fontSize: '0.95rem', maxWidth: '400px', lineHeight: 1.6, marginBottom: '2.5rem' }}>
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ. 
        Có lẽ bộ phim này đã hết lịch chiếu rồi.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
            <Home size={16} /> TRANG CHỦ
          </button>
        </Link>
        <button 
          onClick={() => window.history.back()} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            padding: '0.75rem 1.5rem',
            background: 'transparent', border: '1px solid #333', color: '#aaa'
          }}
        >
          <ArrowLeft size={16} /> QUAY LẠI
        </button>
      </div>
    </div>
  );
}
