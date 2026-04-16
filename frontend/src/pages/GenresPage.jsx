import { useState, useEffect } from 'react';
import api from '../services/api';
import { Pencil, Trash2, Plus, Tag } from 'lucide-react';
import Drawer from '../components/Drawer';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

export default function GenresPage() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Pagination State (Default 100 for genres)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchGenres = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/genres?page=${page}&pageSize=${pageSize}`);
      setGenres(res.data.items);
      setTotalCount(res.data.totalCount);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGenres(); }, [page, pageSize]);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setIsDrawerOpen(true);
  };

  const openEdit = (genre) => {
    setEditingId(genre.id);
    setFormData({ name: genre.name, description: genre.description || '' });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/genres/${editingId}`, { ...formData, id: editingId });
      } else {
        await api.post('/genres', formData);
      }
      setIsDrawerOpen(false);
      fetchGenres();
    } catch (err) {
      alert("Error saving genre!");
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/genres/${deleteId}`);
      fetchGenres();
    } catch (err) {
      alert("Error deleting genre!");
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
              <Tag size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>GENRE MANAGER</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Organize movies by categories and themes</p>
            </div>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={18} /> ADD NEW GENRE
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
                  <th>Name</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {genres.map(g => (
                  <tr key={g.id}>
                    <td style={{ paddingLeft: '2rem', color: '#444' }}>#{g.id}</td>
                    <td style={{ fontWeight: 600, color: 'white' }}>{g.name}</td>
                    <td style={{ color: '#888', fontSize: '0.9rem' }}>{g.description || 'No description provided'}</td>
                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="action-btn edit" onClick={() => openEdit(g)}><Pencil size={18} /></button>
                        <button className="action-btn delete" onClick={() => handleDeleteClick(g.id)}><Trash2 size={18} /></button>
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

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={editingId ? 'EDIT GENRE' : 'ADD GENRE'}>
        <form onSubmit={handleSubmit} className="drawer-form">
          <div className="form-group">
            <label>Name</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Science Fiction" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows="5" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '2rem' }}>{editingId ? 'UPDATE' : 'SAVE'}</button>
        </form>
      </Drawer>

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="DELETE GENRE?" />
    </div>
  );
}
