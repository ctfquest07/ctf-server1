# CTF Platform Overview

## Tech Stack

### Frontend
- **Framework:** React 18 (Vite)
- **Routing:** React Router v6
- **UI/Styling:** CSS, Chart.js, React Toastify
- **Utilities:** Axios, React Markdown, date-fns/moment
- **Testing:** Vitest

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ORM)
  - *Features:* Connection pooling, strictly typed schemas
- **Caching & Performance:** Redis (ioredis)
  - *Usage:* Rate limiting, Caching, Pub/Sub (likely)
- **Process Management:** PM2 (Cluster Mode)

### Infrastructure
- **Web Server:** Nginx
- **Environment:** Linux

## Security Implementation

### 1. Network Security
- **Rate Limiting:** Multi-layer Redis-backed limiting:
  - `strictLoginLimiter`: Aggressive limiting for login endpoints.
  - `challengeSubmitLimiter`: Prevents flag brute-forcing.
  - `apiLimiter`: General API flood protection.
- **CORS:** Restricted origin access with strict options.
- **HTTP Headers:** `Helmet` (relaxed CSP for CTF compatibility, HSTS, X-Content-Type-Options).

### 2. Authentication & Authorization
- **Auth Method:** JWT (Stateless)
- **Password Storage:** `bcryptjs` hashing
- **IP Tracking:** `request-ip` integration for audit trails.

### 3. Input Validation & Sanitization
- **NoSQL Injection:** `express-mongo-sanitize` prevents MongoDB operator injection.
- **XSS Protection:** `xss-clean` and `xss` libraries sanitize inputs.
- **Parameter Pollution:** `hpp` middleware.
- **Validation:** Custom `enhancedValidation` middleware for request bodies.

### 4. Application Security
- **File Uploads:** Secure `multer` configuration with filename sanitization and type allow-listing.
- **Concurrency Control:** Custom middleware to manage high-load access.
- **Security Logging:** Dedicated logger for security-critical events.
