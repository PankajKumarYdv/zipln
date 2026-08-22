# ⚡ Zipln

### A modern, full-stack URL shortener built for speed, simplicity, and insights.

**Zipln** is a production-oriented URL shortening platform that allows users to create, manage, and track short links. It supports guest URL shortening, user authentication, custom aliases, QR codes, click analytics, API access, and Free/Pro plans.

> 🔗 **Shorten. Share. Track.**

### 🌐 Live Demo

🚀 **Try Zipln:** https://zipln.vercel.app/


---

## ✨ Features

### 🔗 URL Shortening

* Create short and shareable URLs instantly
* Guest URL shortening without creating an account
* Generate unique short codes automatically
* Support for custom aliases for Pro users
* Optional link expiration

### 🔐 Authentication & Security

* User registration and login
* JWT-based authentication
* Secure password hashing with bcrypt
* Protected routes and authenticated dashboards
* Secure API key generation and management
* API keys stored as hashes

### 📊 Click Analytics

Track how your links perform with detailed insights:

* 📈 Total clicks
* 📅 Daily, monthly, and yearly statistics
* 💻 Device information
* 🌐 Browser and operating system details
* 📍 Geographic information
* 🏢 ISP and network information
* 📉 Interactive charts and trends
* 📄 Paginated activity history

### 👤 User Dashboard

* View all created URLs
* Manage and delete links
* Monitor link performance
* View click statistics
* Access detailed link insights

### 💎 Free & Pro Plans

| Feature            | 🆓 Free     | 💎 Pro      |
| ------------------ | ----------- | ----------- |
| Create Short URLs  | Daily limit | Unlimited   |
| Guest Shortening   | ✅           | ✅           |
| Custom Aliases     | ❌           | ✅           |
| Basic Analytics    | ✅           | ✅           |
| Detailed Analytics | Limited     | Full Access |
| Charts & Trends    | ❌           | ✅           |
| API Access         | ❌           | ✅           |
| API Keys           | ❌           | ✅           |
| QR Codes           | ✅           | ✅           |

> 💡 The billing system is currently implemented as a demo/simulated upgrade flow.

---

## 🖼️ Application Highlights

```text
🏠 Homepage
   ↓
🔗 Create Short URL
   ↓
📋 Manage Links
   ↓
📊 View Statistics
   ↓
📈 Analyze Performance
```

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │     React + Vite    │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │   Node.js + Express │
                    │       Backend       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       MongoDB       │
                    │      Database       │
                    └─────────────────────┘
```

---

## 🛠️ Tech Stack

### 🎨 Frontend

* ⚛️ React
* ⚡ Vite
* 🎨 Tailwind CSS
* 🔄 React Router
* 🌐 Axios
* 🎭 Framer Motion
* 📊 Recharts
* 📱 React QR Code

### ⚙️ Backend

* 🟢 Node.js
* 🚂 Express.js
* 🍃 MongoDB
* 🗄️ Mongoose
* 🔐 JSON Web Token
* 🔒 bcrypt
* 🛡️ Express Rate Limit
* 📁 Multer
* 🔍 Express Validator
* 🎲 Nanoid

### 📊 Analytics

* Device detection using User-Agent parsing
* Browser and operating system detection
* Geographic and network enrichment
* Click tracking
* Time-based analytics

---

## 📁 Project Structure

```text
zipln/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── scripts/
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── public/
│   └── package.json
│
└── extension/
    └── Browser extension
```

---

# 🚀 Getting Started

## Prerequisites

Make sure you have installed:

* Node.js 18+
* npm
* MongoDB or a MongoDB Atlas database

---

## ⚙️ Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file based on `.env.example`.

Example:

```env
PORT=5000

MONGODB_URI=<your-mongodb-connection-string>

JWT_SECRET=<your-secure-random-secret>

CLIENT_URL=<your-frontend-origin>

FREE_DAILY_URL_LIMIT=10

GUEST_SHORTEN_HOURLY_LIMIT=40

PUBLIC_API_RATE_LIMIT_WINDOW_MS=900000

PUBLIC_API_RATE_LIMIT_MAX=100

PUBLIC_SHORT_URL_BASE=<your-public-short-url-domain>
```

Start the development server:

```bash
npm run dev
```

For production:

```bash
npm start
```

---

# 🎨 Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```env
VITE_API_URL=<your-backend-api-origin>
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

---

# 🔌 API Overview

## 🔐 Authentication

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Create an account |
| POST   | `/api/auth/login`    | Login             |
| GET    | `/api/auth/me`       | Get current user  |

---

## 🔗 URL Management

| Method | Endpoint        | Description      |
| ------ | --------------- | ---------------- |
| GET    | `/api/urls`     | Get user URLs    |
| POST   | `/api/urls`     | Create short URL |
| DELETE | `/api/urls/:id` | Delete URL       |

---

## 👥 Guest URL Shortening

| Method | Endpoint             | Description                          |
| ------ | -------------------- | ------------------------------------ |
| POST   | `/api/guest/shorten` | Shorten a URL without authentication |

---

## 📊 Statistics

| Method | Endpoint                       | Description                  |
| ------ | ------------------------------ | ---------------------------- |
| GET    | `/api/urls/:id/stats/summary`  | Get URL statistics           |
| GET    | `/api/urls/:id/stats/activity` | Get paginated click activity |
| GET    | `/api/urls/:id/stats/timeline` | Get time-based chart data    |

> ⚠️ If your current code still uses `events` and `chart`, update this section to match the endpoint names currently present in your repository.

---

## 🔑 API Keys

Available for Pro users.

| Method | Endpoint        | Description    |
| ------ | --------------- | -------------- |
| GET    | `/api/keys`     | Get API keys   |
| POST   | `/api/keys`     | Create API key |
| DELETE | `/api/keys/:id` | Revoke API key |

---

## ⚡ Public API

Pro users can create short URLs programmatically using an API key.

```text
POST /api/shorten
```

The API key is sent using:

```text
X-API-Key: <your-api-key>
```

---

# 🔒 Security

Zipln includes several security-focused features:

* 🔐 Password hashing with bcrypt
* 🎟️ JWT authentication
* 🛡️ Rate limiting
* ✅ Request validation
* 🔑 Hashed API keys
* 🚫 Protected API routes
* 🌍 CORS configuration
* ⏳ Optional URL expiration

---

# 📊 How Click Tracking Works

When someone visits a short URL:

```text
Short URL
    ↓
Redirect Request
    ↓
Find Original URL
    ↓
Record Click Information
    ↓
Process Analytics
    ↓
Redirect User
```

The system can record information such as:

```text
📱 Device
🌐 Browser
💻 Operating System
📍 Location
🏢 Network / ISP
⏰ Timestamp
```

---

# 🌐 Deployment

The application can be deployed using:

```text
Frontend → Vercel
Backend  → Render
Database → MongoDB Atlas
```

### Important production environment variables

#### Backend

```env
NODE_ENV=production
MONGODB_URI=<production-database-uri>
JWT_SECRET=<strong-production-secret>
CLIENT_URL=<production-frontend-origin>
PUBLIC_SHORT_URL_BASE=<production-short-url-domain>
```

#### Frontend

```env
VITE_API_URL=<production-backend-origin>
```

---

# 🧭 SPA Routing

Zipln uses React Router.

For deployment on Vercel, add a `vercel.json` file inside the `frontend` directory:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures routes such as:

```text
/dashboard
/settings
/dashboard/stats/:id
```

work correctly when opened directly or refreshed.

---

# 🧩 Browser Extension

Zipln also includes a browser extension directory that can be used to extend the URL shortening workflow directly into the browser.

Potential usage includes:

* ⚡ Quickly shorten the current page
* 📋 Copy shortened links
* 🔐 Connect with authenticated accounts
* 🚀 Create links without opening the main dashboard

---

# 🔮 Future Improvements

* [ ] Real payment gateway integration
* [ ] Custom domain support
* [ ] Advanced analytics dashboard
* [ ] CSV analytics export
* [ ] Link folders and organization
* [ ] Bulk URL shortening
* [ ] Password-protected links
* [ ] Team collaboration
* [ ] Custom branded domains
* [ ] Email notifications
* [ ] Improved browser extension features

---

# 🤝 Contributing

Contributions, suggestions, and feature ideas are welcome!

If you'd like to contribute:

```bash
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit your changes
5. Open a pull request
```

---

# 👨‍💻 Author

**Pankaj Kumar**

MCA Student | Full-Stack Developer | AI Enthusiast

Built with ❤️ using the MERN stack.

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

It helps motivate future improvements and new features!

---

<div align="center">

### ⚡ Zipln

**Shorten links. Track clicks. Gain insights.**

Made with ❤️ and lots of ☕

</div>

## 📄 License

This project is licensed under the **MIT License**.
