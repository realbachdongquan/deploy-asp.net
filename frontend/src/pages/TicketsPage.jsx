import { useState, useEffect } from 'react';
import api from '../services/api';
import { Trash2, Ticket as TicketIcon, Search, Filter, Eye } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Drawer from '../components/Drawer';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const openView = (ticket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/tickets/${deleteId}`);
      fetchTickets();
    } catch (err) {
      alert("Error deleting ticket!");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="ui-panel">
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(255, 195, 0, 0.1)', color: 'var(--accent)' }}><TicketIcon size={24} /></div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>TICKET REVENUE</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Audit and manage all booking records</p>
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
                  <th style={{ paddingLeft: '2rem' }}>Booking Code</th>
                  <th>Movie</th>
                  <th>Customer</th>
                  <th>Seats</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td style={{ paddingLeft: '2rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.1em' }}>{t.bookingCode}</div>
                      <div style={{ fontSize: '0.7rem', color: '#444' }}>{new Date(t.createdAt).toLocaleString()}</div>
                    </td>
                    <td><div style={{ fontSize: '0.9rem', color: 'white' }}>{t.showtime?.movie?.title}</div></td>
                    <td><div style={{ fontSize: '0.85rem' }}>{t.user?.fullName}</div></td>
                    <td>
                        <div style={{ display: 'flex', gap: '0.2rem', overflowX: 'hidden' }}>
                            {t.ticketSeats?.map(ts => (
                                <span key={ts.id} style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>{ts.seat?.rowSymbol}{ts.seat?.columnNumber}</span>
                            ))}
                        </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'white' }}>{t.totalPrice?.toLocaleString()}đ</td>
                    <td><span className={`status-badge ${t.paymentStatus === 'Paid' ? 'NowPlaying' : 'ComingSoon'}`}>{t.paymentStatus}</span></td>
                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="action-btn" onClick={() => openView(t)} title="View Details"><Eye size={18} /></button>
                        <button className="action-btn delete" onClick={() => handleDeleteClick(t.id)}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="TICKET DETAILS">
        {selectedTicket && (
          <div style={{ padding: '0 1rem' }}>
            <div style={{ padding: '1.5rem', background: '#080808', border: '1px solid #222', marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>BOOKING CODE</div>
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--primary)', letterSpacing: '0.2em' }}>{selectedTicket.bookingCode}</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
               <div>
                  <label style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>Movie</label>
                  <p style={{ margin: '0.25rem 0', fontWeight: 600 }}>{selectedTicket.showtime?.movie?.title}</p>
               </div>
               <div>
                  <label style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>Customer</label>
                  <p style={{ margin: '0.25rem 0', fontWeight: 600 }}>{selectedTicket.user?.fullName}</p>
               </div>
               <div>
                  <label style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>Cinema & Room</label>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>{selectedTicket.showtime?.room?.name}</p>
               </div>
               <div>
                  <label style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>Time</label>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>{new Date(selectedTicket.showtime?.startTime).toLocaleString()}</p>
               </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
               <label style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>Selected Seats</label>
               <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedTicket.ticketSeats?.map(ts => (
                      <div key={ts.id} style={{ padding: '0.5rem 1rem', background: '#111', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: '0.9rem' }}>
                        {ts.seat?.rowSymbol}{ts.seat?.columnNumber}
                      </div>
                  ))}
               </div>
            </div>

            <div style={{ marginTop: '2rem', borderTop: '1px solid #222', paddingTop: '1.5rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 400 }}>TOTAL PAID</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{selectedTicket.totalPrice?.toLocaleString()}đ</span>
               </div>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="VOID TRANSACTION?" message="This will invalidate the ticket and refund/delete the booking record." />
    </div>
  );
}
