import { useState, useEffect } from 'react';
import api from '../services/api';
import { Pencil, Trash2, Plus, Monitor } from 'lucide-react';
import Drawer from '../components/Drawer';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', capacity: 100, cinemaId: '', roomFormat: '2D' });
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
      const [roomsRes, cinemasRes] = await Promise.all([
        api.get(`/rooms?page=${page}&pageSize=${pageSize}`),
        api.get('/cinemas')
      ]);
      setRooms(Array.isArray(roomsRes.data.items) ? roomsRes.data.items : Array.isArray(roomsRes.data) ? roomsRes.data : []);
      setTotalCount(roomsRes.data.totalCount || 0);
      setTotalPages(roomsRes.data.totalPages || 0);
      setCinemas(Array.isArray(cinemasRes.data.items) ? cinemasRes.data.items : Array.isArray(cinemasRes.data) ? cinemasRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, pageSize]);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ name: '', capacity: 100, cinemaId: cinemas[0]?.id || '', roomFormat: '2D' });
    setIsDrawerOpen(true);
  };

  const openEdit = (room) => {
    setEditingId(room.id);
    setFormData({ 
      name: room.name, 
      capacity: room.capacity, 
      cinemaId: room.cinemaId,
      roomFormat: room.roomFormat || '2D'
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, id: editingId || 0 };
      if (editingId) {
        await api.put(`/rooms/${editingId}`, payload);
      } else {
        await api.post('/rooms', formData);
      }
      setIsDrawerOpen(false);
      fetchData();
    } catch (err) {
      alert("Error saving room!");
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/rooms/${deleteId}`);
      fetchData();
    } catch (err) {
      alert("Error deleting room!");
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
            <div style={{ padding: '0.75rem', background: 'rgba(30, 145, 70, 0.1)', color: '#2ecc71' }}>
              <Monitor size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Prata' }}>AUDITORIUM CONTROL</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Configure seating capacities and screen formats</p>
            </div>
          </div>
          <button className="btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Plus size={18} /> ADD NEW ROOM
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
                  <th>Room Name</th>
                  <th>Cinema</th>
                  <th>Capacity</th>
                  <th>Format</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(rooms) && rooms.map(r => (
                  <tr key={r.id}>
                    <td style={{ paddingLeft: '2rem', color: '#444' }}>#{r.id}</td>
                    <td style={{ fontWeight: 600, color: 'white' }}>{r.name}</td>
                    <td>{Array.isArray(cinemas) ? cinemas.find(c => c.id === r.cinemaId)?.name || `Cinema #${r.cinemaId}` : `Cinema #${r.cinemaId}`}</td>
                    <td>{r.capacity} Seats</td>
                    <td><span style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700 }}>{r.roomFormat || '2D'}</span></td>
                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="action-btn edit" onClick={() => openEdit(r)} style={{ color: 'var(--text-secondary)' }}>
                          <Pencil size={18} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDeleteClick(r.id)} style={{ color: 'var(--text-secondary)' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rooms.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '5rem', color: '#555' }}>No auditoriums configured yet.</td></tr>}
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
        title={editingId ? 'EDIT AUDITORIUM' : 'ADD AUDITORIUM'}
      >
        <form onSubmit={handleSubmit} className="drawer-form">
          <div className="form-group">
            <label>Room Name</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Hall 01 - IMAX" />
          </div>
          <div className="form-group">
            <label>Cinema Location</label>
            <select required value={formData.cinemaId} onChange={e => setFormData({...formData, cinemaId: Number(e.target.value)})}>
              <option value="">Select a Cinema</option>
              {Array.isArray(cinemas) && cinemas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Capacity</label>
              <input required type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} />
            </div>
            <div className="form-group">
              <label>Screen Format</label>
              <select value={formData.roomFormat} onChange={e => setFormData({...formData, roomFormat: e.target.value})}>
                <option value="2D">2D Standard</option>
                <option value="3D">3D Cinematic</option>
                <option value="IMAX">IMAX Experience</option>
                <option value="4DX">4DX Motion</option>
                <option value="GoldClass">Gold Class Luxury</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
              {editingId ? 'UPDATE AUDITORIUM' : 'INITIALIZE ROOM'}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="DECOMMISSION ROOM?"
        message="This will remove the room and all associated seat configurations. Proceed with caution."
      />
    </div>
  );
}
