# TÀI LIỆU BÁO CÁO DỰ ÁN: HỆ THỐNG QUẢN LÝ RẠP CHIẾU PHIM & ĐẶT VÉ TRỰC TUYẾN (CINEMA PLUS)

> **Người thực hiện:** dwan AI Agent
> **Ngày lập:** 23/04/2026
> **Trạng thái:** Hoàn thiện (Production Ready)

---

## 1. TỔNG QUAN ĐỀ TÀI
Dự án **Cinema Plus** là một nền tảng quản lý rạp chiếu phim hiện đại, cung cấp giải pháp toàn diện cho cả khách hàng (đặt vé, xem thông tin phim, đánh giá) và quản trị viên (quản lý lịch chiếu, doanh thu, phân tích dữ liệu). Hệ thống tích hợp các công nghệ tiên tiến như AI để phân tích hành vi người dùng và SignalR để cập nhật trạng thái ghế ngồi theo thời gian thực.

---

## 2. KIẾN TRÚC CÔNG NGHỆ (TECH STACK)

### 2.1. Backend (API Layer)
- **Framework:** ASP.NET Core 9.0 Web API.
- **ORM:** Entity Framework Core (Hỗ trợ đa Database: PostgreSQL cho Production, SQL Server cho Development).
- **Security:** JWT (JSON Web Token) Authentication & Authorization.
- **Real-time:** SignalR (Cập nhật lịch chiếu và trạng thái ghế).
- **Background Tasks:** Hangfire (Xử lý dọn dẹp ghế ảo, phân tích AI định kỳ).
- **AI Integration:** AI Service tích hợp phân tích cảm xúc (Sentiment Analysis) và gợi ý phim (Recommendation System).
- **API Documentation:** Swagger/OpenAPI 3.0.

### 2.2. Frontend (Client Layer)
- **Framework:** React 19 + Vite (Tối ưu tốc độ build và runtime).
- **Routing:** React Router 7.
- **State Management:** React Hooks & Context API.
- **Communication:** Axios (REST API) & @microsoft/signalr (WebSocket).
- **UI Libraries:** Lucide React (Icons), Recharts (Biểu đồ thống kê).
- **Utilities:** jsPDF & html2canvas (Xuất vé PDF), html5-qrcode (Quét mã QR).

### 2.3. DevOps & Database
- **Database:** PostgreSQL (Primary), SQL Server (Secondary).
- **Containerization:** Docker & Docker Compose.
- **Deployment:** Hỗ trợ Render, Vercel.

---

## 3. CẤU TRÚC CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Hệ thống bao gồm **23 bảng** dữ liệu chính, được chia thành các phân hệ:

### 3.1. Phân hệ Người dùng & Bảo mật
- **Users:** Lưu trữ thông tin tài khoản, mật khẩu (hash), vai trò.
- **Memberships:** Quản lý cấp độ thành viên (Silver, Gold, Platinum).
- **AuditLogs:** Theo dõi mọi thay đổi nhạy cảm trong hệ thống.

### 3.2. Phân hệ Phim & Lịch chiếu
- **Movies:** Thông tin chi tiết phim (Tiêu đề, tóm tắt, trailer, đạo diễn).
- **Genres / MovieGenres:** Thể loại phim và bảng liên kết.
- **CrewMembers / MovieCrews:** Thông tin diễn viên, đoàn làm phim.
- **Showtimes:** Lịch chiếu phim (Phòng, giờ bắt đầu, giá vé).

### 3.3. Phân hệ Rạp & Cơ sở vật chất
- **Cinemas:** Thông tin rạp (Tên, địa chỉ, bản đồ).
- **Rooms:** Danh sách phòng chiếu trong rạp.
- **Seats:** Sơ đồ ghế ngồi (Hàng, cột, loại ghế: Normal, VIP).
- **SeatLocks:** Cơ chế khóa ghế tạm thời khi người dùng đang thực hiện thanh toán (tránh trùng ghế).

### 3.4. Phân hệ Đặt vé & Thanh toán
- **Tickets:** Thông tin vé đã đặt.
- **TicketSeats:** Liên kết vé với vị trí ghế cụ thể.
- **Payments:** Giao dịch thanh toán (Tích hợp VnPay, trạng thái: Success/Failed).
- **Concessions / TicketConcessions:** Quản lý đồ ăn/nước uống đi kèm vé.
- **Promotions / UserPromotions:** Mã giảm giá và ưu đãi thành viên.

### 3.5. Phân hệ Tương tác & AI
- **Reviews:** Đánh giá của người dùng kèm điểm cảm xúc do AI phân tích.
- **UserWatchlist:** Danh sách phim yêu thích của người dùng.

---

## 4. CÁC API ENDPOINTS CHÍNH

1. 🔐 Hệ thống Xác thực & Người dùng (Authentication & Users)
Auth Controller (/api/Auth)

POST /api/Auth/login: Đăng nhập hệ thống.
POST /api/Auth/register: Đăng ký tài khoản.
GET /api/Auth/profile: Lấy thông tin cá nhân.
PUT /api/Auth/profile: Cập nhật thông tin cá nhân.
PUT /api/Auth/change-password: Đổi mật khẩu.
POST /api/Auth/forgot-password: Yêu cầu khôi phục mật khẩu.
POST /api/Auth/reset-password: Đặt lại mật khẩu mới.
GET /api/Auth/me/debug: Kiểm tra Claims của Token (Debug).
GET /api/Auth/seed-fix: Sửa lỗi dữ liệu mẫu.
GET /api/Auth/db-check: Kiểm tra kết nối Database.
Users Controller (/api/Users)

GET /api/Users: Lấy danh sách người dùng (Admin).
GET /api/Users/{id}: Chi tiết người dùng.
PUT /api/Users/{id}: Cập nhật người dùng.
DELETE /api/Users/{id}: Xóa/Khóa người dùng.
Memberships Controller (/api/Memberships)

GET /api/Memberships: Lấy danh sách các hạng thành viên.
GET /api/Memberships/my-status: Kiểm tra hạng thành viên của tôi.
POST /api/Memberships/upgrade: Nâng cấp hạng thành viên.
2. 🎬 Quản lý Phim & Lịch chiếu (Movies & Showtimes)
Movies Controller (/api/Movies)

GET /api/Movies: Lấy danh sách phim (kèm lọc/phân trang).
GET /api/Movies/{id}: Chi tiết phim.
POST /api/Movies: Thêm phim mới.
PUT /api/Movies/{id}: Cập nhật thông tin phim.
DELETE /api/Movies/{id}: Xóa phim.
GET /api/Movies/trending: Phim đang hot.
GET /api/Movies/upcoming: Phim sắp chiếu.
Genres Controller (/api/Genres)

GET /api/Genres: Danh sách thể loại.
POST /api/Genres: Thêm thể loại.
DELETE /api/Genres/{id}: Xóa thể loại.
CrewMembers Controller (/api/CrewMembers)

GET /api/CrewMembers: Danh sách diễn viên/đạo diễn.
POST /api/CrewMembers: Thêm nhân sự mới.
Showtimes Controller (/api/Showtimes)

GET /api/Showtimes: Lấy danh sách tất cả lịch chiếu.
GET /api/Showtimes/movie/{movieId}: Lịch chiếu theo phim.
GET /api/Showtimes/cinema/{cinemaId}: Lịch chiếu theo rạp.
POST /api/Showtimes: Tạo lịch chiếu mới.
DELETE /api/Showtimes/{id}: Hủy lịch chiếu.
3. 🏢 Quản lý Rạp & Cơ sở vật chất (Cinemas & Infrastructure)
Cinemas Controller (/api/Cinemas)

GET /api/Cinemas: Danh sách rạp.
GET /api/Cinemas/{id}: Chi tiết rạp.
POST /api/Cinemas: Thêm rạp mới.
PUT /api/Cinemas/{id}: Cập nhật rạp.
DELETE /api/Cinemas/{id}: Xóa rạp.
Rooms Controller (/api/Rooms)

GET /api/Rooms/cinema/{cinemaId}: Danh sách phòng của rạp.
POST /api/Rooms: Thêm phòng chiếu.
Seats Controller (/api/Seats)

GET /api/Seats/room/{roomId}: Sơ đồ ghế của phòng.
POST /api/Seats/setup: Thiết lập nhanh sơ đồ ghế.
4. 🎟️ Đặt vé & Thanh toán (Booking & Payments)
Booking Controller (/api/Booking)

GET /api/Booking/seats/{showtimeId}: Lấy trạng thái ghế (Trống/Đã đặt/Đang khóa).
POST /api/Booking/lock: Khóa ghế tạm thời (SignalR).
POST /api/Booking/unlock: Mở khóa ghế.
POST /api/Booking/checkout: Tạo đơn hàng và thanh toán.
Payment Controller (/api/Payment)

POST /api/Payment/create-vnpay-url: Tạo link thanh toán VnPay.
GET /api/Payment/vnpay-return: Nhận kết quả từ VnPay.
GET /api/Payment/history: Lịch sử giao dịch cá nhân.
Tickets Controller (/api/Tickets)

GET /api/Tickets/my-tickets: Danh sách vé của tôi.
GET /api/Tickets/{id}: Chi tiết vé (kèm mã QR).
POST /api/Tickets/verify-qr: Kiểm tra vé tại rạp (Dành cho nhân viên).
5. 🤖 Phân tích AI & Gợi ý (AI & Recommendations)
Reviews Controller (/api/Reviews)

GET /api/Reviews/movie/{movieId}: Danh sách đánh giá của phim.
POST /api/Reviews: Gửi đánh giá mới (Tự động kích hoạt AI Sentiment).
GET /api/Reviews/sentiment-summary/{movieId}: Tóm tắt cảm xúc của phim bằng AI.
Recommendation Controller (/api/Recommendation)

GET /api/Recommendation/personalized: Gợi ý phim cá nhân hóa cho User.
GET /api/Recommendation/similar/{movieId}: Gợi ý phim tương tự.
6. 📊 Quản trị & Hệ thống (Admin & System)
AdminDashboard Controller (/api/AdminDashboard)

GET /api/AdminDashboard/revenue-stats: Thống kê doanh thu.
GET /api/AdminDashboard/ai-movie-insights: AI phân tích hiệu quả kinh doanh của các phim.
GET /api/AdminDashboard/top-customers: Top khách hàng thân thiết.
AuditLogs Controller (/api/AuditLogs)

GET /api/AuditLogs: Truy xuất nhật ký hệ thống (Admin).
Concessions Controller (/api/Concessions)

GET /api/Concessions: Danh sách đồ ăn/nước uống.
POST /api/Concessions: Thêm sản phẩm mới.
Promotions Controller (/api/Promotions)

GET /api/Promotions/active: Danh sách khuyến mãi đang chạy.
POST /api/Promotions: Tạo chiến dịch khuyến mãi mới.
📡 Real-time Hub (WebSockets)
Showtime Hub: ws://domain/hub/showtime
Sự kiện: ReceiveSeatStatusUpdate (Cập nhật trạng thái ghế ngay lập tức khi có người chọn).

---

## 5. QUY TRÌNH NGHIỆP VỤ (WORKFLOWS)

### 5.1. Quy trình Đặt vé của Khách hàng
1. **Tìm kiếm:** Khách hàng xem danh sách phim và chọn phim yêu thích.
2. **Chọn suất:** Chọn rạp, ngày chiếu và khung giờ phù hợp.
3. **Chọn ghế:** Hệ thống hiển thị sơ đồ ghế thời gian thực (SignalR). Khi khách chọn, ghế sẽ bị khóa tạm thời (SeatLock) trong 5-10 phút.
4. **Thanh toán:** Khách hàng chọn mã giảm giá (nếu có) và thanh toán qua VnPay.
5. **Nhận vé:** Sau khi thanh toán thành công, hệ thống tạo vé PDF kèm mã QR và gửi qua Email.

### 5.2. Quy trình Quản trị & AI
1. **Lập lịch:** Admin tạo suất chiếu. Hệ thống tự động kiểm tra xung đột phòng chiếu.
2. **AI Review:** Khi khách hàng đánh giá phim, Background Service gửi nội dung tới AI để phân tích cảm xúc (Tích cực/Tiêu cực) để xếp hạng phim.
3. **AI Recommend:** Hệ thống gợi ý phim dựa trên lịch sử xem và thể loại yêu thích của người dùng.
4. **Hệ thống:** Hangfire tự động dọn dẹp các SeatLock hết hạn để giải phóng ghế cho người khác.

---

## 6. HƯỚNG DẪN CÀI ĐẶT (QUICK START)

### Backend
```bash
cd Cinema.Backend
dotnet restore
dotnet run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---
*Tài liệu được tạo tự động bởi hệ thống dwan - 2026*
