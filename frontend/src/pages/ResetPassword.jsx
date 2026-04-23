import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Lock, CheckCircle, Film, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Mã xác thực không tìm thấy. Vui lòng kiểm tra lại link trong email.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
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
          {success ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <CheckCircle size={32} color="#4ade80" />
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Thành Công!</h2>
              <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Mật khẩu của bạn đã được cập nhật. Đang chuyển hướng về trang đăng nhập trong giây lát...
              </p>
              <button 
                onClick={() => navigate('/login')}
                className="btn-primary" 
                style={{ marginTop: '2rem', width: '100%', padding: '0.85rem' }}
              >
                ĐĂNG NHẬP NGAY
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <ShieldCheck size={22} color="var(--primary)" />
                </div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Đặt Lại Mật Khẩu</h2>
                <p style={{ color: '#666', fontSize: '0.85rem' }}>Vui lòng tạo mật khẩu mới an toàn</p>
              </div>

              {/* Error Message */}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem' }}>Mật khẩu mới</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ width: '100%', paddingRight: '3rem' }}
                      required 
                      disabled={loading || !token}
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

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem' }}>Xác nhận mật khẩu</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%' }}
                    required 
                    disabled={loading || !token}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading || !token}
                  style={{ marginTop: '0.5rem', padding: '0.85rem', fontSize: '0.9rem' }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                      Đang xử lý...
                    </span>
                  ) : 'CẬP NHẬT MẬT KHẨU'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
