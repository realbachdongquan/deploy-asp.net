import { useState, useEffect } from 'react';
import api from '../services/api';
import { Trash2, MessageSquare, Star, User } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reviews/all?page=${page}&pageSize=${pageSize}`);
      setReviews(res.data.items);
      setTotalCount(res.data.totalCount);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllReviews(); }, [page, pageSize]);

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/reviews/${deleteId}`);
      fetchAllReviews();
    } catch (err) {
      alert("Error deleting review!");
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
              <MessageSquare size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>REVIEW MODERATION</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage user feedback and filter inappropriate content</p>
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
                  <th>Movie</th>
                  <th>Rating</th>
                  <th style={{ width: '40%' }}>Comment</th>
                  <th>AI Sentiment</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r.id}>
                    <td style={{ paddingLeft: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <User size={14} color="#666" />
                        <span style={{ fontWeight: 600 }}>{r.user?.fullName || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td><span style={{ color: '#888' }}>{r.movie?.title || `ID: ${r.movieId}`}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)' }}>
                        <Star size={14} fill="currentColor" />
                        {r.score}/10
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#666' }}>{r.comment || '(No comment)'}</td>
                    <td>
                      {r.sentiment ? (
                        <span style={{ 
                          fontSize: '0.7rem', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '12px',
                          background: r.sentiment === 'Positive' ? 'rgba(34, 197, 94, 0.1)' : 
                                      r.sentiment === 'Negative' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                          color: r.sentiment === 'Positive' ? '#22c55e' : 
                                 r.sentiment === 'Negative' ? '#ef4444' : '#9ca3af',
                          border: `1px solid ${r.sentiment === 'Positive' ? 'rgba(34, 197, 94, 0.2)' : 
                                                 r.sentiment === 'Negative' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`
                        }}>
                          {r.sentiment.toUpperCase()}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#444' }}>Processing...</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                        <button className="action-btn delete" onClick={() => handleDeleteClick(r.id)}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '5rem', color: '#333' }}>No reviews found for moderation.</td></tr>}
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

      <ConfirmDialog 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="DELETE REVIEW?"
        message="This will permanently remove the user comment from the movie page."
      />
    </div>
  );
}
