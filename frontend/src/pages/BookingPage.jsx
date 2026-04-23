import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import showtimeSignalR from '../services/signalr';
import SeatPicker from '../components/SeatPicker';
import { Clock, Ticket, CreditCard, ChevronLeft, Popcorn, Plus, Minus, ShoppingBag, Sparkles } from 'lucide-react';

export default function BookingPage() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [otherUsersSeats, setOtherUsersSeats] = useState({}); // { seatId: userId }

  // Concessions state
  const [concessions, setConcessions] = useState([]);
  const [selectedConcessions, setSelectedConcessions] = useState({}); // { id: { qty: number, options: string } }

  // Voucher Wallet state
  const [myVouchers, setMyVouchers] = useState([]);
  const [publicPromos, setPublicPromos] = useState([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [suggestingBest, setSuggestingBest] = useState(false);

  const currentUserEmail = useMemo(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try { return JSON.parse(userStr)?.email; } catch { return null; }
  }, []);

  const fetchSeats = useCallback(async (updateInfo = null) => {
    console.log("[BookingPage] fetchSeats called with:", updateInfo?.type || 'initial/manual');
    
    if (updateInfo?.type === 'seat_selected') {
      setOtherUsersSeats(prev => ({ ...prev, [updateInfo.seatId]: updateInfo.userId }));
      return;
    }
    if (updateInfo?.type === 'seat_unselected') {
      setOtherUsersSeats(prev => {
        const newState = { ...prev };
        delete newState[updateInfo.seatId];
        return newState;
      });
      return;
    }

    let finalSeats = updateInfo?.type === 'full_update' ? updateInfo.data : null;
    if (!finalSeats) {
      try {
        const res = await api.get(`/booking/seats/${showtimeId}`);
        finalSeats = res.data;
        console.log("[BookingPage] Seats fetched from API:", finalSeats?.length);
      } catch (err) {
        console.error("Error fetching seats", err);
        return;
      }
    } else {
      console.log("[BookingPage] Seats updated from SignalR full_update:", finalSeats?.length);
    }

    setSeats([...finalSeats]); // Spread to ensure new reference
    
    if (Array.isArray(finalSeats)) {
      const lockedByMe = finalSeats
        .filter(s => s.status === 'Locked' && (s.lockedBy?.toLowerCase() === currentUserEmail?.toLowerCase()))
        .map(s => Number(s.seatId));
      
      setSelectedSeats(prev => {
        const currentSelected = prev.map(id => Number(id));
        const merged = [...new Set([...currentSelected, ...lockedByMe])];
        return merged;
      });
    }
  }, [showtimeId, currentUserEmail]);

  const fetchVouchers = useCallback(async () => {
    try {
      const [availableRes, myRes] = await Promise.all([
        api.get('/promotions/available'),
        api.get('/promotions/my-promos?isUsed=false')
      ]);
      setPublicPromos(availableRes.data);
      setMyVouchers(myRes.data);
    } catch (err) {
      console.error("Voucher fetch error:", err);
    }
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      alert("Hết thời gian giữ chỗ! Vui lòng chọn lại.");
      navigate(0);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const initData = async () => {
      try {
        const [stRes, concRes] = await Promise.all([
          api.get(`/showtimes/${showtimeId}`),
          api.get('/concessions?pageSize=50')
        ]);
        setShowtime(stRes.data);
        const concItems = concRes.data?.items || concRes.data || [];
        setConcessions(Array.isArray(concItems) ? concItems : []);
      } catch (err) {
        console.error(err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    initData();
    fetchSeats();
    fetchVouchers();
  }, [showtimeId, fetchSeats, fetchVouchers]);

  useEffect(() => {
    showtimeSignalR.startConnection(showtimeId, fetchSeats);
    return () => {
      // We don't stop connection immediately on every re-render anymore
      // stopConnection will only be called if showtimeId actually changes or component unmounts
    };
  }, [showtimeId]); // ONLY depend on showtimeId

  useEffect(() => {
    showtimeSignalR.updateCallback(fetchSeats);
  }, [fetchSeats]);

  const handleSeatClick = async (seatId) => {
    if (selectedSeats.some(id => Number(id) === Number(seatId))) {
        try {
            await api.post('/booking/unlock', { showtimeId: parseInt(showtimeId), seatIds: [parseInt(seatId)] });
            setSelectedSeats(prev => prev.filter(id => Number(id) !== Number(seatId)));
            showtimeSignalR.unselectSeat(showtimeId, seatId, currentUserEmail);
        } catch (err) {
            console.error("Error unlocking seat", err);
        }
        return;
    }

    try {
      await api.post('/booking/lock', { showtimeId: parseInt(showtimeId), seatIds: [parseInt(seatId)] });
      setSelectedSeats(prev => [...new Set([...prev.map(id => Number(id)), parseInt(seatId)])]);
      showtimeSignalR.selectSeat(showtimeId, seatId, currentUserEmail);
      setTimeLeft(600);
    } catch (err) {
      alert("Ghế này đang được người khác giữ.");
      fetchSeats();
    }
  };

  const handleAddConcession = (id) => {
    setSelectedConcessions(prev => ({
      ...prev,
      [id]: { qty: (prev[id]?.qty || 0) + 1, options: prev[id]?.options || '' }
    }));
  };

  const handleRemoveConcession = (id) => {
    setSelectedConcessions(prev => {
      const current = prev[id];
      if (!current) return prev;
      const newQty = current.qty - 1;
      if (newQty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: { ...current, qty: newQty } };
    });
  };

  const handleSetOptions = (id, options) => {
    setSelectedConcessions(prev => ({
      ...prev,
      [id]: { ...prev[id], options }
    }));
  };

  const handleApplyPromo = (code) => {
    const targetCode = code || promoCode;
    if (!targetCode) return;
    setPromoError('');
    
    // Check in owned vouchers (the response structure for my-promos is { id, isUsed, promotion: { promoCode, ... } })
    const inWallet = myVouchers.find(v => v.promotion.promoCode === targetCode);
    if (inWallet) {
      setAppliedPromo(inWallet.promotion);
      // We also need the UserPromotionId for checkout
      setPromoCode('');
      setShowVoucherModal(false);
      return;
    }
    setPromoError('Mã khuyến mãi không có trong ví của bạn hoặc đã hết hạn');
    setAppliedPromo(null);
  };

  const handleClaim = async (promoId) => {
    try {
      await api.post(`/promotions/claim/${promoId}`);
      fetchVouchers();
    } catch (err) {
      alert("Bạn đã sở hữu mã này hoặc mã đã hết lượt dùng.");
    }
  };

  const handleSuggestBest = async () => {
    setSuggestingBest(true);
    try {
      const res = await api.get(`/promotions/suggest-best?totalAmount=${subtotal}`);
      if (res.data) {
        handleApplyPromo(res.data.code);
      } else {
        alert("Bạn chưa có mã giảm giá nào khả dụng.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSuggestingBest(false);
    }
  };

  const handleCheckout = async () => {
    setBookingLoading(true);
    try {
      const res = await api.post('/booking/checkout', {
        showtimeId: parseInt(showtimeId),
        seatIds: selectedSeats,
        paymentMethod: 'VNPAY',
        promoCode: appliedPromo?.promoCode,
        userPromotionId: myVouchers.find(v => v.promotion.id === appliedPromo?.id)?.id,
        concessions: Object.entries(selectedConcessions).map(([id, data]) => ({
          concessionId: parseInt(id),
          quantity: data.qty,
          selectedOptions: data.options
        }))
      });
      
      if (res.data.paymentUrl) window.location.href = res.data.paymentUrl;
      else navigate(`/ticket-success/${res.data.ticketId}`);
    } catch (err) {
<<<<<<< HEAD
      console.error("[Checkout Error]", err);
      const serverMsg = err.response?.data?.message || err.response?.data;
      alert(`Thanh toán thất bại. ${serverMsg || "Phiên của bạn có thể đã hết hạn."}`);
=======
      alert("Thanh toán thất bại. Phiên của bạn có thể đã hết hạn.");
>>>>>>> 7d9239482c49161f8c9542f4796931a539c7f1d2
      setSelectedSeats([]);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '10rem', textAlign: 'center' }}><div className="spinner"></div></div>;

  const validSelectedSeats = [...new Set(selectedSeats.map(id => Number(id)))].filter(id => seats.some(s => Number(s.seatId) === id));
  const calculateSeatTotal = () => validSelectedSeats.reduce((sum, seatId) => {
    const seat = seats.find(s => Number(s.seatId) === seatId);
    let price = (showtime?.movie?.basePrice || 0) * (showtime?.customPriceMultiplier || 1);
    if (seat?.type === 'VIP') price *= 1.2;
    if (seat?.type === 'Sweetbox') price *= 1.5;
    return sum + price;
  }, 0);
  const calculateConcessionTotal = () => Object.entries(selectedConcessions).reduce((sum, [id, data]) => {
    const item = concessions.find(c => c.id === parseInt(id));
    return sum + (item?.price || 0) * data.qty;
  }, 0);

  const seatTotal = calculateSeatTotal();
  const concessionTotal = calculateConcessionTotal();
  const subtotal = seatTotal + concessionTotal;
  const discountAmount = appliedPromo ? Math.min(seatTotal * (appliedPromo.discountPercentage / 100), appliedPromo.maxDiscountAmount || Infinity) : 0;
  const finalTotal = subtotal - discountAmount;
  const totalConcessionItems = Object.values(selectedConcessions).reduce((s, d) => s + d.qty, 0);

  const grouped = concessions.reduce((acc, item) => {
    const cat = item.category || 'Khác';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categoryIcons = { 'Combo': '🍿', 'Snack': '🧁', 'Drink': '🥤', 'Popcorn': '🍿' };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="ui-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080808' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={() => navigate(-1)} className="action-btn" style={{ padding: '0.5rem', borderRadius: '50%' }}><ChevronLeft /></button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'white' }}>{showtime?.movie?.title}</h1>
            <p style={{ margin: '0.2rem 0 0 0', color: '#555', fontSize: '0.8rem' }}>
              {showtime?.cinema?.name} • {showtime?.room?.name} • {new Date(showtime?.startTime).toLocaleString()}
            </p>
          </div>
        </div>
        <div style={{ background: 'rgba(229, 9, 20, 0.1)', padding: '0.6rem 1.2rem', borderRadius: '12px', border: '1px solid #222' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 800 }}>THỜI GIAN</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'monospace' }}>{formatTime(timeLeft)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="ui-panel" style={{ background: '#050505' }}>
            <SeatPicker 
              seats={seats} 
              selectedSeats={selectedSeats} 
              onSeatClick={handleSeatClick} 
              currentUserEmail={currentUserEmail} 
              otherSelectedSeats={Object.keys(otherUsersSeats).map(Number)}
            />
          </div>

          {concessions.length > 0 && (
            <div className="ui-panel" style={{ padding: '2rem', background: '#0a0a0a' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><ShoppingBag size={20} color="var(--accent)" /> COMBO BẮP NƯỚC</h3>
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category} style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#444', marginBottom: '0.75rem' }}>{categoryIcons[category] || '🎬'} {category.toUpperCase()}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {items.map(item => {
                      const data = selectedConcessions[item.id] || { qty: 0, options: '' };
                      return (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: data.qty > 0 ? 'rgba(255,195,0,0.05)' : '#111', border: '1px solid #1a1a1a' }}>
                          <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                             {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (categoryIcons[item.category] || '🍿')}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</div>
                            <div style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '0.85rem' }}>{item.price?.toLocaleString()} ₫</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {data.qty > 0 && (
                                <><button onClick={() => handleRemoveConcession(item.id)} className="action-btn"><Minus size={14} /></button>
                                <span style={{ width: '20px', textAlign: 'center', fontWeight: 800 }}>{data.qty}</span></>
                              )}
                              <button onClick={() => handleAddConcession(item.id)} className="action-btn" style={{ background: 'var(--accent)', color: 'black' }}><Plus size={14} /></button>
                            </div>
                            {data.qty > 0 && item.availableOptions && (
                              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                {item.availableOptions.split(',').map(opt => (
                                  <button key={opt} onClick={() => handleSetOptions(item.id, opt.trim())} style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem', borderRadius: '4px', background: data.options === opt.trim() ? 'var(--accent)' : '#000', color: data.options === opt.trim() ? 'black' : '#555', border: '1px solid #222' }}>{opt.trim()}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="ui-panel" style={{ padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}><Ticket color="var(--primary)" /> ĐƠN HÀNG</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#888' }}><span>🎬 Ghế ({validSelectedSeats.length})</span><span style={{ color: 'white' }}>{seatTotal.toLocaleString()} ₫</span></div>
              {Object.entries(selectedConcessions).map(([id, d]) => {
                const it = concessions.find(c => c.id === parseInt(id));
                return it && <div key={id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#888' }}><div>{it.name} x{d.qty} {d.options && <span style={{ color: 'var(--accent)' }}>(Vị: {d.options})</span>}</div><span style={{ color: 'white' }}>{(it.price * d.qty).toLocaleString()} ₫</span></div>
              })}
              {appliedPromo && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--success)' }}><span>🎁 Giảm giá</span><span>-{discountAmount.toLocaleString()} ₫</span></div>}
              <div style={{ borderTop: '1px solid #222', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem' }}><span>TỔNG</span><span style={{ color: 'var(--primary)' }}>{finalTotal.toLocaleString()} ₫</span></div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="MÃ GIẢM GIÁ" style={{ flex: 1, background: '#000', border: '1px solid #222', padding: '0.6rem', color: 'white', fontSize: '0.8rem' }} />
              <button onClick={() => handleApplyPromo()} style={{ background: '#222', padding: '0 1rem', border: 'none', color: 'white', fontWeight: 700 }}>ÁP DỤNG</button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button onClick={() => setShowVoucherModal(!showVoucherModal)} style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: '1px solid #222', color: '#666', fontSize: '0.7rem' }}>VÍ VOUCHER ({myVouchers.length})</button>
              <button onClick={handleSuggestBest} disabled={suggestingBest} style={{ flex: 1, padding: '0.5rem', background: 'rgba(255,195,0,0.1)', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 800 }}>{suggestingBest ? '...' : 'AI GỢI Ý'}</button>
            </div>

            {showVoucherModal && (
              <div style={{ padding: '1rem', background: '#050505', border: '1px solid #111', maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: 800, marginBottom: '0.5rem' }}>VOUCHER CỦA BẠN</div>
                  {myVouchers.map(v => (
                    <div key={v.id} onClick={() => handleApplyPromo(v.promotion.promoCode)} style={{ padding: '0.5rem', border: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', cursor: 'pointer' }}>
                      <div style={{ fontSize: '0.7rem' }}>{v.promotion.promoCode} <span style={{ color: '#555' }}>(-{v.promotion.discountPercentage}%)</span></div>
                      <button style={{ fontSize: '0.6rem', background: '#222', color: 'white', border: 'none' }}>DÙNG</button>
                    </div>
                  ))}
                </div>
                {publicPromos.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: 800, marginBottom: '0.5rem' }}>ƯU ĐÃI ĐANG CÓ</div>
                    {publicPromos.map(p => (
                      <div key={p.id} style={{ padding: '0.5rem', border: '1px dashed #222', display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>{p.promoCode}</div>
                        <button onClick={() => handleClaim(p.id)} style={{ fontSize: '0.6rem', background: 'var(--accent)', color: 'black', border: 'none', fontWeight: 800 }}>NHẬN</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {promoError && <p style={{ color: 'var(--danger)', fontSize: '0.7rem' }}>{promoError}</p>}
            {appliedPromo && <p style={{ color: 'var(--success)', fontSize: '0.7rem' }}>✓ Đã áp dụng mã {appliedPromo.promoCode}</p>}

            <div style={{ padding: '1rem', background: '#000', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent)', fontWeight: 800, marginBottom: '1.5rem' }}>
              <CreditCard size={18} /> VNPAY
            </div>

            <button className="btn-primary" disabled={validSelectedSeats.length === 0 || bookingLoading} onClick={handleCheckout} style={{ width: '100%', padding: '1rem', fontWeight: 800 }}>
              {bookingLoading ? 'ĐANG XỬ LÝ...' : `XÁC NHẬN • ${finalTotal.toLocaleString()} ₫`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
