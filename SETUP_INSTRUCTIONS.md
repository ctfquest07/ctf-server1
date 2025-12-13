# PWN-Grid Setup Instructions

Complete guide to install and run the PWN-Grid CTF Platform on a fresh system.

## Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** (v4.0+) - [Download](https://www.mongodb.com/try/download/community)
- **Git** (optional, for version control)

Verify installations:
```bash
node --version
npm --version
mongod --version
```

---

## Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Create Environment Configuration
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

On Windows (Command Prompt):
```cmd
copy .env.example .env
```

### Step 4: Configure Environment Variables
Edit the `.env` file with your settings:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ctf-platform
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=1h
CORS_ORIGIN=http://localhost:5173
```

### Step 5: Start MongoDB
Make sure MongoDB is running on your system:
```bash
mongod
```

In a new terminal window, verify MongoDB connection:
```bash
mongo
```

### Step 6: Seed the Database (Optional)
Create admin user:
```bash
npm run create-admin
```

Seed tutorials:
```bash
npm run seed:tutorials
```

### Step 7: Start Backend Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

**Verify Backend is Running:**
```bash
curl http://localhost:5000/api/health
```

Backend will run on `http://localhost:5000`

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory
Open a new terminal window:
```bash
cd frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Create Environment Configuration (if needed)
Check if `.env` exists or create one:
```bash
cat .env
```

Typical frontend `.env` content:
```
VITE_API_URL=http://localhost:5000/api
```

### Step 4: Start Frontend Development Server
```bash
npm run dev
```

Frontend will typically run on `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Run Linting
```bash
npm run lint
```

---

## Running Both Backend and Frontend

### Option 1: Terminal Tabs/Windows
1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Terminal 2 - MongoDB:**
   ```bash
   mongod
   ```

3. **Terminal 3 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

Access the application at `http://localhost:5173`

### Option 2: Background Processes (Linux/Mac)

**Terminal 1:**
```bash
mongod &
```

**Terminal 2:**
```bash
cd backend
npm run dev
```

**Terminal 3:**
```bash
cd frontend
npm run dev
```

---

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB service is running
- Check `MONGODB_URI` in `.env` matches your MongoDB connection string
- Default: `mongodb://localhost:27017/ctf-platform`

### Port Already in Use
**Backend (5000):**
```bash
# Linux/Mac
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Frontend (5173):**
```bash
# Linux/Mac
lsof -i :5173
kill -9 <PID>

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Dependencies Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# On Windows
rmdir /s node_modules
del package-lock.json
npm install
```

### CORS Errors
Ensure `CORS_ORIGIN` in backend `.env` matches your frontend URL:
```
CORS_ORIGIN=http://localhost:5173
```

---

## Quick Start Commands Summary

```bash
# Backend installation and run
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend installation and run (in new terminal)
cd frontend
npm install
npm run dev

# Create admin user
cd backend
npm run create-admin

# Seed tutorials
cd backend
npm run seed:tutorials
```

---

## Useful Commands

### Backend
- `npm run start` - Start server in production
- `npm run dev` - Start with nodemon (development)
- `npm run create-admin` - Create admin user
- `npm run seed:tutorials` - Seed tutorial data
- `npm run startup-check` - Check startup requirements

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

---

## Default Login Credentials

After running `npm run create-admin` in the backend, follow the prompts to create an admin user with credentials.

---

## Compression and Transfer

To compress the project for transfer:

```bash
# Linux/Mac
tar -czf pwnGrid.tar.gz CTFaas3/

# Windows (using 7-Zip or WinRAR)
# Right-click folder → Send to → Compressed (zipped) folder
# Or use: tar -czf pwnGrid.tar.gz CTFaas3/

# Extract on fresh system
tar -xzf pwnGrid.tar.gz
cd CTFaas3
```

Then follow the setup instructions above.

---

## Additional Notes

- Keep `.env` files secure and never commit them to version control
- MongoDB must be running before starting the backend
- Use `npm run dev:safe` for development with startup checks
- Check backend logs for any connection or startup errors

---

For more information or issues, refer to the project README or documentation files.
