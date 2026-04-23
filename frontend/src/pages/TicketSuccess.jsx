import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, Download, Home, Calendar, MapPin, Monitor, Ticket as TicketIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function TicketSuccess() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const ticketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await api.get(`/tickets/${ticketId}`);
        setTicket(res.data);
      } catch (err) {
        console.error("Error fetching ticket:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  const downloadPDF = async () => {
    if (!ticketRef.current) return;
    setIsGenerating(true);
    try {
      const element = ticketRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#111',
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a5'); // Landscape A5
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Ticket_${ticket.bookingCode}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Failed to generate PDF. Please try printing instead.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div className="spinner"></div></div>;
  if (!ticket) return <div style={{ textAlign: 'center', padding: '5rem' }}><h2>Ticket not found</h2></div>;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket.bookingCode}`;

  return (
    <div style={{ minHeight: '100vh', background: '#000', padding: '4rem 5%', color: 'white' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <CheckCircle size={64} color="var(--primary)" style={{ marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'Prata' }}>Đặt vé thành công!</h1>
        <p style={{ color: '#666' }}>Vé điện tử của bạn đã sẵn sàng. Vui lòng xuất trình mã QR này tại quầy soát vé.</p>
      </div>

      <div 
        id="digital-ticket"
        ref={ticketRef}
        style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', background: '#111', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid #222' }}
      >
        {/* Left Side: Movie Info */}
        <div style={{ flex: 1.5, padding: '3rem', borderRight: '2px dashed #222', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '30px', height: '30px', background: '#000', borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', width: '30px', height: '30px', background: '#000', borderRadius: '50%' }}></div>
          
          <div style={{ display: 'flex', gap: '2rem' }}>
            <img src={ticket.showtime?.movie?.posterUrl} style={{ width: '120px', borderRadius: '12px' }} alt="poster" crossOrigin="anonymous" />
            <div>
              <h2 style={{ fontSize: '1.8rem', margin: '0 0 1.5rem 0', fontFamily: 'Prata' }}>{ticket.showtime?.movie?.title}</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#888' }}>
                  <Calendar size={18} />
                  <span>{new Date(ticket.showtime?.startTime).toLocaleDateString('vi-VN')} • {new Date(ticket.showtime?.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#888' }}>
                  <MapPin size={18} />
                  <span>{ticket.showtime?.room?.cinema?.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#888' }}>
                  <Monitor size={18} />
                  <span>{ticket.showtime?.room?.name}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#444', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>GHẾ</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
                {ticket.ticketSeats?.map(ts => ts.seat?.rowSymbol + ts.seat?.columnNumber).join(', ')}
              </div>
            </div>
            <div>
              <div style={{ color: '#444', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>TỔNG TIỀN</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{ticket.totalPrice?.toLocaleString()} VND</div>
            </div>
          </div>
        </div>

        {/* Right Side: QR Code */}
        <div style={{ flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#0a0a0a' }}>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
            <img src={qrUrl} alt="QR Code" style={{ width: '150px', height: '150px' }} crossOrigin="anonymous" />
          </div>
          <div style={{ fontWeight: 800, letterSpacing: '2px', color: '#444', marginBottom: '0.5rem' }}>MÃ ĐẶT VÉ</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white' }}>{ticket.bookingCode}</div>
          <p style={{ fontSize: '0.7rem', color: '#444', marginTop: '1rem' }}>Nhân viên sẽ quét mã này tại rạp</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginTop: '3rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={downloadPDF} 
            disabled={isGenerating}
            className="btn-primary" 
            style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#222' }}
          >
            {isGenerating ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : <Download size={18} />} 
            {isGenerating ? 'ĐANG TẠO...' : 'TẢI VÉ (PDF)'}
          </button>
          <button 
            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
            className="btn-primary" 
            style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#1877F2' }}
          >
            CHIA SẺ FACEBOOK
          </button>
        </div>
        
        <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
          VỀ TRANG CHỦ
        </button>
      </div>

      <style>{`
        @media print {
          nav, footer, button { display: none !important; }
          body { background: white !important; color: black !important; }
          .ticket-container { box-shadow: none !important; border: 1px solid #eee !important; }
        }
      `}</style>
    </div>
  );
}
