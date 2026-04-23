import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { authService } from '../services/auth';
import { 
  User, Mail, Phone, Shield, Calendar, Ticket, Star, Gem, Award,
  Edit3, Save, X, Lock, Eye, EyeOff, Film, TrendingUp, MessageSquare, Sparkles
} from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phoneNumber: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Change password
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setProfile(res.data);
        setEditForm({
          fullName: res.data.user?.fullName || '',
          phoneNumber: res.data.user?.phoneNumber || ''
        });
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await api.put('/auth/profile', editForm);
      setProfile(prev => ({ ...prev, user: { ...prev.user, ...res.data.user } }));
      // Update localStorage
      const stored = authService.getUser();
      if (stored) {
        localStorage.setItem('user', JSON.stringify({ ...stored, fullName: editForm.fullName }));
      }
      setEditing(false);
      setSaveMsg('✓ Đã cập nhật thành công');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg('✗ Lỗi khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }
    setPwdLoading(true);
    setPwdMsg({ type: '', text: '' });
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      setPwdMsg({ type: 'success', text: '✓ Đổi mật khẩu thành công!' });
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => { setShowPwdForm(false); setPwdMsg({ type: '', text: '' }); }, 2000);
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Đổi mật khẩu thất bại' });
    } finally {
      setPwdLoading(false);
    }
  };

  const getTierInfo = (tier) => {
    switch(tier) {
      case 'Diamond': return { icon: <Gem size={20} />, color: '#E50914', bg: 'linear-gradient(135deg, #1a0a0a 0%, #3d0000 50%, #1a0a0a 100%)', label: 'DIAMOND' };
      case 'Gold': return { icon: <Award size={20} />, color: '#FFC300', bg: 'linear-gradient(135deg, #1a1500 0%, #3d2e00 50%, #1a1500 100%)', label: 'GOLD' };
      default: return { icon: <Star size={20} />, color: '#888', bg: 'linear-gradient(135deg, #111 0%, #1a1a1a 50%, #111 100%)', label: 'STANDARD' };
    }
  };

  const getNextTier = (tier, points) => {
    if (tier === 'Standard') return { next: 'Gold', required: 500, progress: Math.min((points / 500) * 100, 100) };
    if (tier === 'Gold') return { next: 'Diamond', required: 2000, progress: Math.min((points / 2000) * 100, 100) };
    return { next: null, required: 0, progress: 100 };
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="spinner" style={{ width: '50px', height: '50px' }} />
    </div>
  );

  if (!profile) return null;

  const { user, membership, stats } = profile;
  const tierInfo = getTierInfo(membership?.tierName);
  const nextTier = getNextTier(membership?.tierName, membership?.accumulatedPoints || 0);

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: 'white' }}>
      {/* Hero Banner */}
      <div style={{
        height: '200px', position: 'relative',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(229,9,20,0.15) 0%, transparent 70%)',
        borderBottom: '1px solid #111'
      }}>
        <div style={{ position: 'absolute', bottom: '-50px', left: '5%', display: 'flex', alignItems: 'flex-end', gap: '1.5rem' }}>
          {/* Avatar */}
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), #ff6b6b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '4px solid #000', boxShadow: '0 4px 20px rgba(229,9,20,0.3)',
            fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Prata', color: 'white'
          }}>
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
          </div>
          <div style={{ paddingBottom: '0.5rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontFamily: 'Prata' }}>{user.fullName || 'Chưa đặt tên'}</h1>
            <p style={{ margin: '0.2rem 0 0', color: '#666', fontSize: '0.85rem' }}>{user.email}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '80px 5% 4rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {[
                { icon: <Ticket size={20} />, value: stats.ticketCount, label: 'Vé đã mua', color: 'var(--primary)' },
                { icon: <TrendingUp size={20} />, value: `${(stats.totalSpent / 1000).toFixed(0)}K`, label: 'Tổng chi tiêu', color: 'var(--accent)' },
                { icon: <MessageSquare size={20} />, value: stats.reviewCount, label: 'Đánh giá', color: '#00ff88' },
              ].map((stat, i) => (
                <div key={i} className="ui-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ color: stat.color, marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'Prata' }}>{stat.value}</div>
                  <div style={{ color: '#555', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px', marginTop: '0.3rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Personal Info */}
            <div className="ui-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <User size={18} color="var(--primary)" /> Thông Tin Cá Nhân
                </h3>
                {!editing ? (
                  <button onClick={() => setEditing(true)} style={{ 
                    background: 'transparent', border: '1px solid #333', color: '#aaa', 
                    display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.75rem' 
                  }}>
                    <Edit3 size={13} /> Sửa
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleSaveProfile} disabled={saving} className="btn-primary" style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.75rem' 
                    }}>
                      <Save size={13} /> {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                    <button onClick={() => setEditing(false)} style={{ 
                      background: 'transparent', border: '1px solid #333', color: '#888', padding: '0.4rem 0.8rem', fontSize: '0.75rem' 
                    }}>
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>

              {saveMsg && (
                <div style={{ color: saveMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  {saveMsg}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <InfoRow icon={<Mail size={16} />} label="Email" value={user.email} />
                {editing ? (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#666', marginBottom: '0.4rem', fontWeight: 700 }}>HỌ VÀ TÊN</label>
                      <input value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} 
                        style={{ width: '100%' }} placeholder="Nhập họ tên" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#666', marginBottom: '0.4rem', fontWeight: 700 }}>SỐ ĐIỆN THOẠI</label>
                      <input value={editForm.phoneNumber} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} 
                        style={{ width: '100%' }} placeholder="09xx xxx xxx" />
                    </div>
                  </>
                ) : (
                  <>
                    <InfoRow icon={<User size={16} />} label="Họ và Tên" value={user.fullName || '—'} />
                    <InfoRow icon={<Phone size={16} />} label="Số điện thoại" value={user.phoneNumber || '—'} />
                  </>
                )}
                <InfoRow icon={<Shield size={16} />} label="Vai trò" value={user.role} badge />
                <InfoRow icon={<Calendar size={16} />} label="Ngày tham gia" value={new Date(user.createdAt).toLocaleDateString('vi-VN')} />
              </div>
            </div>

            {/* Change Password */}
            <div className="ui-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showPwdForm ? '1.5rem' : 0 }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Lock size={18} color="var(--primary)" /> Bảo Mật
                </h3>
                {!showPwdForm && (
                  <button onClick={() => setShowPwdForm(true)} style={{ 
                    background: 'transparent', border: '1px solid #333', color: '#aaa', 
                    padding: '0.4rem 0.8rem', fontSize: '0.75rem' 
                  }}>
                    Đổi mật khẩu
                  </button>
                )}
              </div>

              {showPwdForm && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#666', marginBottom: '0.4rem', fontWeight: 700 }}>MẬT KHẨU HIỆN TẠI</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPwd ? 'text' : 'password'} value={pwdForm.currentPassword}
                        onChange={e => setPwdForm({...pwdForm, currentPassword: e.target.value})}
                        style={{ width: '100%', paddingRight: '2.5rem' }} />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ 
                        position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: '#555', padding: '0.2rem' 
                      }}>
                        {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#666', marginBottom: '0.4rem', fontWeight: 700 }}>MẬT KHẨU MỚI</label>
                    <input type="password" value={pwdForm.newPassword}
                      onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})}
                      style={{ width: '100%' }} placeholder="Tối thiểu 6 ký tự" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#666', marginBottom: '0.4rem', fontWeight: 700 }}>XÁC NHẬN MẬT KHẨU MỚI</label>
                    <input type="password" value={pwdForm.confirmPassword}
                      onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})}
                      style={{ width: '100%' }} />
                  </div>
                  {pwdMsg.text && (
                    <div style={{ color: pwdMsg.type === 'success' ? 'var(--success)' : 'var(--danger)', fontSize: '0.8rem' }}>
                      {pwdMsg.text}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={handleChangePassword} disabled={pwdLoading} className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem' }}>
                      {pwdLoading ? 'Đang xử lý...' : 'Xác nhận đổi'}
                    </button>
                    <button onClick={() => { setShowPwdForm(false); setPwdMsg({ type: '', text: '' }); }} style={{ 
                      background: 'transparent', border: '1px solid #333', color: '#888', padding: '0.6rem 1rem', fontSize: '0.8rem' 
                    }}>
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Membership Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {membership && (
              <div style={{
                background: tierInfo.bg,
                border: `1px solid ${tierInfo.color}33`,
                borderRadius: '16px',
                padding: '2rem',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Decorative lines */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', 
                  background: `radial-gradient(circle, ${tierInfo.color}11, transparent)` }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: tierInfo.color, fontWeight: 800, fontSize: '0.7rem', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                      {tierInfo.icon} {tierInfo.label} MEMBER
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>DWAN CINEMA</div>
                  </div>
                  <div style={{ 
                    background: 'var(--primary)', padding: '0.4rem', borderRadius: '6px'
                  }}>
                    <Film size={16} color="white" />
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Prata', color: tierInfo.color }}>
                    {(membership.accumulatedPoints || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 700, letterSpacing: '1px' }}>ĐIỂM TÍCH LŨY</div>
                </div>

                {/* Progress to next tier */}
                {nextTier.next && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#555', marginBottom: '0.5rem' }}>
                      <span>{membership.tierName}</span>
                      <span>{nextTier.next}</span>
                    </div>
                    <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', width: `${nextTier.progress}%`, 
                        background: `linear-gradient(90deg, ${tierInfo.color}, ${tierInfo.color}88)`,
                        borderRadius: '2px', transition: 'width 1s ease'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#444', marginTop: '0.4rem' }}>
                      Còn {Math.max(0, nextTier.required - (membership.accumulatedPoints || 0)).toLocaleString()} điểm để lên {nextTier.next}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#555', fontFamily: 'monospace' }}>
                  {user.fullName?.toUpperCase() || 'MEMBER'}
                </div>
              </div>
            )}

            {/* Benefits */}
            <div className="ui-panel" style={{ padding: '2rem' }}>
              <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem' }}>Quyền Lợi Thành Viên</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { tier: 'Standard', perks: ['Tích điểm 5% mỗi giao dịch', 'Ưu đãi ngày sinh nhật'], active: true },
                  { tier: 'Gold', perks: ['Tích điểm 8%', 'Ưu tiên chọn ghế', 'Giảm 10% bắp nước'], active: membership?.tierName === 'Gold' || membership?.tierName === 'Diamond' },
                  { tier: 'Diamond', perks: ['Tích điểm 12%', 'Phòng chờ VIP', 'Giảm 20% bắp nước', 'Vé IMAX miễn phí/tháng'], active: membership?.tierName === 'Diamond' },
                ].map(t => (
                  <div key={t.tier} style={{ 
                    padding: '1rem', background: t.active ? 'rgba(229,9,20,0.05)' : '#0a0a0a', 
                    border: `1px solid ${t.active ? 'rgba(229,9,20,0.15)' : '#1a1a1a'}`,
                    opacity: t.active ? 1 : 0.5
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: t.active ? 'var(--primary)' : '#555', marginBottom: '0.5rem', letterSpacing: '1px' }}>
                      {t.tier.toUpperCase()} {t.active && '✓'}
                    </div>
                    {t.perks.map((p, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', color: '#888', padding: '0.15rem 0' }}>• {p}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <AIRecommendationList />
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 768px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function AIRecommendationList() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('AI');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await api.get('/recommendation/me');
        setRecommendations(res.data.recommendations || []);
        setSource(res.data.source);
      } catch (err) {
        console.error("AI Recommendation error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, []);

  if (loading) return (
    <div className="ui-panel" style={{ padding: '2rem', textAlign: 'center' }}>
      <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
      <p style={{ fontSize: '0.7rem', color: '#555', marginTop: '1rem' }}>AI ĐANG PHÂN TÍCH GU CỦA BẠN...</p>
    </div>
  );

  if (recommendations.length === 0) return null;

  return (
    <div className="ui-panel" style={{ padding: '2rem', background: 'linear-gradient(145deg, #0a0a0a, #050505)', border: '1px solid #111' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem' }}>
          <Sparkles size={18} color="var(--primary)" /> Gợi ý cho riêng bạn
        </h3>
        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px' }}>
          {source === 'AI' ? 'POWERED BY GEMINI AI' : 'TRENDING NOW'}
        </span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
        {recommendations.map(movie => (
          <div 
            key={movie.id} 
            onClick={() => navigate(`/movie/${movie.id}`)}
            style={{ cursor: 'pointer' }}
            className="movie-card-mini"
          >
            <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.5rem', border: '1px solid #222' }}>
              <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 8px', background: 'rgba(0,0,0,0.8)', fontSize: '0.6rem', fontWeight: 800, color: 'var(--accent)' }}>
                {movie.imdbScore} ★
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.title}</div>
            <div style={{ fontSize: '0.65rem', color: '#555' }}>{new Date(movie.releaseDate).getFullYear()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid #111' }}>
      <div style={{ color: '#444', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.65rem', color: '#555', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '0.2rem' }}>{label.toUpperCase()}</div>
        {badge ? (
          <span style={{ 
            fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', 
            background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.2)', color: 'var(--primary)' 
          }}>{value}</span>
        ) : (
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{value}</div>
        )}
      </div>
    </div>
  );
}
