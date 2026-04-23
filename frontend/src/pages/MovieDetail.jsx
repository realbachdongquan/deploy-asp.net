import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Clock, Star, MapPin, Calendar, Info, PlayCircle, CheckCircle2, TrendingUp, Sparkles, Gem, Award } from 'lucide-react';

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCinema, setSelectedCinema] = useState('All');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewScore, setReviewScore] = useState(10);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);
  const [actorMovies, setActorMovies] = useState([]);
  const [loadingActorMovies, setLoadingActorMovies] = useState(false);

  const [showTrailer, setShowTrailer] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movieRes, showtimesRes, reviewsRes] = await Promise.all([
          api.get(`/movies/${id}`),
          api.get(`/showtimes/movie/${id}`),
          api.get(`/reviews/movie/${id}`)
        ]);
        setMovie(movieRes.data);
        setShowtimes(Array.isArray(showtimesRes.data) ? showtimesRes.data : []);
        setReviews(reviewsRes.data.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handlePostReview = async () => {
    if (!reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        movieId: parseInt(id),
        score: reviewScore,
        comment: reviewComment
      });
      setReviewComment('');
      // Refresh reviews
      const reviewsRes = await api.get(`/reviews/movie/${id}`);
      setReviews(reviewsRes.data.items || []);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Failed to post review. Make sure you have a verified ticket and haven't reviewed yet.";
      alert(errorMsg);
    } finally {
      setSubmittingReview(false);
    }
  };
  
  const handleActorClick = async (actor) => {
    if (selectedActor?.crewId === actor.crewId) {
      setSelectedActor(null);
      return;
    }
    
    setSelectedActor(actor.crewMember);
    setLoadingActorMovies(true);
    try {
      const res = await api.get(`/movies/crew/${actor.crewId}`);
      // Filter out the current movie
      setActorMovies(res.data.filter(m => m.id !== parseInt(id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActorMovies(false);
    }
  };

  const handleLikeReview = async (reviewId) => {
    try {
      const res = await api.post(`/reviews/${reviewId}/like`);
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, likesCount: res.data.likesCount } : r));
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div className="spinner"></div></div>;
  if (!movie) return <div>Movie not found</div>;

  const cinemas = ['All', ...new Set(showtimes.map(s => s.cinema?.name))];
  const filteredShowtimes = selectedCinema === 'All' 
    ? showtimes 
    : showtimes.filter(s => s.cinema?.name === selectedCinema);

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: 'white' }}>
      {/* Backdrop */}
      <div style={{ 
        height: '50vh', 
        position: 'relative', 
        backgroundImage: `linear-gradient(to top, #000, rgba(0,0,0,0.5)), url(${movie.posterUrl}), url(https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div style={{ position: 'absolute', bottom: '-100px', left: '5%', display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
          <img 
            src={movie.posterUrl} 
            style={{ width: '250px', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', border: '1px solid #333' }} 
            onError={(e) => { e.target.src = "https://placehold.co/400x600/111/white?text=No+Poster"; }}
          />
          <div style={{ paddingBottom: '2rem', flex: 1 }}>
            <h1 style={{ fontSize: '3.5rem', margin: '0 0 0.5rem 0', fontFamily: 'Prata' }}>{movie.title}</h1>
            <div style={{ display: 'flex', gap: '1.5rem', color: '#888', marginBottom: '1.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16}/> {movie.durationMin} MIN</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffcc00' }}><Star size={16} fill="#ffcc00"/> {movie.imdbScore} IMDB</span>
              {movie.averageRating > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                  <Star size={16} fill="var(--primary)"/> {movie.averageRating.toFixed(1)} CINE-SCORE
                </span>
              )}
              <span style={{ background: '#222', padding: '0.1rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>{movie.status}</span>
              <button 
                onClick={() => setShowTrailer(true)}
                style={{ 
                  background: 'var(--primary)', color: 'white', border: 'none', 
                  padding: '0.2rem 1rem', borderRadius: '20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.8rem'
                }}
              >
                <PlayCircle size={16} /> WATCH TRAILER
              </button>
              <div style={{ display: 'flex', gap: '0.5rem', borderLeft: '1px solid #333', paddingLeft: '1rem' }}>
                <button 
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  style={{ background: '#1877F2', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 900 }}>f</span>
                </button>
                <button 
                  onClick={() => window.open(`https://zalo.me/share?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                  style={{ background: '#0068FF', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 900 }}>Z</span>
                </button>
              </div>
            </div>
            <p style={{ 
              color: '#bbb', 
              fontSize: '1rem', 
              lineHeight: '1.6', 
              maxWidth: '800px',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              {movie.synopsis || "No description available for this movie."}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '150px 5% 5rem 5%', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '4rem' }}>
        {/* Left Column: Info */}
        <div>
          <section style={{ marginBottom: '4rem' }}>
            <h3 style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '1rem', marginBottom: '1.5rem' }}>SYNOPSIS</h3>
            <p style={{ color: '#ccc', lineHeight: 1.8, fontSize: '1.1rem' }}>{movie.synopsis}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              {movie.movieGenres?.map(mg => (
                <span key={mg.genreId} style={{ border: '1px solid #333', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.8rem', color: '#888' }}>
                  {mg.genre?.name}
                </span>
              ))}
            </div>
          </section>

          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '1rem', margin: 0 }}>SELECT SHOWTIME</h3>
              <select 
                value={selectedCinema} 
                onChange={e => setSelectedCinema(e.target.value)}
                style={{ background: '#111', color: 'white', border: '1px solid #333', padding: '0.5rem 1rem' }}
              >
                {cinemas.map((c, idx) => <option key={c || idx} value={c}>{c || 'Unknown'}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {filteredShowtimes.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#555', border: '1px dashed #222' }}>
                  {movie.status === 'ComingSoon' 
                    ? "Phim sắp chiếu, vui lòng quay lại sau để cập nhật lịch chiếu." 
                    : "Hiện chưa có suất chiếu cho phim này tại rạp đã chọn."}
                </div>
              ) : (
                // Group by Cinema
                [...new Set(filteredShowtimes.map(s => s.cinemaId))].map((cId, idx) => {
                  const cinemaShowtimes = filteredShowtimes.filter(s => s.cinemaId === cId);
                  const cinema = cinemaShowtimes[0].cinema;
                  return (
                    <div key={cId || idx} className="ui-panel" style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: 'var(--accent)' }}>
                        <MapPin size={20} />
                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cinema?.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {cinemaShowtimes.map(st => (
                          <button 
                            key={st.id} 
                            onClick={() => navigate(`/booking/${st.id}`)}
                            style={{ 
                              background: '#111', 
                              border: '1px solid #333', 
                              padding: '1rem 1.5rem', 
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: '0.3s',
                              borderRadius: '8px'
                            }}
                            className="showtime-btn"
                          >
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white' }}>
                              {new Date(st.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '0.2rem', fontWeight: 600 }}>
                              ~ {new Date(new Date(st.startTime).getTime() + (movie.durationMin + 20) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--primary)', marginTop: '0.4rem', fontWeight: 800 }}>{st.room?.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Reviews Section */}
          <section style={{ marginTop: '5rem' }}>
            <h3 style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '1rem', marginBottom: '2.5rem' }}>AUDIENCE REVIEWS</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '3rem', marginBottom: '4rem' }}>
              {/* Rating Stats */}
              <div className="ui-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'Prata' }}>{movie.averageRating?.toFixed(1) || '0.0'}</div>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '0.5rem' }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.round(movie.averageRating / 2) ? 'var(--primary)' : 'none'} color="var(--primary)" />)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#555', fontWeight: 700 }}>{movie.ratingCount || 0} ĐÁNH GIÁ</div>
                
                <div style={{ width: '100%', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[10, 8, 6, 4, 2].map(score => {
                    const count = reviews.filter(r => r.score >= score && r.score < score + 2).length;
                    const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={score} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#444', width: '20px' }}>{score}</span>
                        <div style={{ flex: 1, height: '4px', background: '#111', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${percent}%`, background: 'var(--primary)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Insights */}
              <div className="ui-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, #0a0a0a, #050505)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05 }}><Sparkles size={120} color="var(--primary)" /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                  <Sparkles size={18} />
                  <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '1.5px' }}>AI INSIGHTS</span>
                </div>
                <h4 style={{ margin: '0 0 1rem 0', fontFamily: 'Prata', fontSize: '1.2rem' }}>Tóm tắt từ khán giả</h4>
                <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.7', margin: 0 }}>
                  {reviews.length > 0 ? (
                    <>Đa số khán giả đánh giá cao <b>kỹ xảo hình ảnh</b> và <b>âm nhạc</b> của phim. Nội dung được nhận xét là {movie.averageRating > 8 ? "cực kỳ lôi cuốn và đầy cảm xúc" : "ổn định, phù hợp để giải trí"}. Một số ít ý kiến cho rằng nhịp phim hơi chậm ở đoạn giữa.</>
                  ) : "Chưa có đủ dữ liệu để AI phân tích. Hãy là người đầu tiên để lại đánh giá!"}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                  {['Kịch tính', 'Hình ảnh đẹp', 'Nhạc hay'].map(tag => (
                    <span key={tag} style={{ padding: '0.3rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', fontSize: '0.7rem', color: '#555', border: '1px solid #111' }}>#{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Post Review Form */}
            {currentUser ? (
              <div className="ui-panel" style={{ padding: '2.5rem', marginBottom: '4rem', background: 'linear-gradient(145deg, #080808, #050505)', border: '1px solid #111' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Prata', letterSpacing: '1px' }}>CHIA SẺ TRẢI NGHIỆM CỦA BẠN</h4>
                  <div style={{ fontSize: '0.7rem', color: '#444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Yêu cầu đã mua vé</div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
                  {[...Array(10)].map((_, i) => (
                    <div 
                      key={i}
                      onMouseEnter={() => !submittingReview && setReviewScore(i + 1)}
                      onClick={() => setReviewScore(i + 1)}
                      style={{ 
                        cursor: 'pointer',
                        padding: '0.4rem',
                        background: i < reviewScore ? 'rgba(229, 9, 20, 0.1)' : 'transparent',
                        borderRadius: '8px',
                        transition: '0.2s'
                      }}
                    >
                      <Star 
                        size={20} 
                        fill={i < reviewScore ? 'var(--primary)' : 'none'} 
                        color={i < reviewScore ? 'var(--primary)' : '#222'} 
                      />
                    </div>
                  ))}
                  <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{reviewScore}</span>
                    <span style={{ fontSize: '0.6rem', color: '#444', fontWeight: 800 }}>ĐIỂM</span>
                  </div>
                </div>

                <textarea 
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Bạn cảm thấy thế nào về bộ phim này? (Cốt truyện, diễn xuất, âm thanh...)"
                  style={{ 
                    width: '100%', minHeight: '100px', background: '#000', border: '1px solid #111', 
                    color: 'white', padding: '1.5rem', marginBottom: '2rem', outline: 'none', fontSize: '1rem',
                    borderRadius: '16px', fontFamily: 'inherit', resize: 'vertical'
                  }}
                />
                
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={handlePostReview}
                    disabled={submittingReview || !reviewComment.trim()}
                    className="btn-primary"
                    style={{ padding: '0.8rem 2.5rem', borderRadius: '12px', fontWeight: 800, letterSpacing: '1px' }}
                  >
                    {submittingReview ? 'ĐANG ĐĂNG...' : 'GỬI ĐÁNH GIÁ'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="ui-panel" style={{ padding: '3rem', textAlign: 'center', marginBottom: '4rem', background: '#050505', border: '1px dashed #222' }}>
                <p style={{ color: '#555', marginBottom: '1.5rem' }}>Bạn cần đăng nhập và đã xem phim để gửi đánh giá.</p>
                <button onClick={() => navigate('/login')} className="action-btn" style={{ padding: '0.8rem 2rem', borderRadius: '8px' }}>ĐĂNG NHẬP NGAY</button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              {reviews.length === 0 ? (
                <div style={{ color: '#333', textAlign: 'center', padding: '4rem', border: '1px solid #080808', borderRadius: '24px' }}>
                  <Star size={40} color="#080808" style={{ marginBottom: '1rem' }} />
                  <p>Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ!</p>
                </div>
              ) : (
                reviews.map(review => (
                  <div key={review.id} style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={review.user?.avatarUrl || `https://ui-avatars.com/api/?name=${review.user?.fullName || 'User'}&background=random`} 
                            style={{ width: '50px', height: '50px', borderRadius: '16px', objectFit: 'cover', border: '1px solid #222' }} 
                          />
                          <div style={{ 
                            position: 'absolute', bottom: -5, right: -5, background: 'var(--primary)', 
                            padding: '2px', borderRadius: '50%', border: '2px solid #000'
                          }}>
                            <CheckCircle2 size={10} color="white" />
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'white' }}>{review.user?.fullName}</span>
                            <ReviewTierBadge tier={review.user?.Tier} />
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#444', fontWeight: 800, textTransform: 'uppercase', marginTop: '0.2rem' }}>
                            {new Date(review.createdAt).toLocaleDateString('vi-VN', { dateStyle: 'medium' })} • {review.cinemaName}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <div style={{ 
                          background: 'rgba(255,255,255,0.02)', padding: '0.5rem 1rem', borderRadius: '12px', 
                          display: 'flex', alignItems: 'center', gap: '0.6rem', border: '1px solid #111'
                        }}>
                          <Star size={18} fill="var(--primary)" color="var(--primary)" />
                          <span style={{ fontWeight: 900, fontSize: '1.2rem' }}>{review.score}</span>
                          <span style={{ fontSize: '0.7rem', color: '#444', fontWeight: 800, marginTop: '0.3rem' }}>/ 10</span>
                        </div>
                        <AISentimentBadge sentiment={review.sentiment} score={review.sentimentScore} />
                      </div>
                    </div>
                    <p style={{ color: '#ccc', margin: 0, lineHeight: 1.8, fontSize: '1.05rem', paddingLeft: '4.2rem', marginBottom: '1rem' }}>
                      {review.comment}
                    </p>
                    <div style={{ paddingLeft: '4.2rem' }}>
                      <button 
                        onClick={() => handleLikeReview(review.id)}
                        style={{ 
                          background: 'transparent', border: 'none', color: '#444', 
                          display: 'flex', alignItems: 'center', gap: '0.5rem', 
                          fontSize: '0.75rem', fontWeight: 700, padding: 0, cursor: 'pointer'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = '#444'}
                      >
                        <TrendingUp size={14} /> HỮU ÍCH ({review.likesCount || 0})
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Cast & Crew */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="ui-panel" style={{ padding: '2rem' }}>
            <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.2rem' }}>CAST & CREW</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {movie.movieCrews?.map((mc, idx) => (
                <div 
                  key={mc.id || idx} 
                  onClick={() => handleActorClick(mc)}
                  style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    transition: '0.3s',
                    background: selectedActor?.id === mc.crewMember?.id ? 'rgba(229, 9, 20, 0.1)' : 'transparent',
                    border: selectedActor?.id === mc.crewMember?.id ? '1px solid rgba(229, 9, 20, 0.3)' : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = selectedActor?.id === mc.crewMember?.id ? 'rgba(229, 9, 20, 0.1)' : 'transparent'}
                >
                  <img src={mc.crewMember?.avatarUrl || "https://placehold.co/100x100/111/white?text=User"} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: selectedActor?.id === mc.crewMember?.id ? 'var(--primary)' : 'white' }}>{mc.crewMember?.fullName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{mc.role} {mc.characterName && `as ${mc.characterName}`}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedActor && (
            <div className="ui-panel" style={{ padding: '2rem', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)' }}>FILMOGRAPHY: {selectedActor.fullName}</h3>
                <button onClick={() => setSelectedActor(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>Close</button>
              </div>
              
              {loadingActorMovies ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}><div className="spinner" style={{ width: '20px', height: '20px' }}></div></div>
              ) : actorMovies.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#555', textAlign: 'center' }}>No other movies found in our database.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {actorMovies.map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => navigate(`/movie/${m.id}`)}
                      style={{ display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', border: '1px solid #111' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#333'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#111'}
                    >
                      <img src={m.posterUrl} style={{ width: '40px', height: '60px', borderRadius: '4px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{m.title}</div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>{new Date(m.releaseDate).getFullYear()} • {m.imdbScore} IMDB</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Movies */}
      <section style={{ padding: '5rem 5%', background: '#050505', borderTop: '1px solid #111' }}>
        <h3 style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '1rem', marginBottom: '3rem', fontSize: '1.5rem', fontFamily: 'Prata' }}>PHIM TƯƠNG TỰ</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
          {/* We'll filter related movies in a real app, here we show NowPlaying as fallback */}
          {/* Ideally fetch movies with same genre */}
          <RelatedMoviesList currentId={id} currentGenreId={movie.movieGenres?.[0]?.genreId} />
        </div>
      </section>

      {/* Trailer Modal */}
      {showTrailer && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', 
          justifyContent: 'center', alignItems: 'center', padding: '2rem' 
        }}>
          <button 
            onClick={() => setShowTrailer(false)}
            style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}
          >
            ×
          </button>
          <div style={{ width: '100%', maxWidth: '1000px', aspectRatio: '16/9' }}>
            {getEmbedUrl(movie.trailerUrl || "https://www.youtube.com/watch?v=Way9Dexny3w") ? (
              <iframe 
                width="100%" 
                height="100%" 
                src={`${getEmbedUrl(movie.trailerUrl || "https://www.youtube.com/watch?v=Way9Dexny3w")}?autoplay=1`} 
                title="Movie Trailer" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            ) : (
              <div style={{ color: 'white', textAlign: 'center' }}>Trailer link is not a valid YouTube URL.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RelatedMoviesList({ currentId, currentGenreId }) {
  const [movies, setMovies] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/movies?pageSize=10').then(res => {
      setMovies(res.data.items || []);
    });
  }, []);

  const related = movies
    .filter(m => m.id !== parseInt(currentId))
    .slice(0, 5);

  return (
    <>
      {related.map(m => (
        <div key={m.id} onClick={() => { navigate(`/movie/${m.id}`); window.scrollTo(0, 0); }} style={{ cursor: 'pointer' }} className="movie-card-v2">
          <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden', borderRadius: '8px' }}>
            <img src={m.posterUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = "https://placehold.co/400x600/111/white?text=No+Poster"; }} />
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>{m.title}</div>
            <div style={{ color: 'var(--accent)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{m.imdbScore} ★</div>
          </div>
        </div>
      ))}
    </>
  );
}

function AISentimentBadge({ sentiment, score }) {
  if (!sentiment) return null;

  const isPositive = sentiment === 'Positive';
  const isNegative = sentiment === 'Negative';
  
  let color = '#888';
  let bgColor = 'rgba(128, 128, 128, 0.1)';
  let label = 'TRUNG LẬP';
  let icon = <TrendingUp size={10} />;

  if (isPositive) {
    color = '#00ff88';
    bgColor = 'rgba(0, 255, 136, 0.1)';
    label = 'TÍCH CỰC';
    icon = <Sparkles size={10} />;
  } else if (isNegative) {
    color = '#ff4d4d';
    bgColor = 'rgba(255, 77, 77, 0.1)';
    label = 'TIÊU CỰC';
    icon = <X size={10} />;
  }

  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', gap: '0.4rem', 
      padding: '0.3rem 0.6rem', borderRadius: '4px', 
      background: bgColor, border: `1px solid ${color}33`,
      color: color, fontSize: '0.6rem', fontWeight: 900,
      letterSpacing: '0.5px'
    }}>
      {icon}
      <span>{label}</span>
      <span style={{ opacity: 0.5, marginLeft: '0.2rem' }}>{(score * 100).toFixed(0)}%</span>
    </div>
  );
}

function ReviewTierBadge({ tier }) {
  if (!tier || tier === 'Standard') return null;
  const isDiamond = tier === 'Diamond';
  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem', 
      borderRadius: '4px', background: isDiamond ? 'rgba(229,9,20,0.1)' : 'rgba(255,195,0,0.1)',
      border: `1px solid ${isDiamond ? 'rgba(229,9,20,0.2)' : 'rgba(255,195,0,0.2)'}`,
      fontSize: '0.6rem', fontWeight: 900, color: isDiamond ? 'var(--primary)' : '#FFC300'
    }}>
      {isDiamond ? <Gem size={10} /> : <Award size={10} />}
      {tier.toUpperCase()}
    </div>
  );
}
