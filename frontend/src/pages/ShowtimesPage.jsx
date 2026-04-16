import { useState, useEffect } from 'react';
import api from '../services/api';
import { Pencil, Trash2, Plus, Calendar, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Drawer from '../components/Drawer';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

export default function ShowtimesPage() {
  const navigate = useNavigate();
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ movieId: '', roomId: '', startTime: '', status: true });
  const [editingId, setEditingId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stRes, mRes, rRes] = await Promise.all([
        api.get(`/showtimes?page=${page}&pageSize=${pageSize}`),
        api.get('/movies'),
        api.get('/rooms')
      ]);
      setShowtimes(stRes.data.items);
      setTotalCount(stRes.data.totalCount);
      setTotalPages(stRes.data.totalPages);
      setMovies(mRes.data.items || mRes.data);
      setRooms(rRes.data.items || rRes.data);
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
      movieId: movies[0]?.id || '', 
      roomId: rooms[0]?.id || '', 
      startTime: new Date().toISOString().substring(0, 16),
      status: true 
    });
    setIsDrawerOpen(true);
  };

  const openEdit = (st) => {
    setEditingId(st.id);
    setFormData({ 
      movieId: st.movieId, 
      roomId: st.roomId, 
      startTime: st.startTime.substring(0, 16),
      status: st.status
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, id: editingId || 0 };
      if (editingId) {
        await api.put(`/showtimes/${editingId}`, payload);
      } else {
        await api.post('/showtimes', formData);
      }
      setIsDrawerOpen(false);
      fetchData();
    } catch (err) {
      alert("Error saving showtime!");
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/showtimes/${deleteId}`);
      fetchData();
    } catch (err) {
      alert("Error deleting showtime!");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="ui-panel">
        <div style={{ 
          padding: '1.5rem 2rem', 
          borderBottom: '1px solid #222', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(to right, #111, #080808)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(229, 9, 20, 0.1)', color: 'var(--primary)' }}>
              <Calendar size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Prata' }}>PROGRAM SCHEDULER</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Design the seasonal movie programs and timing</p>
            </div>
          </div>
          <button className="btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Plus size={18} /> NEW SHOWTIME
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '5rem', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '2rem' }}>ID</th>
                  <th>Movie Title</th>
                  <th>Auditorium</th>
                  <th>Time Slot</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {showtimes.map(st => (
                  <tr key={st.id}>
                    <td style={{ paddingLeft: '2rem', color: '#444' }}>#{st.id}</td>
                    <td style={{ fontWeight: 600, color: 'white' }}>
                      {st.movie?.title || movies.find(m => m.id === st.movieId)?.title || `Movie #${st.movieId}`}
                    </td>
                    <td>{st.room?.name || rooms.find(r => r.id === st.roomId)?.name || `Room #${st.roomId}`}</td>
                    <td>
                      <div style={{ color: 'var(--text-primary)' }}>{new Date(st.startTime).toLocaleDateString()}</div>
                      <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem' }}>
                        {new Date(st.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${st.status ? 'NowPlaying' : 'Ended'}`}>
                        {st.status ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button 
                          className="action-btn edit" 
                          onClick={() => navigate(`/booking/${st.id}`)} 
                          style={{ color: 'var(--accent)', background: 'rgba(255, 195, 0, 0.1)', border: '1px solid var(--accent)' }}
                          title="BOOK TICKETS"
                        >
                          <Ticket size={18} />
                        </button>
                        <button className="action-btn edit" onClick={() => openEdit(st)} style={{ color: 'var(--text-secondary)' }}>
                          <Pencil size={18} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDeleteClick(st.id)} style={{ color: 'var(--text-secondary)' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {showtimes.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '5rem', color: '#555' }}>No programs scheduled for this period.</td></tr>}
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

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title={editingId ? 'EDIT SHOWTIME' : 'NEW SHOWTIME'}
      >
        <form onSubmit={handleSubmit} className="drawer-form">
          <div className="form-group">
            <label>Select Movie</label>
            <select required value={formData.movieId} onChange={e => setFormData({...formData, movieId: Number(e.target.value)})}>
              <option value="">Choose a Movie...</option>
              {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Select Auditorium</label>
            <select required value={formData.roomId} onChange={e => setFormData({...formData, roomId: Number(e.target.value)})}>
              <option value="">Choose a Room...</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.roomFormat})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Start Time</label>
            <input required type="datetime-local" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Publication Status</label>
            <select value={formData.status ? 'true' : 'false'} onChange={e => setFormData({...formData, status: e.target.value === 'true'})}>
              <option value="true">Active (Visible to users)</option>
              <option value="false">Private (Draft mode)</option>
            </select>
          </div>
          
          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
              {editingId ? 'UPDATE PROGRAM' : 'SCHEDULE SHOWTIME'}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="CANCEL SHOWTIME?"
        message="This will immediately remove the showtime from all public listings. Existing ticket holders must be notified manually."
      />
    </div>
  );
}
