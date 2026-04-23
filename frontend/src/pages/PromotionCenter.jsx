import React, { useState, useEffect } from 'react';
import api from '../services/api';
const toast = {
    success: (msg) => alert("✅ " + msg),
    error: (msg) => alert("❌ " + msg)
};
import { Ticket, Gift, History, CheckCircle, Clock, Zap } from 'lucide-react';

const PromotionCenter = () => {
    const [activeTab, setActiveTab] = useState('available');
    const [loading, setLoading] = useState(true);
    const [promotions, setPromotions] = useState([]);

    const fetchData = async (tab) => {
        setLoading(true);
        try {
            const endpoint = tab === 'available' ? '/promotions/available' : '/promotions/my-promos';
            const res = await api.get(endpoint);
            setPromotions(res.data);
        } catch (error) {
            toast.error("Không thể tải dữ liệu mã giảm giá");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab]);

    const handleClaim = async (id) => {
        try {
            await api.post(`/promotions/claim/${id}`);
            toast.success("Đã nhận mã giảm giá thành công!");
            fetchData(activeTab); // Refresh
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi nhận mã");
        }
    };

    const PromoCard = ({ item, type }) => {
        const p = type === 'available' ? item : item.promotion;
        const isUsed = type === 'my' && item.isUsed;

        return (
            <div className={`promo-card ${isUsed ? 'used' : ''}`}>
                <div className="promo-left">
                    <div className="promo-icon">
                        {p.discountPercentage >= 50 ? <Zap size={24} /> : <Gift size={24} />}
                    </div>
                    <div className="promo-value">
                        {p.discountPercentage}% <span>OFF</span>
                    </div>
                </div>
                <div className="promo-right">
                    <div className="promo-header">
                        <h3>{p.promoCode}</h3>
                        {type === 'available' && (
                            <span className="promo-slots">
                                Còn {p.usageLimit - p.currentUsage} lượt
                            </span>
                        )}
                        {isUsed && <span className="status-badge used">Đã dùng</span>}
                    </div>
                    <p className="promo-desc">{p.description}</p>
                    <div className="promo-footer">
                        <div className="promo-expiry">
                            <Clock size={14} />
                            Hết hạn: {new Date(p.endDate).toLocaleDateString('vi-VN')}
                        </div>
                        {type === 'available' ? (
                            <button className="claim-btn" onClick={() => handleClaim(p.id)}>
                                Nhận ngay
                            </button>
                        ) : (
                            !isUsed && <button className="use-btn" onClick={() => window.location.href='/movies'}>Sử dụng</button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="promotion-center-container">
            <div className="page-header">
                <div className="header-content">
                    <h1>Trung tâm Ưu đãi</h1>
                    <p>Săn mã giảm giá cực hời, trải nghiệm điện ảnh đỉnh cao</p>
                </div>
            </div>

            <div className="promo-tabs">
                <button 
                    className={activeTab === 'available' ? 'active' : ''} 
                    onClick={() => setActiveTab('available')}
                >
                    <Zap size={18} /> Mã khả dụng
                </button>
                <button 
                    className={activeTab === 'my' ? 'active' : ''} 
                    onClick={() => setActiveTab('my')}
                >
                    <Ticket size={18} /> Mã của tôi
                </button>
            </div>

            <div className="promo-grid">
                {loading ? (
                    <div className="loading-state">Đang tải...</div>
                ) : promotions.length > 0 ? (
                    promotions.map(item => (
                        <PromoCard key={item.id} item={item} type={activeTab} />
                    ))
                ) : (
                    <div className="empty-state">
                        <History size={48} />
                        <p>Hiện không có mã giảm giá nào trong mục này</p>
                    </div>
                )}
            </div>

            <style>{`
                .promotion-center-container {
                    max-width: 1200px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                    min-height: 80vh;
                }
                .page-header {
                    margin-bottom: 3rem;
                    text-align: center;
                }
                .page-header h1 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    background: linear-gradient(to right, #fff, var(--primary));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 0.5rem;
                }
                .promo-tabs {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2.5rem;
                    justify-content: center;
                }
                .promo-tabs button {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 0.8rem 1.5rem;
                    color: #888;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s;
                    font-weight: 600;
                }
                .promo-tabs button.active {
                    background: var(--primary);
                    color: #fff;
                    border-color: var(--primary);
                    box-shadow: 0 8px 20px rgba(229, 9, 20, 0.3);
                }
                .promo-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 1.5rem;
                }
                .promo-card {
                    background: rgba(20,20,20,0.6);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    display: flex;
                    overflow: hidden;
                    transition: transform 0.3s;
                    position: relative;
                }
                .promo-card:hover {
                    transform: translateY(-5px);
                    border-color: rgba(229, 9, 20, 0.4);
                }
                .promo-card.used {
                    opacity: 0.6;
                    filter: grayscale(0.8);
                }
                .promo-left {
                    background: linear-gradient(135deg, var(--primary) 0%, #b20710 100%);
                    width: 100px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    padding: 1rem;
                    position: relative;
                }
                .promo-left::after {
                    content: '';
                    position: absolute;
                    right: -5px;
                    top: 0;
                    bottom: 0;
                    width: 10px;
                    background-image: radial-gradient(circle at 10px 10px, transparent 0, transparent 5px, rgba(20,20,20,1) 5px);
                    background-size: 20px 20px;
                    background-position: -10px 0;
                }
                .promo-value {
                    font-size: 1.8rem;
                    font-weight: 900;
                    line-height: 1;
                    text-align: center;
                }
                .promo-value span {
                    font-size: 0.7rem;
                    display: block;
                }
                .promo-right {
                    flex: 1;
                    padding: 1.2rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .promo-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.5rem;
                }
                .promo-header h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    color: #fff;
                }
                .promo-slots {
                    font-size: 0.7rem;
                    color: var(--primary);
                    background: rgba(229, 9, 20, 0.1);
                    padding: 2px 8px;
                    border-radius: 4px;
                }
                .promo-desc {
                    font-size: 0.85rem;
                    color: #aaa;
                    margin: 0.5rem 0 1rem 0;
                    line-height: 1.4;
                }
                .promo-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .promo-expiry {
                    font-size: 0.75rem;
                    color: #666;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .claim-btn, .use-btn {
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .claim-btn {
                    background: #fff;
                    color: #000;
                    border: none;
                }
                .claim-btn:hover {
                    background: var(--primary);
                    color: #fff;
                }
                .use-btn {
                    background: transparent;
                    border: 1px solid var(--primary);
                    color: var(--primary);
                }
                .status-badge {
                    font-size: 0.7rem;
                    padding: 2px 8px;
                    border-radius: 4px;
                }
                .status-badge.used {
                    background: #333;
                    color: #888;
                }
                .empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 5rem;
                    color: #444;
                }
                .empty-state p {
                    margin-top: 1rem;
                }
            `}</style>
        </div>
    );
};

export default PromotionCenter;
