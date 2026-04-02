import { useState, useEffect } from 'react';
import api from '../services/api';
import { History, Shield, Calendar, Terminal } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/auditlogs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const getActionColor = (action) => {
    if (action.includes('Delete')) return 'var(--danger)';
    if (action.includes('Create') || action.includes('Add')) return 'var(--accent)';
    if (action.includes('Update')) return 'var(--primary)';
    return 'white';
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
              <History size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>SECURITY AUDIT LOGS</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>System activity tracking and forensic trail</p>
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
                  <th style={{ paddingLeft: '2rem' }}>Timestamp</th>
                  <th>Admin ID</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Target ID</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Origin</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>
                      <div style={{ color: '#888' }}>
                        <Calendar size={12} style={{ marginRight: '4px' }} />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'monospace', color: '#666' }}>#{log.adminUserId}</span></td>
                    <td style={{ fontWeight: 700, fontSize: '0.9rem', color: getActionColor(log.action) }}>{log.action.toUpperCase()}</td>
                    <td style={{ fontWeight: 600 }}>{log.targetTable}</td>
                    <td><span style={{ color: '#444' }}>#{log.targetId}</span></td>
                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', fontSize: '0.75rem', color: '#555' }}>
                        <Terminal size={12} />
                        {log.ipAddress || 'Internal'}
                      </div>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '5rem', color: '#333' }}>No audit trails recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
