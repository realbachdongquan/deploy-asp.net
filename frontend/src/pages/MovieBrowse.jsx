import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Play, Calendar, Star, Sparkles, MapPin, Search, MessageSquare, Quote } from 'lucide-react';

export default function MovieBrowse() {
  const [movies, setMovies] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [genres, setGenres] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('NowPlaying');
  const [selectedCity, setSelectedCity] = useState('Hồ Chí Minh');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState(null);
  const [sortBy, setSortBy] = useState('latest');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const cinemaParam = selectedCinemaId ? `&cinemaId=${selectedCinemaId}` : '';
        const [nowRes, soonRes, recRes, genreRes, reviewRes, cinemasRes] = await Promise.all([
          api.get(`/movies?status=NowPlaying&pageSize=100${cinemaParam}`),
          api.get(`/movies?status=ComingSoon&pageSize=100${cinemaParam}`),
          api.get('/movies/recommendations'),
          api.get('/genres'),
          api.get('/reviews/recent?count=4'),
          api.get('/cinemas?pageSize=100')
        ]);
        setMovies(Array.isArray(nowRes.data.items) ? nowRes.data.items : []);
        setComingSoon(Array.isArray(soonRes.data.items) ? soonRes.data.items : []);
        setRecommended(Array.isArray(recRes.data) ? recRes.data : []);
        setGenres(Array.isArray(genreRes.data) ? genreRes.data : []);
        setRecentReviews(Array.isArray(reviewRes.data) ? reviewRes.data : []);
        setCinemas(Array.isArray(cinemasRes.data.items) ? cinemasRes.data.items : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCinemaId]);

  const displayMovies = (activeTab === 'NowPlaying' ? movies : comingSoon)
    .filter(m => {
      const matchSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGenre = selectedGenre === 'All' || m.genres?.some(g => g.name === selectedGenre);
      return matchSearch && matchGenre;
    })
    .sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.releaseDate) - new Date(a.releaseDate);
      if (sortBy === 'rating') return (b.imdbScore || 0) - (a.imdbScore || 0);
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      return 0;
    });

  if (loading) return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '0' }}>
      {/* Skeleton Hero */}
      <div className="skeleton" style={{ height: '70vh', borderRadius: 0 }} />
      {/* Skeleton Filter Bar */}
      <div style={{ padding: '1.5rem 5%', background: '#080808', borderBottom: '1px solid #111' }}>
        <div className="skeleton" style={{ width: '200px', height: '2rem' }} />
      </div>
      {/* Skeleton Cards */}
      <div style={{ padding: '3rem 5%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem' }}>
        {[...Array(8)].map((_, i) => (
          <div key={i}>
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-text" style={{ marginTop: '1rem' }} />
            <div className="skeleton skeleton-text-sm" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: 'white' }}>
      {/* Hero Section */}
      <div 
        className="movie-browse-hero"
        style={{ 
          height: '70vh', 
          position: 'relative', 
          backgroundImage: `linear-gradient(to top, #000, transparent), url(${movies[0]?.posterUrl}), url(https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#050505'
        }}
      >
        <div style={{ position: 'absolute', bottom: '10%', left: '5%', maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 700, marginBottom: '1rem' }}>
            <Star size={20} fill="var(--accent)" /> {movies[0]?.imdbScore} IMDB
          </div>
          <h1 style={{ fontSize: '4rem', margin: '0 0 1rem 0', fontFamily: 'Prata' }}>{movies[0]?.title}</h1>
          <p style={{ fontSize: '1.1rem', color: '#ccc', marginBottom: '2rem', lineHeight: 1.6 }}>{movies[0]?.synopsis}</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => navigate(`/movie/${movies[0]?.id}`)} className="btn-primary" style={{ padding: '1rem 2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Play fill="white" /> BOOK TICKETS
            </button>
          </div>
        </div>
      </div>

      {/* Quick Filter Bar (MoMo Style) */}
      <div style={{ 
        padding: '1rem 5%', 
        background: '#080808', 
        borderBottom: '1px solid #111',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--accent)' }}>
              <MapPin size={18} />
              <select 
                value={selectedCity} 
                onChange={e => setSelectedCity(e.target.value)}
                style={{ background: 'transparent', color: 'white', border: 'none', fontWeight: 700, outline: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Cần Thơ">Cần Thơ</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '2rem' }}>
              {['NowPlaying', 'ComingSoon'].map(tab => (
                <div 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    cursor: 'pointer', 
                    fontWeight: 700, 
                    fontSize: '0.85rem',
                    color: activeTab === tab ? 'white' : '#555',
                    position: 'relative',
                    padding: '0.5rem 0'
                  }}
                >
                  {tab === 'NowPlaying' ? 'ĐANG CHIẾU' : 'SẮP CHIẾU'}
                  {activeTab === tab && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '3px', background: 'var(--primary)', borderRadius: '2px' }}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <input 
                type="text"
                placeholder="Tìm phim..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem 0.5rem 2.2rem',
                  background: '#000',
                  border: '1px solid #222',
                  borderRadius: '20px',
                  color: 'white',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
              <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#444' }}>
                <Search size={14} />
              </div>
            </div>

            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ background: '#111', color: '#ccc', border: '1px solid #222', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.75rem', outline: 'none' }}
            >
              <option value="latest">Mới nhất</option>
              <option value="rating">Đánh giá cao</option>
              <option value="name">Tên A-Z</option>
            </select>
          </div>
        </div>

        {/* Genre Pills */}
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.2rem' }} className="no-scrollbar">
          <div 
            onClick={() => setSelectedGenre('All')}
            style={{ 
              padding: '0.3rem 1rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              background: selectedGenre === 'All' ? 'var(--primary)' : '#111',
              color: selectedGenre === 'All' ? 'white' : '#777',
              border: `1px solid ${selectedGenre === 'All' ? 'var(--primary)' : '#222'}`,
              whiteSpace: 'nowrap'
            }}
          >
            TẤT CẢ
          </div>
          {genres.map(g => (
            <div 
              key={g.id}
              onClick={() => setSelectedGenre(g.name)}
              style={{ 
                padding: '0.3rem 1rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                background: selectedGenre === g.name ? 'var(--primary)' : '#111',
                color: selectedGenre === g.name ? 'white' : '#777',
                border: `1px solid ${selectedGenre === g.name ? 'var(--primary)' : '#222'}`,
                whiteSpace: 'nowrap'
              }}
            >
              {g.name.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Cinema Brands */}
      <div style={{ padding: '2rem 5% 0 5%', display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }} className="no-scrollbar">
        <div 
          onClick={() => setSelectedCinemaId(null)} 
          style={{ textAlign: 'center', cursor: 'pointer', minWidth: '80px' }}
        >
          <div style={{ 
            width: '60px', height: '60px', background: '#111', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem',
            border: `2px solid ${selectedCinemaId === null ? 'var(--primary)' : '#222'}`, transition: '0.3s'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: selectedCinemaId === null ? 'var(--primary)' : '#555' }}>ALL</div>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: selectedCinemaId === null ? 'white' : '#666' }}>Tất cả rạp</div>
        </div>
        {cinemas.map(cinema => (
          <div key={cinema.id} onClick={() => setSelectedCinemaId(cinema.id)} style={{ textAlign: 'center', cursor: 'pointer', minWidth: '80px' }}>
            <div style={{ 
              width: '60px', height: '60px', background: '#111', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem',
              border: `2px solid ${selectedCinemaId === cinema.id ? 'var(--primary)' : '#222'}`, transition: '0.3s',
              overflow: 'hidden'
            }}>
              <img 
                src={cinema.logoUrl || `https://placehold.co/60x60/111/white?text=${cinema.name.substring(0,1)}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: selectedCinemaId === cinema.id ? 'white' : '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>
              {cinema.name}
            </div>
          </div>
        ))}
      </div>

      {/* Recommended Section (AI Pick) */}
      {recommended.length > 0 && searchTerm === '' && (
        <div style={{ padding: '3rem 5% 1rem 5%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <Sparkles className="text-primary" size={24} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Prata' }}>GỢI Ý TỪ AI CHO BẠN</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem' }}>
            {recommended.slice(0, 5).map(movie => <MovieCard key={movie.id} movie={movie} onClick={() => navigate(`/movie/${movie.id}`)} />)}
          </div>
        </div>
      )}

      {/* Movie List Section */}
      <div style={{ padding: '3rem 5% 5rem 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontFamily: 'Prata' }}>{activeTab === 'NowPlaying' ? 'PHIM ĐANG CHIẾU' : 'PHIM SẮP CHIẾU'}</h2>
          <div style={{ fontSize: '0.9rem', color: '#555' }}>Hiển thị {displayMovies.length} phim</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem' }}>
          {displayMovies.map(movie => <MovieCard key={movie.id} movie={movie} onClick={() => navigate(`/movie/${movie.id}`)} />)}
        </div>

        {/* Social Feed Section */}
        {recentReviews.length > 0 && (
          <section style={{ padding: '6rem 0 0 0' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                    <MessageSquare size={18} />
                    <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '2px' }}>CỘNG ĐỒNG NÓI GÌ</span>
                  </div>
                  <h2 style={{ fontSize: '2.5rem', fontFamily: 'Prata', margin: 0 }}>Cảm hứng từ người xem</h2>
                </div>
                <p style={{ color: '#555', maxWidth: '400px', fontSize: '0.9rem', margin: 0 }}>Những chia sẻ chân thực nhất về trải nghiệm điện ảnh từ cộng đồng DWAN Cinema.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                {recentReviews.map(review => (
                  <div 
                    key={review.id} 
                    className="ui-panel" 
                    style={{ 
                      padding: '2rem', background: '#080808', cursor: 'pointer', transition: 'all 0.3s ease',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #111'
                    }}
                    onClick={() => navigate(`/movie/${review.movieId}`)}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#111'}
                  >
                    <div>
                      <Quote size={24} color="var(--primary)" style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                        "{review.comment?.length > 120 ? review.comment.substring(0, 120) + '...' : review.comment}"
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid #111', paddingTop: '1.5rem' }}>
                      <img 
                        src={review.movie?.posterUrl} 
                        style={{ width: '40px', height: '60px', borderRadius: '4px', objectFit: 'cover' }} 
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white', marginBottom: '0.2rem' }}>{review.movie?.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', color: '#444' }}>{review.user?.fullName}</span>
                          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#333' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 800 }}>
                            <Star size={10} fill="var(--primary)" /> {review.score}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {displayMovies.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#333' }}>
            Không tìm thấy phim nào phù hợp.
          </div>
        )}
      </div>
    </div>
  );
}

function MovieCard({ movie, onClick }) {
  return (
    <div onClick={onClick} className="movie-card-v2">
      <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden', borderRadius: '12px' }}>
        <img 
          src={movie.posterUrl} 
          alt={movie.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
          onError={(e) => { e.target.src = "https://placehold.co/400x600/111/white?text=No+Poster"; }}
        />
        <div className="card-overlay">
          <button className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem' }}>QUICK BOOK</button>
        </div>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{movie.title}</div>
        <div style={{ color: '#666', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span>{movie.durationMin} MIN</span>
          <span style={{ color: 'var(--accent)' }}>{movie.imdbScore} ★</span>
        </div>
      </div>
    </div>
  );
}
