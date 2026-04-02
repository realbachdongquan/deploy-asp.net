import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1rem'
    }}>
      {/* Overlay */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease-out'
        }}
      />
      
      {/* Dialog Box */}
      <div className="ui-panel" style={{
        position: 'relative',
        width: '100%',
        maxWidth: '450px',
        padding: '2.5rem',
        border: '2px solid var(--primary)',
        boxShadow: '10px 10px 0px var(--primary)',
        animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        backgroundColor: '#111'
      }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ color: 'var(--primary)', flexShrink: 0 }}>
            <AlertTriangle size={48} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'white' }}>{title}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1.1rem' }}>{message}</p>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '1rem', 
          marginTop: '2.5rem' 
        }}>
          <button 
            onClick={onClose}
            style={{ 
              background: 'transparent', 
              color: 'var(--text-secondary)',
              border: '1px solid #333'
            }}
          >
            CANCEL
          </button>
          <button 
            className="btn-primary"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{ 
              padding: '0.75rem 2rem',
              fontSize: '0.9rem'
            }}
          >
            CONFIRM DELETE
          </button>
        </div>
      </div>
    </div>
  );
}
