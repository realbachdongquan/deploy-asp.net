# API Reference - Cinema Management System

Tài liệu này đặc tả các Endpoint chính phục vụ cho hệ thống quản trị và đặt vé.

## 💳 Payments (Thanh toán)
Cung cấp giao diện quản lý giao dịch tài chính.

### 1. Lấy danh sách giao dịch
- **Endpoint**: `GET /api/payments`
- **Auth**: Admin
- **Response**: Trả về danh sách `Payment` kèm thông tin `Ticket` và `User`.

### 2. Chi tiết giao dịch
- **Endpoint**: `GET /api/payments/{id}`
- **Response**: Thông tin chi tiết một giao dịch.

### 3. Cập nhật trạng thái
- **Endpoint**: `PUT /api/payments/{id}`
- **Payload**:
```json
{
  "id": 1,
  "status": "Success",
  "paidAt": "2026-04-02T..."
}
```

---

## 🎬 Movies (Phim & Quan hệ)
Nâng cấp để hỗ trợ quản lý Thể loại và Diễn viên.

### 1. Tạo phim mới (Kèm quan hệ)
- **Endpoint**: `POST /api/movies`
- **Payload**:
```json
{
  "title": "Dune 2",
  "movieGenres": [ { "genreId": 1 }, { "genreId": 3 } ],
  "movieCrews": [ { "crewId": 5, "role": "Actor", "characterName": "Paul" } ]
}
```

### 2. Cập nhật phim
- **Endpoint**: `PUT /api/movies/{id}`
- **Logic**: Tự động đồng bộ (Sync) danh sách thể loại và diễn viên mới, xóa các quan hệ cũ không còn tồn tại trong payload.

---

## 🎟️ Tickets (Vé & Hóa đơn)
### 1. Lấy danh sách vé công ty
- **Endpoint**: `GET /api/tickets`
- **Include**: Trả về kèm `Showtime`, `Movie`, `User`, `TicketSeats` (Ghế đã chọn).

### 2. Chi tiết vé
- **Endpoint**: `GET /api/tickets/{id}`
- **Response**: Trả về toàn bộ thông tin ghế và lịch chiếu liên quan.

---

## 🌐 SignalR Realtime Hub
- **Hub URL**: `/hub/showtime`
- **Event**: `ReceiveSeatUpdate`
- **Payload**: Danh sách `Seat` đã được cập nhật trạng thái (Locked/Available/Occupied).
