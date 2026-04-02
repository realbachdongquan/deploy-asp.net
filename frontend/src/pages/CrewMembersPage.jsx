import { useState, useEffect } from 'react';
import api from '../services/api';
import { Pencil, Trash2, Plus, Users } from 'lucide-react';
import Drawer from '../components/Drawer';
import ConfirmDialog from '../components/ConfirmDialog';

export default function CrewMembersPage() {
  const [crew, setCrew] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ fullName: '', role: 'Actor', bio: '', avatarUrl: '' });
  const [editingId, setEditingId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchCrew = async () => {
    try {
      const res = await api.get('/crewmembers');
      setCrew(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCrew(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ fullName: '', role: 'Actor', bio: '', avatarUrl: '' });
    setIsDrawerOpen(true);
  };

  const openEdit = (member) => {
    setEditingId(member.id);
    setFormData({ 
      fullName: member.fullName, 
      role: member.role || 'Actor', 
      bio: member.bio || '', 
      avatarUrl: member.avatarUrl || '' 
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/crewmembers/${editingId}`, { ...formData, id: editingId });
      } else {
        await api.post('/crewmembers', formData);
      }
      setIsDrawerOpen(false);
      fetchCrew();
    } catch (err) {
      alert("Error saving crew member!");
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/crewmembers/${deleteId}`);
      fetchCrew();
    } catch (err) {
      alert("Error deleting!");
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
              <Users size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>CREW MANAGER</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Talent database for directors and actors</p>
            </div>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={18} /> ADD NEW CREW
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '5rem', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '2rem' }}>Name</th>
                  <th>Role</th>
                  <th style={{ width: '40%' }}>Bio</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {crew.map(c => (
                  <tr key={c.id}>
                    <td style={{ paddingLeft: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {c.avatarUrl && <img src={c.avatarUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />}
                        <div style={{ fontWeight: 600, color: 'white' }}>{c.fullName}</div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: '#333', color: '#ccc' }}>{c.role}</span></td>
                    <td style={{ color: '#666', fontSize: '0.85rem' }}>{c.bio?.substring(0, 100)}...</td>
                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="action-btn edit" onClick={() => openEdit(c)}><Pencil size={18} /></button>
                        <button className="action-btn delete" onClick={() => handleDeleteClick(c.id)}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={editingId ? 'EDIT CREW' : 'ADD CREW'}>
        <form onSubmit={handleSubmit} className="drawer-form">
          <div className="form-group">
            <label>Full Name</label>
            <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="e.g. Christopher Nolan" />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="Actor">Actor</option>
              <option value="Director">Director</option>
              <option value="Producer">Producer</option>
              <option value="Writer">Writer</option>
            </select>
          </div>
          <div className="form-group">
            <label>Avatar URL</label>
            <input value={formData.avatarUrl} onChange={e => setFormData({...formData, avatarUrl: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea rows="5" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '2rem' }}>{editingId ? 'UPDATE' : 'SAVE'}</button>
        </form>
      </Drawer>

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="DELETE CREW?" />
    </div>
  );
}
