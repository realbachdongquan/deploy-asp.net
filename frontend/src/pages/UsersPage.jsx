import { useState, useEffect } from 'react';
import api from '../services/api';
import { Pencil, Trash2, UserCog, ShieldCheck, Mail, Calendar } from 'lucide-react';
import Drawer from '../components/Drawer';
import ConfirmDialog from '../components/ConfirmDialog';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('Customer');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openEdit = (user) => {
    setEditingUser(user);
    setNewRole(user.role);
    setIsDrawerOpen(true);
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editingUser.id}/role`, `"${newRole}"`, {
        headers: { 'Content-Type': 'application/json' }
      });
      setIsDrawerOpen(false);
      fetchUsers();
    } catch (err) {
      alert("Error updating role!");
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/users/${deleteId}`);
      fetchUsers();
    } catch (err) {
      alert("Error deleting user!");
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
              <UserCog size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>USER DIRECTORY</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage accounts, permissions and security roles</p>
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
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ paddingLeft: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          background: 'rgba(255,255,255,0.05)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          border: '1px solid #333'
                        }}>
                          <Mail size={18} color="#666" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'white' }}>{u.fullName || 'Unspecified Name'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck size={14} color={u.role === 'Admin' ? 'var(--primary)' : '#888'} />
                        <span style={{ 
                          fontSize: '0.8rem', 
                          color: u.role === 'Admin' ? 'var(--primary)' : 'white',
                          fontWeight: u.role === 'Admin' ? 700 : 400
                        }}>{u.role}</span>
                      </div>
                    </td>
                    <td><span className={`status-badge ${u.isVerified ? 'verified' : 'pending'}`}>{u.isVerified ? 'VERIFIED' : 'PENDING'}</span></td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        <Calendar size={12} style={{ marginRight: '4px' }} />
                        {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="action-btn edit" onClick={() => openEdit(u)}><Pencil size={18} /></button>
                        <button className="action-btn delete" onClick={() => handleDeleteClick(u.id)}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="UPDATE USER ROLE">
        <form onSubmit={handleUpdateRole} className="drawer-form">
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', border: '1px solid #222', marginBottom: '2rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Email</p>
            <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600 }}>{editingUser?.email}</p>
          </div>
          <div className="form-group">
            <label>Permission Role</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value)}>
              <option value="Customer">Customer</option>
              <option value="CinemaManager">Cinema Manager</option>
              <option value="Admin">System Administrator</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 'auto' }}>SAVE CHANGES</button>
        </form>
      </Drawer>

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="TERMINATE ACCOUNT?" message="Removing a user is permanent and will delete all associated data." />
    </div>
  );
}
