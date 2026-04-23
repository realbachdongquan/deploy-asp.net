import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Film, Calendar, Users, 
  Ticket, Tag, Settings, LogOut, ChevronRight, 
  Monitor, Star, Database, MessageSquare,
  QrCode, CreditCard, Sparkles, Popcorn, Award, History, UserCog, MonitorPlay, LayoutGrid
} from 'lucide-react';

const navItems = [
  { name: 'Overview', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'Scanner', path: '/admin/scanner', icon: <QrCode size={20} /> },
  { name: 'Cinemas', path: '/admin/cinemas', icon: <MonitorPlay size={20} /> },
  { name: 'Rooms', path: '/admin/rooms', icon: <LayoutGrid size={20} /> },
  { name: 'Seats', path: '/admin/seats', icon: <Sofa size={20} /> },
  { name: 'Movies', path: '/admin/movies', icon: <Film size={20} /> },
  { name: 'Genres', path: '/admin/genres', icon: <Tag size={20} /> },
  { name: 'Crew', path: '/admin/crew', icon: <Users size={20} /> },
  { name: 'Showtimes', path: '/admin/showtimes', icon: <Calendar size={20} /> },
  { name: 'Tickets', path: '/admin/tickets', icon: <Ticket size={20} /> },
  { name: 'Payments', path: '/admin/payments', icon: <CreditCard size={20} /> },
  { name: 'Promotions', path: '/admin/promotions', icon: <Sparkles size={20} /> },
  { name: 'Concessions', path: '/admin/concessions', icon: <Popcorn size={20} /> },
  { name: 'Reviews', path: '/admin/reviews', icon: <MessageSquare size={20} /> },
  { name: 'Memberships', path: '/admin/memberships', icon: <Award size={20} /> },
  { name: 'Audit Logs', path: '/admin/audit-logs', icon: <History size={20} /> },
  { name: 'Users', path: '/admin/users', icon: <UserCog size={20} /> },
];

function Sofa(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
      <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z" />
      <path d="M4 18v2" />
      <path d="M20 18v2" />
      <path d="M12 4v9" />
    </svg>
  )
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#000', color: 'white' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '280px', 
        background: '#050505', 
        borderRight: '1px solid #111',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 100
      }}>
        {/* Admin Header */}
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #111' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings className="text-white" size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '1px' }}>DWAN <span style={{ color: 'var(--primary)' }}>ADMIN</span></div>
              <div style={{ fontSize: '0.6rem', color: '#555', letterSpacing: '2px' }}>MANAGEMENT SYSTEM</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem', background: '#0a0a0a', borderRadius: '12px', border: '1px solid #111' }}>
            <img src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.fullName || 'Admin'}&background=E50914&color=fff`} style={{ width: '35px', height: '35px', borderRadius: '50%' }} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.fullName || 'Administrator'}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800 }}>SUPER ADMIN</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1.5rem 0.8rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.65rem', color: '#333', fontWeight: 800, letterSpacing: '2px', paddingLeft: '1rem', marginBottom: '1.5rem' }}>MAIN MENU</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.8rem 1rem',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: isActive ? 'white' : '#666',
                    background: isActive ? 'linear-gradient(90deg, rgba(229, 9, 20, 0.2) 0%, transparent 100%)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: '0.3s'
                  }}
                >
                  <span style={{ color: isActive ? 'var(--primary)' : 'inherit' }}>{item.icon}</span>
                  <span style={{ fontWeight: isActive ? 700 : 500, fontSize: '0.85rem' }}>{item.name}</span>
                  {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid #111' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              padding: '0.8rem', 
              background: '#0a0a0a', 
              border: '1px solid #111', 
              borderRadius: '12px', 
              color: '#ff4444', 
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: '0.3s'
            }}
          >
            <LogOut size={18} /> LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#000', position: 'relative' }}>
        {/* Header Bar */}
        <header style={{ 
          padding: '1.5rem 3rem', 
          background: 'rgba(0,0,0,0.8)', 
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #111',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 90
        }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700, color: 'white', letterSpacing: '1px' }}>
            {navItems.find(i => location.pathname === i.path)?.name || 'Dashboard'}
          </h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Monitor size={16} /> VIEW STOREFRONT
            </Link>
          </div>
        </header>

        <div style={{ padding: '3rem' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
