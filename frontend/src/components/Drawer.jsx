import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Drawer({ isOpen, onClose, title, children }) {
  // Ngăn cuộn trang khi drawer mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="drawer-overlay" 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out'
        }}
      />
      
      {/* Drawer Panel */}
      <div 
        className="drawer-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(500px, 100%)',
          backgroundColor: 'var(--panel-bg)',
          borderLeft: '2px solid var(--primary)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ 
          padding: '1.5rem', 
          borderBottom: '1px solid #222', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#0a0a0a'
        }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--primary)' }}>{title}</h2>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'transparent', 
              color: 'var(--text-secondary)',
              border: 'none',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>
        
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </>
  );
}
