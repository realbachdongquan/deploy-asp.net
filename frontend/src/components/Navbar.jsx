import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Film, User, ShieldCheck, LogOut, Award, Gem, Star, Menu, X, Ticket } from 'lucide-react';
import { authService } from '../services/auth';
import api from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const user = authService.getUser();
  const isAdmin = ['Admin', 'Manager', 'Staff'].includes(user?.role);
  const [membership, setMembership] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/memberships/mine')
        .then(res => setMembership(res.data))
        .catch(() => {
          // Gracefully handle - membership info is non-critical
          setMembership(null);
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getTierInfo = (tier) => {
    switch(tier) {
      case 'Diamond': return { icon: <Gem size={14} />, color: 'var(--primary)', label: 'DIAMOND' };
      case 'Gold': return { icon: <Award size={14} />, color: 'var(--accent)', label: 'GOLD' };
      default: return { icon: <Star size={14} />, color: '#888', label: 'STANDARD' };
    }
  };

  const navLinks = [
    { to: '/', label: 'PHIM' },
    { to: '/cinemas', label: 'RẠP' },
    { to: '/promotions', label: 'KHUYẾN MÃI' },
  ];

  return (
    <nav style={{ 
      padding: '1rem 5%', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid #111',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <div style={{ background: 'var(--primary)', padding: '0.45rem', borderRadius: '6px' }}>
          <Film color="white" size={20} />
        </div>
        <span style={{ 
          fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', 
          fontWeight: 800, color: 'white', 
          letterSpacing: '2px', fontFamily: 'Prata' 
        }}>
          DWAN CINEMA
        </span>
      </Link>

      {/* Desktop Nav */}
      <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {navLinks.map(link => (
          <Link key={link.label} to={link.to} style={{ 
            color: '#ccc', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
            transition: 'color 0.2s'
          }}>
            {link.label}
          </Link>
        ))}
        {user && (
          <Link to="/my-tickets" style={{ 
            color: '#ccc', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
            <Ticket size={14} /> VÉ CỦA TÔI
          </Link>
        )}
        
        <div style={{ width: '1px', height: '20px', background: '#333' }} />

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            {isAdmin && (
              <Link to="/admin" style={{ 
                display: 'flex', alignItems: 'center', gap: '0.4rem', 
                color: 'var(--accent)', textDecoration: 'none',
                fontSize: '0.75rem', fontWeight: 700,
                border: '1px solid var(--accent)',
                padding: '0.35rem 0.7rem', borderRadius: '4px'
              }}>
                <ShieldCheck size={14} /> ADMIN
              </Link>
            )}
            {/* Membership badge */}
            {membership && (
              <div style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end', 
                padding: '0.2rem 1rem', borderRight: '1px solid #222'
              }}>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.3rem', 
                  fontSize: '0.6rem', fontWeight: 800, 
                  color: getTierInfo(membership.tierName).color 
                }}>
                  {getTierInfo(membership.tierName).icon} {getTierInfo(membership.tierName).label}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white' }}>
                  {(membership.accumulatedPoints || 0).toLocaleString()} <span style={{ fontSize: '0.55rem', color: '#555' }}>PTS</span>
                </div>
              </div>
            )}
            {/* User info */}
            <Link to="/profile" style={{ textAlign: 'right', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{user.fullName || user.email}</div>
              <div style={{ fontSize: '0.65rem', color: '#555' }}>{user.role}</div>
            </Link>
            <button onClick={handleLogout} style={{ background: 'transparent', color: '#666', padding: '0.4rem' }} title="Đăng xuất">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/login">
              <button style={{ background: 'transparent', border: '1px solid #333', color: '#ccc', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                ĐĂNG NHẬP
              </button>
            </Link>
            <Link to="/register">
              <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                ĐĂNG KÝ
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className="nav-mobile-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{ 
          display: 'none', background: 'transparent', border: 'none', 
          color: 'white', padding: '0.5rem'
        }}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="nav-mobile-menu" style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'rgba(8,8,8,0.98)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #222', padding: '1rem 5%',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          {navLinks.map(link => (
            <Link key={link.label} to={link.to} onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#ccc', textDecoration: 'none', padding: '0.75rem 0', fontSize: '0.9rem', fontWeight: 600, borderBottom: '1px solid #151515' }}>
              {link.label}
            </Link>
          ))}
          {user && (
            <Link to="/my-tickets" onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#ccc', textDecoration: 'none', padding: '0.75rem 0', fontSize: '0.9rem', fontWeight: 600, borderBottom: '1px solid #151515' }}>
              VÉ CỦA TÔI
            </Link>
          )}
          <div style={{ paddingTop: '0.5rem' }}>
            {user ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.fullName || user.email}</div>
                  {membership && (
                    <div style={{ fontSize: '0.7rem', color: getTierInfo(membership.tierName).color, marginTop: '0.2rem' }}>
                      {getTierInfo(membership.tierName).label} • {(membership.accumulatedPoints || 0).toLocaleString()} PTS
                    </div>
                  )}
                </div>
                <button onClick={handleLogout} className="btn-danger" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>
                  ĐĂNG XUẤT
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ flex: 1 }}>
                  <button style={{ width: '100%', background: 'transparent', border: '1px solid #333', color: '#ccc', padding: '0.6rem' }}>ĐĂNG NHẬP</button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{ flex: 1 }}>
                  <button className="btn-primary" style={{ width: '100%', padding: '0.6rem' }}>ĐĂNG KÝ</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Responsive CSS injected */}
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: block !important; }
        }
        @media (min-width: 769px) {
          .nav-mobile-menu { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
