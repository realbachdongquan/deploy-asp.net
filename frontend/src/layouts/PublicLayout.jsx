import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function PublicLayout() {
  return (
    <div>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer style={{ 
        padding: '4rem 5%', 
        background: '#050505', 
        borderTop: '1px solid #111', 
        textAlign: 'center',
        color: '#444',
        fontSize: '0.8rem'
      }}>
        <p>© 2026 DWAN CINEMA SYSTEM. POWERED BY ANTIGRAVITY AI.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
          <span>PRIVACY POLICY</span>
          <span>TERMS OF SERVICE</span>
          <span>CONTACT US</span>
        </div>
      </footer>
    </div>
  );
}
