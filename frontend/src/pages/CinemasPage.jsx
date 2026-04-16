import { useState, useEffect } from 'react';
import api from '../services/api';
import { Pencil, Trash2, Plus, MapPin } from 'lucide-react';
import Drawer from '../components/Drawer';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

export default function CinemasPage() {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', address: '', hotline: '' });
  const [editingId, setEditingId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchCinemas = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/cinemas?page=${page}&pageSize=${pageSize}`);
      setCinemas(res.data.items);
      setTotalCount(res.data.totalCount);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCinemas(); }, [page, pageSize]);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ name: '', address: '', hotline: '' });
    setIsDrawerOpen(true);
  };

  const openEdit = (cinema) => {
    setEditingId(cinema.id);
    setFormData({ name: cinema.name, address: cinema.address || '', hotline: cinema.hotline || '' });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/cinemas/${editingId}`, { ...formData, id: editingId });
      } else {
        await api.post('/cinemas', formData);
      }
      setIsDrawerOpen(false);
      fetchCinemas();
    } catch (err) {
      alert("Error saving cinema!");
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/cinemas/${deleteId}`);
      fetchCinemas();
    } catch (err) {
      alert("Error deleting cinema!");
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
            <div style={{ padding: '0.75rem', background: 'rgba(255, 195, 0, 0.1)', color: 'var(--accent)' }}>
              <MapPin size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Prata' }}>THEATER NETWORK</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage locations and operational statuses</p>
            </div>
          </div>
          <button className="btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Plus size={18} /> ADD NEW CINEMA
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
                  <th>Cinema Name</th>
                  <th>Address</th>
                  <th>Hotline</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cinemas.map(c => (
                  <tr key={c.id}>
                    <td style={{ paddingLeft: '2rem', color: '#444' }}>#{c.id}</td>
                    <td style={{ fontWeight: 600, color: 'white' }}>{c.name}</td>
                    <td style={{ maxWidth: '300px' }}>{c.address}</td>
                    <td>{c.hotline || 'N/A'}</td>
                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="action-btn edit" onClick={() => openEdit(c)} style={{ color: 'var(--text-secondary)' }}>
                          <Pencil size={18} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDeleteClick(c.id)} style={{ color: 'var(--text-secondary)' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cinemas.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '5rem', color: '#555' }}>No cinemas found in the network.</td></tr>}
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
        title={editingId ? 'EDIT CINEMA' : 'ADD CINEMA'}
      >
        <form onSubmit={handleSubmit} className="drawer-form">
          <div className="form-group">
            <label>Cinema Name</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. CGV Vincom Center" />
          </div>
          <div className="form-group">
            <label>Hotline</label>
            <input value={formData.hotline} onChange={e => setFormData({...formData, hotline: e.target.value})} placeholder="e.g. 1900 xxxx" />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea 
              rows="4" 
              required 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
              placeholder="Full street address..."
            />
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
              {editingId ? 'UPDATE CINEMA' : 'SAVE CINEMA'}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="RETRACT LOCATION?"
        message="Are you sure you want to remove this theater from the active network? This cannot be undone."
      />
    </div>
  );
}
