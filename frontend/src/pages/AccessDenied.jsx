import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
      background: '#050505',
      color: 'white'
    }}>
      <div style={{ 
        background: 'rgba(229,9,20,0.1)', 
        padding: '2.5rem', 
        borderRadius: '50%', 
        marginBottom: '2rem',
        border: '1px solid rgba(229,9,20,0.2)',
        boxShadow: '0 0 40px rgba(229,9,20,0.15)'
      }}>
        <ShieldAlert size={100} color="#E50914" />
      </div>

      <h1 style={{ 
        fontSize: '3.5rem', 
        fontWeight: 900, 
        marginBottom: '1rem', 
        letterSpacing: '-2px',
        fontFamily: 'Prata, serif'
      }}>
        TRUY CẬP BỊ TỪ CHỐI
      </h1>
      
      <p style={{ 
        color: '#888', 
        maxWidth: '500px', 
        lineHeight: '1.8', 
        marginBottom: '3rem', 
        fontSize: '1.2rem',
        fontWeight: 400
      }}>
        Hệ thống phát hiện bạn không có đủ quyền hạn để truy cập vào khu vực này. 
        Khu vực Quản trị chỉ dành riêng cho tài khoản Quản trị viên.
      </p>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" className="btn-primary" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.8rem', 
          padding: '1.2rem 2.5rem', 
          fontSize: '1rem',
          textDecoration: 'none',
          borderRadius: '12px'
        }}>
          <Home size={20} /> QUAY VỀ TRANG CHỦ
        </Link>
        
        <button onClick={() => window.history.back()} style={{ 
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'white',
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.8rem', 
          padding: '1.2rem 2.5rem', 
          fontSize: '1rem',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: '0.3s'
        }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} 
           onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
          <ArrowLeft size={20} /> QUAY LẠI TRANG TRƯỚC
        </button>
      </div>

      <div style={{ marginTop: '4rem', color: '#333', fontSize: '0.8rem', letterSpacing: '2px' }}>
        ERROR CODE: 403_FORBIDDEN_ACCESS
      </div>
    </div>
  );
}
