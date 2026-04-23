import { useState, useEffect } from 'react';
import api from '../services/api';
import { Pencil, Trash2, Plus, Film, UserPlus, X, Sparkles } from 'lucide-react';
import Drawer from '../components/Drawer';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [allGenres, setAllGenres] = useState([]);
  const [allCrew, setAllCrew] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '', durationMin: 0, releaseDate: '', basePrice: 50000, status: 'ComingSoon', synopsis: '',
    posterUrl: '', backdropUrl: '', trailerUrl: '',
    movieGenres: [], movieCrews: []
  });
  const [editingId, setEditingId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerateAI = async () => {
    if (!formData.title) return alert("Please enter a movie title first!");
    try {
      setGenerating(true);
      const res = await api.post('/movies/generate-content', { title: formData.title });
      setFormData(prev => ({
        ...prev,
        synopsis: res.data.description || res.data.summary
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to generate content with AI.");
    } finally {
      setGenerating(false);
    }
  };

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [recommendedMovies, setRecommendedMovies] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [movRes, genRes, crewRes, recRes] = await Promise.all([
        api.get(`/movies?page=${page}&pageSize=${pageSize}`),
        api.get('/genres'),
        api.get('/crewmembers'),
        api.get('/movies/recommendations').catch(() => ({ data: [] })) // Tránh lỗi nếu chưa đăng nhập hoặc API lỗi
      ]);
      setMovies(Array.isArray(movRes.data.items) ? movRes.data.items : []);
      setTotalCount(movRes.data.totalCount || 0);
      setTotalPages(movRes.data.totalPages || 0);
      setAllGenres(Array.isArray(genRes.data.items) ? genRes.data.items : Array.isArray(genRes.data) ? genRes.data : []);
      setAllCrew(Array.isArray(crewRes.data.items) ? crewRes.data.items : Array.isArray(crewRes.data) ? crewRes.data : []);
      setRecommendedMovies(Array.isArray(recRes.data) ? recRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, pageSize]);

  const openAdd = () => {
    setEditingId(null);
    setFormData({
      title: '', durationMin: 120, releaseDate: new Date().toISOString().split('T')[0],
      basePrice: 85000, status: 'ComingSoon', synopsis: '',
      posterUrl: '', backdropUrl: '', trailerUrl: '',
      movieGenres: [], movieCrews: []
    });
    setIsDrawerOpen(true);
  };

  const openEdit = (movie) => {
    setEditingId(movie.id);
    setFormData({
      title: movie.title,
      durationMin: movie.durationMin,
      releaseDate: movie.releaseDate ? movie.releaseDate.split('T')[0] : '',
      basePrice: movie.basePrice,
      status: movie.status,
      synopsis: movie.synopsis || '',
      posterUrl: movie.posterUrl || '',
      backdropUrl: movie.backdropUrl || '',
      trailerUrl: movie.trailerUrl || '',
      movieGenres: movie.movieGenres || [],
      movieCrews: movie.movieCrews || []
    });
    setIsDrawerOpen(true);
  };

  const toggleGenre = (genreId) => {
    setFormData(prev => {
      const genres = Array.isArray(prev.movieGenres) ? prev.movieGenres : [];
      const exists = genres.find(mg => mg.genreId === genreId);
      if (exists) {
        return { ...prev, movieGenres: prev.movieGenres.filter(mg => mg.genreId !== genreId) };
      }
      return { ...prev, movieGenres: [...prev.movieGenres, { genreId }] };
    });
  };

  const addCrew = (crewId) => {
    if (!crewId) return;
    setFormData(prev => ({
      ...prev,
      movieCrews: [...prev.movieCrews, { crewId, role: 'Actor', characterName: '' }]
    }));
  };

  const removeCrew = (index) => {
    setFormData(prev => ({
      ...prev,
      movieCrews: prev.movieCrews.filter((_, i) => i !== index)
    }));
  };

  const updateCrew = (index, field, value) => {
    setFormData(prev => {
      const newCrews = [...prev.movieCrews];
      newCrews[index] = { ...newCrews[index], [field]: value };
      return { ...prev, movieCrews: newCrews };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/movies/${editingId}`, { ...formData, id: editingId });
      } else {
        await api.post('/movies', formData);
      }
      setIsDrawerOpen(false);
      fetchData();
    } catch (err) {
      alert("Error saving movie!");
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/movies/${deleteId}`);
      fetchData();
    } catch (err) {
      alert("Error deleting movie!");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* AI Recommendations Section */}
      {recommendedMovies.length > 0 && (
        <div className="ui-panel" style={{ background: 'linear-gradient(45deg, #0a0a0a, #1a0505)', border: '1px solid rgba(229, 9, 20, 0.2)' }}>
          <div style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(229, 9, 20, 0.2)', color: 'var(--primary)', borderRadius: '50%' }}>
              <Sparkles size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'white', letterSpacing: '1px' }}>AI RECOMMENDED FOR YOU</h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Based on your watch history and preferences</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', padding: '0 2rem 2rem 2rem', overflowX: 'auto' }}>
            {recommendedMovies.map(m => (
              <div key={m.id} style={{ minWidth: '200px', background: '#080808', border: '1px solid #222', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ height: '120px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {m.posterUrl ? (
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://upload.wikimedia.org/wikipedia/vi/2/21/Oppenheimer_%E2%80%93_Vietnam_poster.jpg";
                      }}
                    />
                  ) : (
                    <Film size={40} color="#333" />
                  )}
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>{m.imdbScore} IMDB</span>
                    <button
                      onClick={() => openEdit(m)}
                      style={{ fontSize: '0.65rem', background: 'transparent', border: '1px solid #444', color: '#888', padding: '0.1rem 0.4rem', cursor: 'pointer' }}
                    >
                      VIEW
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ui-panel">
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(229, 9, 20, 0.1)', color: 'var(--primary)' }}><Film size={24} /></div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>STUDIO MANAGER</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full Catalog & Relation Management</p>
            </div>
          </div>
          <button className="btn-primary" onClick={openAdd}><Plus size={18} /> ADD NEW MOVIE</button>
        </div>

        {loading ? (
          <div style={{ padding: '5rem', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              {/* ... table content remains same ... */}
              <thead>
                <tr>
                  <th style={{ paddingLeft: '2rem' }}>Poster</th>
                  <th>Movie Info</th>
                  <th>Genres</th>
                  <th>Release</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map(m => (
                  <tr key={m.id}>
                    <td style={{ paddingLeft: '2rem' }}>
                      <img 
                        src={m.posterUrl} 
                        style={{ width: '50px', height: '75px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #222' }}
                        onError={(e) => e.target.src = "https://placehold.co/50x75/111/white?text=No+Img"}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{m.title}</div>
                      <div style={{ fontSize: '0.7rem', color: '#666' }}>ID: #{m.id} • {m.durationMin} min</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {m.movieGenres?.map(mg => (
                          <span key={mg.genreId} style={{ fontSize: '0.65rem', background: '#222', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            {mg.genre?.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{new Date(m.releaseDate).toLocaleDateString()}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{m.basePrice.toLocaleString()}đ</td>
                    <td><span className={`status-badge ${m.status}`}>{m.status}</span></td>
                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="action-btn edit" onClick={() => openEdit(m)}><Pencil size={18} /></button>
                        <button className="action-btn delete" onClick={() => handleDeleteClick(m.id)}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              pageNumber={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          </div>
        )}
      </div>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={editingId ? 'EDIT MOVIE' : 'ADD MOVIE'}>
        <form onSubmit={handleSubmit} className="drawer-form">
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0 }}>Title</label>
              <button 
                type="button" 
                onClick={handleGenerateAI} 
                disabled={generating}
                style={{ 
                  fontSize: '0.7rem', 
                  background: 'rgba(229, 9, 20, 0.1)', 
                  color: 'var(--primary)', 
                  border: '1px solid var(--primary)', 
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                {generating ? <div className="spinner" style={{ width: '12px', height: '12px' }}></div> : <Sparkles size={12} />}
                {generating ? 'GENERATING...' : 'AI GENERATE'}
              </button>
            </div>
            <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Genres</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {Array.isArray(allGenres) && allGenres.map(g => {
                const genres = Array.isArray(formData.movieGenres) ? formData.movieGenres : [];
                const isSelected = genres.some(mg => mg.genreId === g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGenre(g.id)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.75rem',
                      background: isSelected ? 'var(--primary)' : '#111',
                      border: '1px solid #333',
                      color: isSelected ? 'white' : '#888',
                      cursor: 'pointer'
                    }}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Duration (min)</label>
              <input required type="number" value={formData.durationMin} onChange={e => setFormData({ ...formData, durationMin: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Base Price</label>
              <input required type="number" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })} />
            </div>
          </div>

          <div className="form-group">
            <label>Crew & Cast</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {Array.isArray(formData.movieCrews) && formData.movieCrews.map((mc, idx) => {
                const person = Array.isArray(allCrew) ? allCrew.find(p => p.id === mc.crewId) : null;
                return (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#080808', padding: '0.5rem', border: '1px solid #222' }}>
                    <div style={{ flex: 1, fontSize: '0.85rem' }}>{person?.fullName}</div>
                    <select value={mc.role} onChange={e => updateCrew(idx, 'role', e.target.value)} style={{ width: '100px', fontSize: '0.75rem' }}>
                      <option value="Actor">Actor</option>
                      <option value="Director">Director</option>
                      <option value="Writer">Writer</option>
                    </select>
                    <input
                      placeholder="Character"
                      value={mc.characterName || ''}
                      onChange={e => updateCrew(idx, 'characterName', e.target.value)}
                      style={{ flex: 1, fontSize: '0.75rem', height: '30px' }}
                    />
                    <button type="button" onClick={() => removeCrew(idx)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none' }}><X size={16} /></button>
                  </div>
                );
              })}
              <select
                onChange={(e) => { addCrew(Number(e.target.value)); e.target.value = ""; }}
                style={{ marginTop: '0.5rem' }}
              >
                <option value="">+ Add Crew/Member</option>
                {Array.isArray(allCrew) && allCrew.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Synopsis</label>
            <textarea rows="4" value={formData.synopsis} onChange={e => setFormData({ ...formData, synopsis: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Poster URL</label>
            <input value={formData.posterUrl} onChange={e => setFormData({ ...formData, posterUrl: e.target.value })} placeholder="https://..." />
          </div>

          <div className="form-group">
            <label>Backdrop URL</label>
            <input value={formData.backdropUrl} onChange={e => setFormData({ ...formData, backdropUrl: e.target.value })} placeholder="https://..." />
          </div>

          <div className="form-group">
            <label>Trailer URL (YouTube)</label>
            <input value={formData.trailerUrl} onChange={e => setFormData({ ...formData, trailerUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '2rem' }}>
            {editingId ? 'UPDATE MOVIE' : 'SAVE TO CATALOG'}
          </button>
        </form>
      </Drawer>

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="DELETE MOVIE?" message="This action is permanent." />
    </div>
  );
}
