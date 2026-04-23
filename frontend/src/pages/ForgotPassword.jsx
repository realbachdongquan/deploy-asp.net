import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, ArrowLeft, Film, Send } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      padding: '20px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(229,9,20,0.08) 0%, transparent 60%)'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--primary)', padding: '0.6rem', borderRadius: '8px' }}>
              <Film color="white" size={28} />
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', letterSpacing: '2px', fontFamily: 'Prata' }}>DWAN CINEMA</span>
          </Link>
        </div>

        <div className="ui-panel" style={{ padding: '2.5rem' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Mail size={22} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Quên Mật Khẩu?</h2>
            <p style={{ color: '#666', fontSize: '0.85rem' }}>Nhập email để nhận hướng dẫn khôi phục</p>
          </div>

          {/* Success/Error Messages */}
          {message && (
            <div style={{ 
              color: '#4ade80', 
              marginBottom: '1.5rem', 
              textAlign: 'center', 
              fontSize: '0.85rem',
              background: 'rgba(74,222,128,0.08)',
              padding: '0.75rem 1rem',
              border: '1px solid rgba(74,222,128,0.2)'
            }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{ 
              color: 'var(--danger)', 
              marginBottom: '1.5rem', 
              textAlign: 'center', 
              fontSize: '0.85rem',
              background: 'rgba(229,9,20,0.08)',
              padding: '0.75rem 1rem',
              border: '1px solid rgba(229,9,20,0.2)'
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem' }}>Địa chỉ Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                style={{ width: '100%' }}
                required 
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ marginTop: '0.5rem', padding: '0.85rem', fontSize: '0.9rem' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  Đang xử lý...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                  GỬI YÊU CẦU <Send size={16} />
                </span>
              )}
            </button>
          </form>

          {/* Back to Login link */}
          <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #222' }}>
            <Link to="/login" style={{ color: '#888', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowLeft size={14} /> Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
