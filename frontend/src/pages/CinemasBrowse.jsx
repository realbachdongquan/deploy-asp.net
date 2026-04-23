import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MapPin, Phone, Info, ChevronRight, Search, Building2, Star, Clock } from 'lucide-react';

export default function CinemasBrowse() {
  const navigate = useNavigate();
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const res = await api.get('/cinemas?pageSize=100');
        const items = res.data?.items || res.data || [];
        setCinemas(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error("Error fetching cinemas", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCinemas();
  }, []);

  const filteredCinemas = cinemas.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
      <div className="spinner" style={{ width: '50px', height: '50px' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: 'white', padding: '4rem 5%' }}>
      {/* Header Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '3rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', fontFamily: 'Prata', marginBottom: '1rem',
          background: 'linear-gradient(to right, white, #666)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          HỆ THỐNG RẠP
        </h1>
        <p style={{ color: '#888', maxWidth: '600px', lineHeight: '1.6' }}>
          Khám phá hệ thống rạp chiếu phim hiện đại với công nghệ âm thanh Dolby Atmos và màn hình IMAX đỉnh cao.
        </p>

        {/* Search Bar */}
        <div style={{ 
          marginTop: '2rem', position: 'relative', maxWidth: '500px',
          borderBottom: '2px solid #222', transition: 'border-color 0.3s'
        }} className="search-container">
          <Search style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: '#444' }} size={20} />
          <input 
            type="text" 
            placeholder="Tìm theo tên rạp hoặc khu vực..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', background: 'transparent', border: 'none', 
              padding: '1rem 1rem 1rem 2.5rem', color: 'white', 
              fontSize: '1rem', outline: 'none' 
            }}
          />
        </div>
      </div>

      {/* Grid */}
      <div style={{ 
        maxWidth: '1200px', margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '2rem' 
      }}>
        {filteredCinemas.map(cinema => (
          <div key={cinema.id} className="ui-panel" style={{ 
            padding: 0, overflow: 'hidden', background: '#0a0a0a', 
            border: '1px solid #1a1a1a', transition: 'all 0.3s ease',
            cursor: 'pointer'
          }} onClick={() => navigate(`/showtimes?cinemaId=${cinema.id}`)}>
            
            {/* Fake Image / Banner */}
            <div style={{ 
              height: '140px', background: 'linear-gradient(45deg, #111, #050505)',
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(#e50914 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }} />
              <Building2 size={48} color="#333" />
              <div style={{ 
                position: 'absolute', top: '1rem', right: '1rem',
                padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.6)', 
                borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800,
                color: 'var(--success)', border: '1px solid rgba(0,255,136,0.2)',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
                ĐANG HOẠT ĐỘNG
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Prata', letterSpacing: '0.5px' }}>
                  {cinema.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 800 }}>
                  <Star size={12} fill="var(--accent)" /> 4.9
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', color: '#666', fontSize: '0.85rem' }}>
                  <MapPin size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  <span style={{ lineHeight: '1.4' }}>{cinema.address}</span>
                </div>
                {cinema.hotline && (
                  <div style={{ display: 'flex', gap: '0.75rem', color: '#666', fontSize: '0.85rem' }}>
                    <Phone size={16} style={{ flexShrink: 0 }} />
                    <span>{cinema.hotline}</span>
                  </div>
                )}
              </div>

              <div style={{ 
                marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #1a1a1a',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cinema.name + ' ' + cinema.address)}`, '_blank');
                  }}
                  style={{ 
                    background: 'transparent', border: 'none', color: '#aaa', 
                    fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px',
                    display: 'flex', alignItems: 'center', gap: '0.4rem', padding: 0
                  }}
                >
                  XEM BẢN ĐỒ
                </button>

                <button style={{ 
                  background: 'transparent', border: 'none', color: 'var(--primary)', 
                  fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px',
                  display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0
                }}>
                  LỊCH CHIẾU <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCinemas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <Info size={48} color="#222" style={{ marginBottom: '1rem' }} />
          <p style={{ color: '#444', fontSize: '1.1rem' }}>Không tìm thấy rạp nào phù hợp với yêu cầu của bạn.</p>
        </div>
      )}

      <style>{`
        .search-container:focus-within {
          border-color: var(--primary) !important;
        }
        .search-container:focus-within svg {
          color: var(--primary) !important;
        }
        .ui-panel:hover {
          border-color: var(--primary) !important;
          transform: translateY(-5px);
        }
      `}</style>
    </div>
  );
}
