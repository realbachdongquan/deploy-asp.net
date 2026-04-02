import { useState, useEffect } from 'react';
import api from '../services/api';
import { Pencil, Trash2, Plus, Popcorn } from 'lucide-react';
import Drawer from '../components/Drawer';
import ConfirmDialog from '../components/ConfirmDialog';

export default function ConcessionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', description: '', price: 50000, category: 'Popcorn', imageUrl: '' });
  const [editingId, setEditingId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchItems = async () => {
    try {
      const res = await api.get('/concessions');
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', price: 50000, category: 'Popcorn', imageUrl: '' });
    setIsDrawerOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setFormData({ name: item.name, description: item.description || '', price: item.price, category: item.category || 'Popcorn', imageUrl: item.imageUrl || '' });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/concessions/${editingId}`, { ...formData, id: editingId });
      } else {
        await api.post('/concessions', formData);
      }
      setIsDrawerOpen(false);
      fetchItems();
    } catch (err) {
      alert("Error saving concession!");
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/concessions/${deleteId}`);
      fetchItems();
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
              <Popcorn size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>CONCESSION MANAGER</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage popcorn, drinks and snack bundles</p>
            </div>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={18} /> ADD ITEM
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '5rem', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '2rem' }}>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id}>
                    <td style={{ paddingLeft: '2rem' }}>
                      <div style={{ fontWeight: 600, color: 'white' }}>{i.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#555' }}>{i.description}</div>
                    </td>
                    <td><span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: '#222', color: '#888' }}>{i.category}</span></td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{i.price.toLocaleString()}đ</td>
                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button className="action-btn edit" onClick={() => openEdit(i)}><Pencil size={18} /></button>
                          <button className="action-btn delete" onClick={() => handleDeleteClick(i.id)}><Trash2 size={18} /></button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={editingId ? 'EDIT ITEM' : 'ADD ITEM'}>
        <form onSubmit={handleSubmit} className="drawer-form">
          <div className="form-group">
            <label>Item Name</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Large Popcorn" />
          </div>
          <div className="form-group">
            <label>Price</label>
            <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option value="Popcorn">Popcorn</option>
              <option value="Drink">Drink</option>
              <option value="Snack">Snack</option>
              <option value="Combo">Combo</option>
            </select>
          </div>
          <div className="form-group">
              <label>Image URL</label>
              <input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 'auto' }}>{editingId ? 'UPDATE ITEM' : 'SAVE ITEM'}</button>
        </form>
      </Drawer>

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="DELETE ITEM?" />
    </div>
  );
}
