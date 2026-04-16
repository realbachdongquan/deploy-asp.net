import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({ pageNumber, totalPages, totalCount, pageSize, onPageChange, onPageSizeChange }) {
  if (totalPages <= 0) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, pageNumber - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`pagination-btn ${i === pageNumber ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Showing <b>{Math.min((pageNumber - 1) * pageSize + 1, totalCount)}</b> to <b>{Math.min(pageNumber * pageSize, totalCount)}</b> of <b>{totalCount}</b> entries
      </div>

      <div className="pagination-controls">
        <div className="pageSize-selector">
          <span>Show</span>
          <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="pagination-buttons">
          <button 
            disabled={pageNumber === 1} 
            onClick={() => onPageChange(1)}
            className="pagination-nav"
          >
            <ChevronsLeft size={16} />
          </button>
          <button 
            disabled={pageNumber === 1} 
            onClick={() => onPageChange(pageNumber - 1)}
            className="pagination-nav"
          >
            <ChevronLeft size={16} />
          </button>
          
          {renderPageNumbers()}

          <button 
            disabled={pageNumber === totalPages} 
            onClick={() => onPageChange(pageNumber + 1)}
            className="pagination-nav"
          >
            <ChevronRight size={16} />
          </button>
          <button 
            disabled={pageNumber === totalPages} 
            onClick={() => onPageChange(totalPages)}
            className="pagination-nav"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
