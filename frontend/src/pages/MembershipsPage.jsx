import { useState, useEffect } from 'react';
import api from '../services/api';
import { Pencil, Trash2, Award, Gem, User } from 'lucide-react';
import Drawer from '../components/Drawer';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ userId: 0, tierName: 'Standard', accumulatedPoints: 0, expireDate: '' });
  const [editingId, setEditingId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/memberships?page=${page}&pageSize=${pageSize}`);
      setMemberships(res.data.items);
      setTotalCount(res.data.totalCount);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMemberships(); }, [page, pageSize]);

  const openEdit = (m) => {
    setEditingId(m.id);
    setFormData({ 
      userId: m.userId, 
      tierName: m.tierName, 
      accumulatedPoints: m.accumulatedPoints,
      expireDate: m.expireDate ? m.expireDate.split('T')[0] : ''
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/memberships/${editingId}`, { ...formData, id: editingId });
      setIsDrawerOpen(false);
      fetchMemberships();
    } catch (err) {
      alert("Error saving membership!");
    }
  };

  const getTierIcon = (tier) => {
    if (tier === 'Diamond') return <Gem size={18} color="var(--primary)" />;
    if (tier === 'Gold') return <Award size={18} color="var(--accent)" />;
    return <User size={18} color="#666" />;
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
              <Award size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>MEMBERSHIP DIRECTORY</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Loyalty tiers and points rewards</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '5rem', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '2rem' }}>User</th>
                  <th>Tier</th>
                  <th>Points</th>
                  <th>Expiration</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map(m => (
                  <tr key={m.id}>
                    <td style={{ paddingLeft: '2rem' }}>{m.userEmail}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getTierIcon(m.tierName)}
                        <span style={{ fontWeight: m.tierName !== 'Standard' ? 600 : 400 }}>{m.tierName}</span>
                      </div>
                    </td>
                    <td>{m.accumulatedPoints.toLocaleString()}</td>
                    <td>{m.expireDate ? new Date(m.expireDate).toLocaleDateString() : 'Lifetime'}</td>
                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                        <button className="action-btn edit" onClick={() => openEdit(m)}><Pencil size={18} /></button>
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

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="EDIT MEMBERSHIP">
        <form onSubmit={handleSubmit} className="drawer-form">
          <div className="form-group">
            <label>Loyalty Tier</label>
            <select value={formData.tierName} onChange={e => setFormData({...formData, tierName: e.target.value})}>
              <option value="Standard">Standard</option>
              <option value="Gold">Gold</option>
              <option value="Diamond">Diamond</option>
            </select>
          </div>
          <div className="form-group">
            <label>Accumulated Points</label>
            <input type="number" value={formData.accumulatedPoints} onChange={e => setFormData({...formData, accumulatedPoints: Number(e.target.value)})} />
          </div>
          <div className="form-group">
            <label>Expiration Date</label>
            <input type="date" value={formData.expireDate} onChange={e => setFormData({...formData, expireDate: e.target.value})} />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 'auto' }}>UPDATE MEMBER</button>
        </form>
      </Drawer>
    </div>
  );
}
