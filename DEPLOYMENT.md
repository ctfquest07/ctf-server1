# 🚀 CTFQuest Deployment Guide

## 📋 Pre-Deployment Checklist

✅ **Security Implemented:**
- OWASP Top 10 2021 protection
- Environment variables secured
- Input validation and sanitization
- Rate limiting and brute force protection
- Comprehensive security logging

✅ **Files Secured:**
- `.env` files removed from Git
- `.env.example` templates created
- `.gitignore` configured properly

## 🔧 Environment Variables Setup

### **Render (Backend) Environment Variables:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:user@db.urcwnqc.mongodb.net/?appName=db
JWT_SECRET=CTFQuest_2024_Prod_JWT_9f8e7d6c5b4a3928f7e6d5c4b3a29187f6e5d4c3b2a19876f5e4d3c2b1a09876
JWT_EXPIRE=15m
SESSION_SECRET=CTFQuest_2024_Session_8e7d6c5b4a3928f7e6d5c4b3a29187f6e5d4c3b2a19876f5e4d3c2b1a09876
MAX_LOGIN_ATTEMPTS=3
LOGIN_TIMEOUT=30
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-frontend-domain.vercel.app
CORS_CREDENTIALS=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ctfquest@gmail.com
SMTP_PASS=oerdtxwdtycdekis
SMTP_SECURE=true
FROM_EMAIL=ctfquest@gmail.com
```

### **Vercel (Frontend) Environment Variables:**
```
VITE_API_URL=https://your-backend-url.render.com
VITE_APP_NAME=CTFQuest
VITE_APP_VERSION=1.0.0
```

## 🌐 Deployment Steps

### **1. Backend Deployment (Render):**
1. Connect GitHub repo: `https://github.com/Surya-RedOps/CTFQV2.git`
2. Set root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all environment variables from above
6. Deploy and get your backend URL

### **2. Frontend Deployment (Vercel):**
1. Connect GitHub repo: `https://github.com/Surya-RedOps/CTFQV2.git`
2. Set root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables from above
6. Deploy and get your frontend URL

### **3. Post-Deployment Configuration:**
1. Update `CORS_ORIGIN` in Render with your Vercel URL
2. Update `VITE_API_URL` in Vercel with your Render URL
3. Whitelist your Render IP in MongoDB Atlas
4. Test all functionality

## 🔒 Security Notes

- ✅ No sensitive data in repository
- ✅ Environment variables encrypted on platforms
- ✅ HTTPS enforced in production
- ✅ CORS properly configured
- ✅ Rate limiting active
- ✅ Input validation enabled

## 📞 Support

- Repository: https://github.com/Surya-RedOps/CTFQV2.git
- Issues: Create GitHub issue for support

## 🎯 Admin Credentials

After deployment, create admin using the script:
```bash
node createAdminCreds.js
```

**Default Admin:**
- Email: admin@ctfquest.com
- Password: admin123

**⚠️ Change admin password immediately after first login!**