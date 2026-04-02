# 🚀 Hướng dẫn Deploy Cinema System lên Web (Miễn phí)

> **Stack**: .NET 8 Backend + React/Vite Frontend + PostgreSQL (Aiven)  
> **Hosting**: Render (Backend) + Vercel (Frontend)  
> **CI/CD**: Tự động khi `git push` lên nhánh `main`

---

## 📋 Tổng quan Kiến trúc

```
GitHub (Code)
    │
    ├──► Render.com  ──► Backend .NET 8 API  (https://deploy-asp-net.onrender.com)
    │         └──► Aiven PostgreSQL Database
    │
    └──► Vercel.com  ──► Frontend React     (https://cinema-xxx.vercel.app)
```

---

## ✅ Chuẩn bị (1 lần duy nhất)

### 1. Tài khoản cần có
- [ ] GitHub: https://github.com (đã có: `realbachdongquan`)
- [ ] Render: https://render.com (đăng nhập bằng GitHub)
- [ ] Vercel: https://vercel.com (đăng nhập bằng GitHub)
- [ ] Aiven: https://console.aiven.io (đăng nhập bằng GitHub/Email)

### 2. Git đã được cấu hình
```bash
# Kiểm tra remote origin
git remote -v
# Kết quả phải là:
# origin  https://github.com/realbachdongquan/deploy-asp.net.git
```

---

## 🗄️ BƯỚC 1: Tạo Database PostgreSQL trên Aiven

1. Vào https://console.aiven.io → **Create Service** → **PostgreSQL**
2. Chọn Plan: **Free** (Hobbyist)
3. Region: Tuỳ chọn (Singapore gần nhất)
4. Đặt tên: `cinema-db`
5. Đợi ~3 phút cho Service khởi động (trạng thái **Running**)
6. Vào tab **Overview** → Copy **Service URI**:
   ```
   postgresql://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require
   ```
   > ⚠️ Lưu lại URI này, sẽ dùng ở Bước 2.

---

## ⚙️ BƯỚC 2: Deploy Backend lên Render

### 2.1. Tạo Web Service
1. Vào https://render.com → **New** → **Web Service**
2. Kết nối GitHub → Chọn repo `deploy-asp.net`
3. Điền thông tin:

| Trường | Giá trị |
|--------|---------|
| **Name** | `deploy-asp-net` |
| **Language** | `Docker` |
| **Branch** | `main` |
| **Root Directory** | `BachDongQuan_2123110434` |
| **Instance Type** | `Free` |

### 2.2. Thêm Environment Variables
Click **Advanced** → **Add Environment Variable**, thêm lần lượt:

| Key | Value |
|-----|-------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | *(URI từ Aiven — Bước 1)* |
| `Jwt__Key` | `ThisIsASecretKeyForJwtAuthenticationWhichMustBeVeryLongBecauseOfSecurityReasons!@#$%` |
| `Jwt__Issuer` | `CinemaApp` |
| `Jwt__Audience` | `CinemaApp` |
| `AllowedOrigins` | *(URL Vercel — điền sau khi có)* |

### 2.3. Deploy
- Click **Create Web Service**
- Đợi ~5-10 phút để Build (xem log tại tab **Events**)
- Khi thấy **Live** màu xanh → Copy URL: `https://deploy-asp-net.onrender.com`

> ⚠️ **Free Tier giới hạn**: Service sẽ tắt sau 15 phút không dùng. Request đầu tiên sẽ chậm ~50 giây để wake up.

---

## 🌐 BƯỚC 3: Deploy Frontend lên Vercel

### 3.1. Thêm biến môi trường VITE_API_URL (Local)
Tạo file `frontend/.env.production`:
```env
VITE_API_URL=https://deploy-asp-net.onrender.com/api
```

### 3.2. Import Project lên Vercel
1. Vào https://vercel.com → **Add New Project**
2. Import từ GitHub → Chọn repo `deploy-asp.net`
3. Điền:

| Trường | Giá trị |
|--------|---------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. Mục **Environment Variables** → Thêm:
   - `VITE_API_URL` = `https://deploy-asp-net.onrender.com/api`

5. Click **Deploy** → Đợi ~2 phút
6. Copy URL Vercel VD: `https://cinema-abc123.vercel.app`

### 3.3. Cập nhật AllowedOrigins trên Render
Quay lại Render → **Environment** → Cập nhật:
- `AllowedOrigins` = `https://cinema-abc123.vercel.app`

---

## 🔄 Quy trình Deploy lần sau (CHỈ CẦN 3 LỆNH)

```bash
# 1. Lưu thay đổi
git add .

# 2. Tạo bản ghi
git commit -m "feat: mô tả tính năng mới"

# 3. Đẩy lên → Render + Vercel tự động deploy
git push origin main
```

> **Thời gian chờ sau push:**
> - Frontend (Vercel): ~1-2 phút
> - Backend (Render): ~5-7 phút (Docker build)

---

## 🔧 Xử lý Sự cố Thường gặp

### ❌ Lỗi "Service unavailable" hoặc quá chậm
→ Free tier đang wake up. Chờ 50 giây và thử lại.

### ❌ Lỗi 401 Unauthorized khi Login
→ Kiểm tra `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience` trên Render khớp với `appsettings.json`.

### ❌ Lỗi CORS (Frontend không gọi được API)
→ Kiểm tra biến `AllowedOrigins` trên Render = URL chính xác của Vercel.

### ❌ Lỗi Database Migration
→ Xem log Render. Nếu lỗi PostgreSQL connection → Kiểm tra `ConnectionStrings__DefaultConnection` đúng URI và có `?sslmode=require`.

### ❌ Build thất bại trên Render
→ Xem tab **Events** → Click vào deploy thất bại → Đọc log lỗi cụ thể.

---

## 📂 Cấu trúc File quan trọng

```
asp.net-main/
├── .github/workflows/deploy.yml     ← CI/CD pipeline
├── .gitignore                        ← Bỏ qua .agent/, node_modules/...
├── BachDongQuan_2123110434/
│   ├── Dockerfile                    ← Đóng gói Backend cho Docker
│   ├── Program.cs                    ← Cấu hình Prod/Dev DB switching
│   ├── appsettings.json              ← JWT Config (Issuer/Audience = CinemaApp)
│   └── Data/AppDbContext.cs          ← EF Core DbContext
└── frontend/
    ├── Dockerfile                    ← Đóng gói Frontend (Nginx)
    ├── src/services/api.js           ← Đọc VITE_API_URL tự động
    └── .env.production               ← URL Backend cho Production
```

---

## 🔗 Links quan trọng

| Dịch vụ | URL Dashboard |
|---------|--------------|
| GitHub Repo | https://github.com/realbachdongquan/deploy-asp.net |
| Render Dashboard | https://dashboard.render.com |
| Vercel Dashboard | https://vercel.com/dashboard |
| Aiven Console | https://console.aiven.io |

---

*Tài liệu này được tạo ngày 02/04/2026 — Cinema Management System v2.0*
