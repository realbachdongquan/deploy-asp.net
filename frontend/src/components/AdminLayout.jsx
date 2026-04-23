import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Film, Calendar, Users, 
  Ticket, Tag, Settings, LogOut, ChevronRight, 
  Monitor, Star, Database, MessageSquare
} from 'lucide-react';

const MENU_ITEMS = [
  { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/admin' },
  { icon: <Film size={20} />, label: 'Movies', path: '/admin/movies' },
  { icon: <Calendar size={20} />, label: 'Showtimes', path: '/admin/showtimes' },
  { icon: <Monitor size={20} />, label: 'Cinemas & Rooms', path: '/admin/cinemas' },
  { icon: <Ticket size={20} />, label: 'Tickets', path: '/admin/tickets' },
  { icon: <Users size={20} />, label: 'Users', path: '/admin/users' },
  { icon: <Tag size={20} />, label: 'Promotions', path: '/admin/promotions' },
  { icon: <MessageSquare size={20} />, label: 'Reviews', path: '/admin/reviews' },
  { icon: <Database size={20} />, label: 'Audit Logs', path: '/admin/audit' },
];

export default function AdminLayout() {
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
        height: '100vh'
      }}>
        {/* Admin Header */}
        <div style={{ padding: '2.5rem 2rem', borderBottom: '1px solid #111' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings className="text-white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '1px' }}>DWAN <span style={{ color: 'var(--primary)' }}>ADMIN</span></div>
              <div style={{ fontSize: '0.6rem', color: '#555', letterSpacing: '2px' }}>MANAGEMENT SYSTEM</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#0a0a0a', borderRadius: '12px', border: '1px solid #111' }}>
            <img src={user?.avatarUrl || "https://placehold.co/100x100/111/white?text=Admin"} style={{ width: '35px', height: '35px', borderRadius: '50%' }} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.fullName}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>{user?.role || 'ADMIN'}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '2rem 1rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.65rem', color: '#333', fontWeight: 800, letterSpacing: '2px', paddingLeft: '1rem', marginBottom: '1.5rem' }}>MAIN MENU</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {MENU_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: isActive ? 'white' : '#666',
                    background: isActive ? 'linear-gradient(90deg, rgba(229, 9, 20, 0.2) 0%, transparent 100%)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: '0.3s'
                  }}
                  className="admin-nav-item"
                >
                  <span style={{ color: isActive ? 'var(--primary)' : 'inherit' }}>{item.icon}</span>
                  <span style={{ fontWeight: isActive ? 700 : 500, fontSize: '0.9rem' }}>{item.label}</span>
                  {isActive && <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div style={{ padding: '2rem', borderTop: '1px solid #111' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              padding: '1rem', 
              background: '#0a0a0a', 
              border: '1px solid #111', 
              borderRadius: '12px', 
              color: '#ff4444', 
              cursor: 'pointer',
              fontWeight: 700,
              transition: '0.3s'
            }}
          >
            <LogOut size={20} /> LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '3rem', height: '100vh', overflowY: 'auto', background: '#000' }}>
        <Outlet />
      </main>
    </div>
  );
}
