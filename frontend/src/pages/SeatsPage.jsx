import { useState, useEffect } from 'react';
import api from '../services/api';
import { Pencil, Trash2, Plus, Armchair } from 'lucide-react';
import Drawer from '../components/Drawer';
import ConfirmDialog from '../components/ConfirmDialog';

export default function SeatsPage() {
  const [seats, setSeats] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ rowSymbol: '', columnNumber: 1, seatType: 'Standard', roomId: '' });
  const [editingId, setEditingId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [seatsRes, roomsRes] = await Promise.all([
        api.get('/seats'),
        api.get('/rooms')
      ]);
      setSeats(Array.isArray(seatsRes.data.items) ? seatsRes.data.items : Array.isArray(seatsRes.data) ? seatsRes.data : []);
      setRooms(Array.isArray(roomsRes.data.items) ? roomsRes.data.items : Array.isArray(roomsRes.data) ? roomsRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ rowSymbol: 'A', columnNumber: 1, seatType: 'Standard', roomId: rooms[0]?.id || '' });
    setIsDrawerOpen(true);
  };

  const openEdit = (seat) => {
    setEditingId(seat.id);
    setFormData({ 
      rowSymbol: seat.rowSymbol, 
      columnNumber: seat.columnNumber, 
      seatType: seat.seatType || 'Standard', 
      roomId: seat.roomId 
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, id: editingId || 0 };
      if (editingId) {
        await api.put(`/seats/${editingId}`, payload);
      } else {
        await api.post('/seats', formData);
      }
      setIsDrawerOpen(false);
      fetchData();
    } catch (err) {
      alert("Error saving seat!");
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/seats/${deleteId}`);
      fetchData();
    } catch (err) {
      alert("Error deleting seat!");
    }
  };

  const getRoomName = (roomId) => {
    if (!Array.isArray(rooms)) return `Room #${roomId}`;
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : `Room #${roomId}`;
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
              <Armchair size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Prata' }}>SEATING INVENTORY</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage seat maps and luxury classifications</p>
            </div>
          </div>
          <button className="btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Plus size={18} /> ADD NEW SEAT
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
                  <th>Position</th>
                  <th>Type</th>
                  <th>Auditorium</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(seats) && seats.map(s => (
                  <tr key={s.id}>
                    <td style={{ paddingLeft: '2rem', color: '#444' }}>#{s.id}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'white', fontSize: '1.1rem' }}>{s.rowSymbol}{s.columnNumber}</div>
                    </td>
                    <td>
                      <span style={{ 
                        color: s.seatType === 'VIP' ? 'var(--accent)' : s.seatType === 'Sweetbox' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {s.seatType}
                      </span>
                    </td>
                    <td>{getRoomName(s.roomId)}</td>
                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="action-btn edit" onClick={() => openEdit(s)} style={{ color: 'var(--text-secondary)' }}>
                          <Pencil size={18} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDeleteClick(s.id)} style={{ color: 'var(--text-secondary)' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {seats.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '5rem', color: '#555' }}>No seats found. Use the "Add" button to create one.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title={editingId ? 'EDIT SEAT' : 'ADD SEAT'}
      >
        <form onSubmit={handleSubmit} className="drawer-form">
          <div className="form-group">
            <label>Auditorium</label>
            <select required value={formData.roomId} onChange={e => setFormData({...formData, roomId: Number(e.target.value)})}>
              <option value="">Select a Room</option>
              {Array.isArray(rooms) && rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Row Symbol</label>
              <input required value={formData.rowSymbol} onChange={e => setFormData({...formData, rowSymbol: e.target.value.toUpperCase()})} placeholder="e.g. A" maxLength="2" />
            </div>
            <div className="form-group">
              <label>Column Number</label>
              <input required type="number" value={formData.columnNumber} onChange={e => setFormData({...formData, columnNumber: Number(e.target.value)})} min="1" />
            </div>
          </div>
          <div className="form-group">
            <label>Seat Type</label>
            <select value={formData.seatType} onChange={e => setFormData({...formData, seatType: e.target.value})}>
              <option value="Standard">Standard</option>
              <option value="VIP">VIP</option>
              <option value="Sweetbox">Sweetbox (Double)</option>
              <option value="Accessible">Accessible</option>
            </select>
          </div>
          
          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
              {editingId ? 'UPDATE SEAT' : 'SAVE SEAT'}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="REMOVE SEAT?"
        message="Are you sure you want to remove this seat capture? This will affect existing showtime bookings if any."
      />
    </div>
  );
}
