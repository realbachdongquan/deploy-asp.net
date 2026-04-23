// Admin Dashboard with Analytics (Pure CSS Charts)
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { authService } from '../services/auth';
import { TrendingUp, Ticket, Film, Users, DollarSign, Clock, ArrowUpRight, ArrowDownRight, Activity, Pencil, Plus, Trash2, History, Sparkles, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState([]);
  const [accessDenied, setAccessDenied] = useState(false);

  const user = authService.getUser();

  useEffect(() => {
    const allowedRoles = ['Admin', 'Manager', 'Staff'];
    if (!user || !allowedRoles.includes(user.role)) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [statsRes, logsRes, revenueRes, aiRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/auditlogs?page=1&pageSize=5'),
          api.get('/AdminDashboard/revenue-stats'),
          api.get('/AdminDashboard/ai-movie-insights')
        ]);
        setStats(statsRes.data);
        setRecentLogs(logsRes.data.items || []);
        setRevenueData(revenueRes.data || []);
        setAiInsights(aiRes.data || null);
      } catch (err) {
        console.error("Dashboard error:", err);
        if (err.response?.status === 403) {
          setAccessDenied(true);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}><div className="spinner"></div></div>;

  if (accessDenied) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '5rem 2rem',
        textAlign: 'center',
        background: 'rgba(229,9,20,0.02)',
        borderRadius: '24px',
        border: '1px dashed rgba(229,9,20,0.2)',
        marginTop: '2rem'
      }}>
        <div style={{ 
          background: 'rgba(229,9,20,0.1)', 
          padding: '2rem', 
          borderRadius: '50%', 
          marginBottom: '2rem',
          animation: 'pulse 2s infinite'
        }}>
          <ShieldAlert size={80} color="var(--primary)" />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-1px' }}>TRUY CẬP BỊ TỪ CHỐI</h1>
        <p style={{ color: '#666', maxWidth: '500px', lineHeight: '1.6', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
          Bạn không có quyền truy cập vào khu vực quản trị. Vui lòng quay lại trang chủ hoặc liên hệ quản trị viên nếu bạn tin rằng đây là một sự nhầm lẫn.
        </p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', padding: '1rem 2.5rem', fontSize: '1rem' }}>
          <ArrowLeft size={20} /> QUAY VỀ TRANG CHỦ
        </Link>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <StatCard 
          icon={<DollarSign size={24} />} 
          label="TOTAL REVENUE" 
          value={`${stats?.totalRevenue?.toLocaleString() ?? 0} VND`} 
          color="#4ade80" 
          trend="+12.5%"
        />
        <StatCard 
          icon={<Ticket size={24} />} 
          label="TICKETS SOLD" 
          value={stats?.totalTickets ?? 0} 
          color="#3b82f6" 
          trend="+5.2%"
        />
        <StatCard 
          icon={<Film size={24} />} 
          label="MOVIES PLAYING" 
          value={stats?.totalMovies ?? 0} 
          color="var(--primary)" 
          trend="Stable"
        />
        <StatCard 
          icon={<Users size={24} />} 
          label="ACTIVE USERS" 
          value={stats?.totalUsers ?? 0} 
          color="#a855f7" 
          trend="+18.7%"
        />
      </div>

      {/* Charts Section (CSS Based) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>
        <div className="ui-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <TrendingUp size={20} style={{ color: 'var(--primary)' }} /> REVENUE TREND (7 DAYS)
            </h3>
            <div style={{ fontSize: '0.7rem', color: '#555', fontWeight: 800 }}>VND / DAY</div>
          </div>
          
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', paddingBottom: '2rem', borderBottom: '1px solid #111', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', opacity: 0.1 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ borderTop: '1px dashed #fff', width: '100%' }}></div>)}
            </div>
            
            {revenueData?.map((item, idx) => {
              const maxRevenue = Math.max(...revenueData.map(i => i.revenue)) || 1;
              const height = (item.revenue / maxRevenue) * 100;
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
                   <div style={{ 
                     width: '100%', 
                     height: `${height}%`, 
                     background: 'linear-gradient(180deg, var(--primary) 0%, rgba(229, 9, 20, 0.1) 100%)',
                     borderRadius: '6px 6px 0 0',
                     transition: 'height 1s ease-out',
                     position: 'relative'
                   }} className="chart-bar-hover">
                      <div className="chart-tooltip">
                        {item.revenue?.toLocaleString()}đ
                      </div>
                   </div>
                   <div style={{ fontSize: '0.6rem', color: '#444', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {new Date(item.date).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                   </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ui-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: '0 0 2.5rem 0', fontSize: '1.1rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Sparkles size={20} style={{ color: 'var(--accent)' }} /> AI MOVIE HOTNESS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {aiInsights?.data?.map((m, idx) => {
              let movieInsight = null;
              try {
                const analysis = JSON.parse(aiInsights.aiAnalysis || "[]");
                movieInsight = Array.isArray(analysis) ? analysis.find(a => a.movieId == m.id) : null;
              } catch (e) {
                console.warn("AI Analysis parse error");
              }
              
              return (
                <div key={idx} style={{ paddingBottom: '1.2rem', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>{m.title}</div>
                    <div style={{ 
                        fontSize: '0.65rem', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '20px',
                        background: movieInsight?.trend === 'Up' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: movieInsight?.trend === 'Up' ? '#4ade80' : '#ef4444',
                        fontWeight: 800,
                        display: 'flex', alignItems: 'center', gap: '0.2rem'
                    }}>
                        {movieInsight?.trend === 'Up' ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                        {movieInsight?.trend || 'Stable'}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#666', fontStyle: 'italic', lineHeight: '1.4' }}>
                    "{movieInsight?.insight || 'Phim đang thu hút sự quan tâm lớn từ khán giả.'}"
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#444' }}>Reviews: <span style={{ color: '#888' }}>{m.reviewCount}</span></div>
                    <div style={{ fontSize: '0.65rem', color: '#444' }}>Sentiment: <span style={{ color: m.averageSentiment > 0 ? '#4ade80' : '#ef4444' }}>{(m.averageSentiment * 100).toFixed(0)}%</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* Recent Bookings */}
        <div className="ui-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.1rem' }}>
              <Clock size={20} style={{ color: 'var(--primary)' }} /> RECENT BOOKINGS
            </h3>
            <button style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '0.8rem', fontWeight: 700 }}>VIEW ALL</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#444', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <th style={{ padding: '1rem' }}>Booking Code</th>
                  <th style={{ padding: '1rem' }}>Customer</th>
                  <th style={{ padding: '1rem' }}>Movie</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentBookings?.map(b => (
                  <tr key={b.id} style={{ borderTop: '1px solid #0a0a0a', transition: '0.2s' }} className="hover-row">
                    <td style={{ padding: '1.2rem 1rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '1rem' }}>{b.bookingCode}</span>
                      <div style={{ fontSize: '0.65rem', color: '#333' }}>{new Date(b.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td style={{ padding: '1.2rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#ccc' }}>{b.userName}</div>
                    </td>
                    <td style={{ padding: '1.2rem 1rem' }}>
                      <div style={{ color: '#888', fontSize: '0.9rem' }}>{b.movieTitle}</div>
                    </td>
                    <td style={{ padding: '1.2rem 1rem', textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'white' }}>{b.totalPrice?.toLocaleString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live System Logs */}
        <div className="ui-panel" style={{ padding: '2rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <History size={20} style={{ color: 'var(--primary)' }} /> LIVE SYSTEM LOGS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentLogs.length === 0 ? (
              <p style={{ color: '#555', textAlign: 'center', padding: '1rem' }}>No activity logs yet.</p>
            ) : (
              recentLogs.map(log => (
                <div key={log.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.8rem', background: '#080808', border: '1px solid #111', borderRadius: '8px' }}>
                  <div style={{ 
                    padding: '0.5rem', 
                    background: log.action.includes('Delete') ? 'rgba(239, 68, 68, 0.1)' : log.action.includes('Create') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: log.action.includes('Delete') ? '#ef4444' : log.action.includes('Create') ? '#22c55e' : '#3b82f6',
                    borderRadius: '6px'
                  }}>
                    {log.action.includes('Delete') ? <Trash2 size={14}/> : log.action.includes('Create') ? <Plus size={14}/> : <Pencil size={14}/>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ccc' }}>
                      {log.action} <span style={{ color: 'var(--primary)' }}>{log.targetTable}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#444' }}>Target ID: #{log.targetId} • {new Date(log.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <button onClick={() => navigate('/admin/audit')} style={{ width: '100%', marginTop: '1.5rem', background: 'transparent', border: '1px solid #111', color: '#555', padding: '0.6rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '4px', cursor: 'pointer' }}>
            VIEW FULL AUDIT TRAIL
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .chart-bar-hover:hover {
          filter: brightness(1.3);
          cursor: pointer;
        }
        .chart-tooltip {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: #E50914;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 800;
          opacity: 0;
          transition: 0.2s;
          pointer-events: none;
        }
        .chart-bar-hover:hover .chart-tooltip {
          opacity: 1;
          top: -35px;
        }
      `}} />
    </div>
  );
}

function StatCard({ icon, label, value, color, trend }) {
  const isPositive = trend?.startsWith('+');
  return (
    <div className="ui-panel" style={{ 
      padding: '1.5rem', 
      position: 'relative',
      background: 'linear-gradient(145deg, #111 0%, #080808 100%)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div style={{ background: `${color}15`, color: color, padding: '0.75rem', borderRadius: '12px' }}>
          {icon}
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.2rem', 
          fontSize: '0.7rem', 
          fontWeight: 800,
          color: trend === 'Stable' ? '#666' : isPositive ? '#4ade80' : '#ff4444',
          background: 'rgba(0,0,0,0.3)',
          padding: '0.2rem 0.5rem',
          borderRadius: '20px'
        }}>
          {trend === 'Stable' ? null : isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#555', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '0.5rem' }}>{label}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', fontFamily: 'Prata' }}>{value}</div>
      </div>
    </div>
  );
}
