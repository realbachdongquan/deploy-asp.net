import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { Film, LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.login(email, password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
      setError(msg);
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
              <LogIn size={22} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Chào Mừng Trở Lại</h2>
            <p style={{ color: '#666', fontSize: '0.85rem' }}>Đăng nhập để tiếp tục trải nghiệm</p>
          </div>

          {/* Error */}
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
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem' }}>Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                style={{ width: '100%' }}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem' }}>Mật Khẩu</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'}  
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  style={{ width: '100%', paddingRight: '3rem' }}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', padding: '0.25rem', color: '#666'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
              <Link to="/forgot-password" style={{ color: '#888', fontSize: '0.75rem', textDecoration: 'none' }}>
                Quên mật khẩu?
              </Link>
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
              ) : 'ĐĂNG NHẬP'}
            </button>
          </form>

          {/* Register link */}
          <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #222' }}>
            <span style={{ color: '#666', fontSize: '0.85rem' }}>
              Chưa có tài khoản?{' '}
              <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                Tạo Tài Khoản
              </Link>
            </span>
          </div>
        </div>

        {/* Back to home */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/" style={{ color: '#555', textDecoration: 'none', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <ArrowLeft size={14} /> Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
