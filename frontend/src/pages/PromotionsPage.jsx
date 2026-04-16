import { useState, useEffect } from 'react';
import api from '../services/api';
import { Pencil, Trash2, Plus, Sparkles, Calendar } from 'lucide-react';
import Drawer from '../components/Drawer';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

export default function PromotionsPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ 
    promoCode: '', description: '', discountPercentage: 10, maxDiscountAmount: 50000,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: 100
  });
  const [editingId, setEditingId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/promotions?page=${page}&pageSize=${pageSize}`);
      setPromos(res.data.items);
      setTotalCount(res.data.totalCount);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromos(); }, [page, pageSize]);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ 
      promoCode: '', description: '', discountPercentage: 10, maxDiscountAmount: 50000,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: 100
    });
    setIsDrawerOpen(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setFormData({ 
      promoCode: p.promoCode, 
      description: p.description || '', 
      discountPercentage: p.discountPercentage, 
      maxDiscountAmount: p.maxDiscountAmount,
      startDate: p.startDate.split('T')[0],
      endDate: p.endDate.split('T')[0],
      usageLimit: p.usageLimit
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/promotions/${editingId}`, { ...formData, id: editingId });
      } else {
        await api.post('/promotions', formData);
      }
      setIsDrawerOpen(false);
      fetchPromos();
    } catch (err) {
      alert("Error saving promotion!");
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/promotions/${deleteId}`);
      fetchPromos();
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
              <Sparkles size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>PROMOTION CENTER</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Marketing tools and loyalty discounts</p>
            </div>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={18} /> CREATE PROMO
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '5rem', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '2rem' }}>Code</th>
                  <th>Discount</th>
                  <th>Limit</th>
                  <th>Used</th>
                  <th>Validity</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map(p => {
                  const isExpired = new Date(p.endDate) < new Date();
                  return (
                    <tr key={p.id}>
                      <td style={{ paddingLeft: '2rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px' }}>{p.promoCode}</div>
                        <div style={{ fontSize: '0.7rem', color: '#555' }}>{p.description}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'white' }}>{p.discountPercentage}% OFF</div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>Max {p.maxDiscountAmount.toLocaleString()}đ</div>
                      </td>
                      <td>{p.usageLimit}</td>
                      <td>{p.currentUsage}</td>
                      <td>
                        <div style={{ fontSize: '0.8rem', color: isExpired ? '#e50914' : '#00ff88' }}>
                          <Calendar size={12} style={{ marginRight: '4px' }} />
                          {new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button className="action-btn edit" onClick={() => openEdit(p)}><Pencil size={18} /></button>
                          <button className="action-btn delete" onClick={() => handleDeleteClick(p.id)}><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={editingId ? 'EDIT PROM' : 'CREATE PROMO'}>
        <form onSubmit={handleSubmit} className="drawer-form">
          <div className="form-group">
            <label>Promo Code</label>
            <input required style={{ fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }} value={formData.promoCode} onChange={e => setFormData({...formData, promoCode: e.target.value.toUpperCase()})} placeholder="e.g. SUMMER2024" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Discount %</label>
              <input required type="number" value={formData.discountPercentage} onChange={e => setFormData({...formData, discountPercentage: Number(e.target.value)})} />
            </div>
            <div className="form-group">
              <label>Max Amount</label>
              <input required type="number" value={formData.maxDiscountAmount} onChange={e => setFormData({...formData, maxDiscountAmount: Number(e.target.value)})} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Start Date</label>
              <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Usage Limit</label>
            <input required type="number" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: Number(e.target.value)})} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 'auto', padding: '1rem' }}>{editingId ? 'UPDATE PROMO' : 'LAUNCH PROMO'}</button>
        </form>
      </Drawer>

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="DELETE PROMO?" />
    </div>
  );
}
