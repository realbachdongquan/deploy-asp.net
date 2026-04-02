import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Film, MonitorPlay, LayoutGrid, Sofa, CalendarDays, Ticket as TicketIcon, LogOut, Tag, Users, Sparkles, UserCog, Popcorn, MessageSquare, Award, History, CreditCard } from 'lucide-react';
import { authService } from '../services/auth';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Cinemas', path: '/cinemas', icon: <MonitorPlay size={18} /> },
    { name: 'Rooms', path: '/rooms', icon: <LayoutGrid size={18} /> },
    { name: 'Seats', path: '/seats', icon: <Sofa size={18} /> },
    { name: 'Movies', path: '/movies', icon: <Film size={18} /> },
    { name: 'Genres', path: '/genres', icon: <Tag size={18} /> },
    { name: 'Crew', path: '/crew', icon: <Users size={18} /> },
    { name: 'Showtimes', path: '/showtimes', icon: <CalendarDays size={18} /> },
    { name: 'Tickets', path: '/tickets', icon: <TicketIcon size={18} /> },
    { name: 'Payments', path: '/payments', icon: <CreditCard size={18} /> },
    { name: 'Promotions', path: '/promotions', icon: <Sparkles size={18} /> },
    { name: 'Concessions', path: '/concessions', icon: <Popcorn size={18} /> },
    { name: 'Reviews', path: '/reviews', icon: <MessageSquare size={18} /> },
    { name: 'Memberships', path: '/memberships', icon: <Award size={18} /> },
    { name: 'Audit Logs', path: '/audit-logs', icon: <History size={18} /> },
    { name: 'Users', path: '/users', icon: <UserCog size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Sidebar - Brutalist Edge */}
      <aside style={{ 
        width: '260px', 
        display: 'flex', 
        flexDirection: 'column', 
        background: '#090909',
        borderRight: '1px solid #2a2a2a',
        zIndex: 10
      }}>
        <div style={{ padding: '2.5rem 1.5rem', borderBottom: '1px solid #2a2a2a' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 400, color: '#fff', margin: 0, lineHeight: 1 }}>THE<span style={{ color: 'var(--primary)' }}>ATER.</span></h1>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>Management Terminal</p>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem 0' }}>
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                {item.icon} {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid #2a2a2a', background: '#090909' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', 
              background: 'transparent', color: 'var(--danger)', border: 'none',
              padding: '0.5rem 0'
            }}
          >
            <LogOut size={18} /> SYSTEM LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '3rem 4rem', height: '100vh', overflowY: 'auto' }}>
        <header style={{ marginBottom: '3rem', borderBottom: '2px solid var(--primary)', display: 'inline-block', paddingBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '2rem', margin: 0, textTransform: 'uppercase' }}>
            {navItems.find(i => location.pathname.startsWith(i.path))?.name || 'Dashboard'}
          </h2>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
