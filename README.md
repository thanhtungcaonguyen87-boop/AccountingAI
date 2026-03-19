# 🧾 Công Nợ AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)

> **Công Nợ AI** là ứng dụng web mobile-first giúp quản lý công nợ khách hàng thông minh — chỉ cần nhập mô tả tự nhiên bằng tiếng Việt, AI sẽ tự động phân tích và tạo đơn hàng chính xác trong vài giây.

---

## ✨ Features

- 🤖 **AI Natural Language Input** — Nhập liệu bằng ngôn ngữ tự nhiên tiếng Việt, Gemini 2.5 Flash tự động trích xuất khách hàng, sản phẩm, số lượng, đơn giá.
- 🔐 **Google OAuth Login** — Đăng nhập an toàn qua Google, powered by Supabase Auth.
- 📋 **Quản lý đơn hàng 3 tab** — Xem danh sách theo trạng thái: **Chưa thanh toán**, **Đã thanh toán**, **Tất cả đơn**.
- ✏️ **CRUD đầy đủ** — Thêm, sửa, xoá đơn hàng dễ dàng ngay trên giao diện.
- 🔍 **Keyword Shortcut** — Gợi ý nhanh tên khách hàng & sản phẩm từ database khi đang nhập liệu.
- 📱 **Mobile-first Design** — Giao diện tối ưu cho điện thoại với Tailwind CSS, dark mode thân thiện.
- ⚡ **Realtime Database** — Dữ liệu đồng bộ tức thì qua Supabase PostgreSQL.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| ⚛️ Frontend Framework | React 19 + TypeScript |
| ⚡ Build Tool | Vite 8 |
| 🎨 Styling | Tailwind CSS v4 |
| 🔗 Routing | React Router DOM v7 |
| 🗄️ Backend & Auth | Supabase (PostgreSQL + Auth) |
| 🤖 AI Engine | Google Gemini 2.5 Flash (`@google/genai`) |
| 🖼️ Icons | Lucide React |
| 🚀 Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 18.x`
- npm hoặc yarn
- Tài khoản [Supabase](https://supabase.com/) & [Google AI Studio](https://aistudio.google.com/)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/coffeelog03/Acounting-AI.git
cd Acounting-AI

# 2. Cài đặt dependencies
npm install

# 3. Tạo file biến môi trường (xem mục bên dưới)
cp .env.example .env.local

# 4. Chạy ở môi trường development
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173` 🎉

---

## 🔑 Environment Variables

Tạo file `.env.local` ở thư mục gốc với các biến sau:

```env
# Supabase - Lấy từ Project Settings > API
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI - Lấy từ https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key
```

> ⚠️ **Lưu ý:** Không commit file `.env.local` lên Git. File này đã được thêm vào `.gitignore`.

---

## 🌐 Deployment (Vercel)

### Cách 1: Deploy qua Vercel Dashboard (Khuyến nghị)

1. Truy cập [vercel.com](https://vercel.com) và đăng nhập.
2. Nhấn **"Add New Project"** → Import từ GitHub repo `Acounting-AI`.
3. Vercel tự nhận diện Vite, giữ nguyên cài đặt mặc định.
4. Vào tab **"Environment Variables"**, thêm 3 biến từ mục trên.
5. Nhấn **"Deploy"** ✅

### Cách 2: Deploy qua Vercel CLI

```bash
# Cài Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy production
vercel --prod
```

### Build thủ công

```bash
npm run build
# Output sẽ nằm trong thư mục /dist
```

---

## 📁 Project Structure

```
AccountAI/
├── public/              # Static assets
├── src/
│   ├── components/
│   │   ├── ai/          # AIPreview, HeroInput components
│   │   └── layout/      # MainLayout, BottomNav
│   ├── context/         # AuthContext (Google OAuth)
│   ├── lib/
│   │   ├── aiParser.ts  # Gemini AI integration
│   │   └── supabase.ts  # Supabase client
│   └── pages/
│       ├── LoginPage.tsx
│       ├── ChuaThanhToan.tsx   # Tab: Chưa thanh toán
│       ├── DaThanhToan.tsx     # Tab: Đã thanh toán
│       └── TatCaDon.tsx        # Tab: Tất cả đơn
├── .env.local           # Biến môi trường (không commit)
├── vite.config.ts
└── package.json
```

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/coffeelog03">coffeelog03</a> · Powered by Gemini AI & Supabase</sub>
</div>
