import { useState, useEffect } from 'react';
import api from '../services/api';
import { CreditCard, Search, Filter, Download, ExternalLink } from 'lucide-react';
import Pagination from '../components/Pagination';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payments?page=${page}&pageSize=${pageSize}`);
      setPayments(res.data.items);
      setTotalCount(res.data.totalCount);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, [page, pageSize]);

  const filteredPayments = filterStatus === 'All' 
    ? payments 
    : payments.filter(p => p.status === filterStatus);

  if (loading) return <div style={{ padding: '10rem', textAlign: 'center' }}><div className="spinner"></div></div>;

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
              <CreditCard size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>TRANSACTION LEDGER</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Monitor and audit all financial transactions</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <select 
               className="action-btn" 
               style={{ background: '#000', border: '1px solid #333', color: 'white', padding: '0.5rem 1rem' }}
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value)}
             >
               <option value="All">All Statuses</option>
               <option value="Success">Success</option>
               <option value="Pending">Pending</option>
               <option value="Failed">Failed</option>
             </select>
             <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Download size={16} /> EXPORT CSV
             </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '2rem' }}>TXID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Provider</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Ticket</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => (
                <tr key={p.id}>
                  <td style={{ paddingLeft: '2rem' }}><code style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>{p.transactionId || `PAY-${p.id}`}</code></td>
                  <td>
                    <div style={{ color: 'white', fontWeight: 600 }}>{p.ticket?.user?.fullName}</div>
                    <div style={{ fontSize: '0.7rem', color: '#555' }}>{p.ticket?.user?.email}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'white' }}>{p.amount.toLocaleString()}đ</td>
                  <td><span style={{ fontSize: '0.8rem', background: '#222', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{p.provider}</span></td>
                  <td style={{ fontSize: '0.85rem', color: '#888' }}>{new Date(p.paidAt || p.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${p.status.toLowerCase()}`} style={{ 
                        padding: '0.25rem 0.75rem', 
                        fontSize: '0.7rem', 
                        fontWeight: 800,
                        backgroundColor: p.status === 'Success' ? 'rgba(0, 255, 100, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                        color: p.status === 'Success' ? '#00ff64' : '#ff3c3c'
                    }}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                    <button className="action-btn" title="View Ticket Detail">
                      <ExternalLink size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPayments.length === 0 && (
            <div style={{ padding: '5rem', textAlign: 'center', color: '#444' }}>No transactions match your filters.</div>
          )}
          
          <Pagination 
            pageNumber={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        </div>
      </div>
    </div>
  );
}
