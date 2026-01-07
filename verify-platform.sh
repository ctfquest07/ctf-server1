#!/bin/bash

echo "============================================"
echo "CTF Platform Pre-Launch Verification Script"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASS=0
FAIL=0

# Function to check status
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((FAIL++))
    fi
}

# Test 1: Check if .env file exists
echo "1. Checking environment configuration..."
if [ -f "backend/.env" ]; then
    check_status 0 ".env file exists"
else
    check_status 1 ".env file missing"
fi

# Test 2: Check if MongoDB URI is configured
echo ""
echo "2. Checking MongoDB configuration..."
MONGO_URI=$(grep "MONGODB_URI" backend/.env 2>/dev/null)
if [ ! -z "$MONGO_URI" ]; then
    check_status 0 "MongoDB URI configured"
else
    check_status 1 "MongoDB URI not found in .env"
fi

# Test 3: Check if Redis URL is configured
echo ""
echo "3. Checking Redis configuration..."
REDIS_URL=$(grep "REDIS_URL" backend/.env 2>/dev/null)
if [ ! -z "$REDIS_URL" ]; then
    echo -e "${YELLOW}⚠${NC}  Redis URL: $(echo $REDIS_URL | cut -d'=' -f2)"
    echo "   Please verify this URL is correct and Redis is accessible"
fi

# Test 4: Check if Node.js is installed
echo ""
echo "4. Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_status 0 "Node.js installed ($NODE_VERSION)"
else
    check_status 1 "Node.js not found"
fi

# Test 5: Check if npm packages are installed
echo ""
echo "5. Checking backend dependencies..."
if [ -d "backend/node_modules" ]; then
    check_status 0 "Backend node_modules exists"
else
    check_status 1 "Backend dependencies not installed (run: cd backend && npm install)"
fi

# Test 6: Check if PM2 is installed
echo ""
echo "6. Checking PM2..."
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    check_status 0 "PM2 installed ($PM2_VERSION)"
else
    check_status 1 "PM2 not found (run: npm install -g pm2)"
fi

# Test 7: Check if Redis is accessible (optional but important)
echo ""
echo "7. Testing Redis connection..."
cd backend
REDIS_TEST=$(node -e "
const Redis = require('ioredis');
const dotenv = require('dotenv');
dotenv.config();
const redis = new Redis(process.env.REDIS_URL);
redis.ping()
  .then(() => { console.log('SUCCESS'); process.exit(0); })
  .catch(err => { console.log('FAILED'); process.exit(1); });
setTimeout(() => process.exit(1), 5000);
" 2>&1)

if echo "$REDIS_TEST" | grep -q "SUCCESS"; then
    check_status 0 "Redis connection successful"
else
    check_status 1 "Redis connection failed - CRITICAL: Update REDIS_URL in .env"
    echo -e "${RED}   This is a CRITICAL issue. Rate limiting and caching won't work.${NC}"
    echo -e "${YELLOW}   Solutions:${NC}"
    echo "   - Install Redis locally: brew install redis (Mac) or apt install redis (Linux)"
    echo "   - Or use cloud Redis: https://upstash.com (free tier)"
fi
cd ..

# Test 8: Check if MongoDB is accessible
echo ""
echo "8. Testing MongoDB connection..."
cd backend
MONGO_TEST=$(node -e "
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
mongoose.connect(process.env.MONGODB_URI, { 
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 10
})
.then(() => { console.log('SUCCESS'); mongoose.connection.close(); process.exit(0); })
.catch(err => { console.log('FAILED'); process.exit(1); });
" 2>&1)

if echo "$MONGO_TEST" | grep -q "SUCCESS"; then
    check_status 0 "MongoDB connection successful"
else
    check_status 1 "MongoDB connection failed - check MONGODB_URI in .env"
fi
cd ..

# Test 9: Check if frontend is built
echo ""
echo "9. Checking frontend build..."
if [ -d "frontend/dist" ]; then
    check_status 0 "Frontend build exists"
else
    echo -e "${YELLOW}⚠${NC}  Frontend not built yet (optional if running dev mode)"
    echo "   To build: cd frontend && npm run build"
fi

# Test 10: Check critical files exist
echo ""
echo "10. Checking critical files..."
FILES=(
    "backend/server.js"
    "backend/middleware/caching.js"
    "backend/middleware/concurrency.js"
    "backend/routes/auth.js"
    "backend/routes/challenges.js"
    "backend/ecosystem.config.js"
)

ALL_FILES_EXIST=true
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        ALL_FILES_EXIST=false
        echo -e "${RED}✗${NC} Missing: $file"
    fi
done

if $ALL_FILES_EXIST; then
    check_status 0 "All critical files present"
else
    check_status 1 "Some critical files missing"
fi

# Summary
echo ""
echo "============================================"
echo "VERIFICATION SUMMARY"
echo "============================================"
echo -e "Tests Passed: ${GREEN}${PASS}${NC}"
echo -e "Tests Failed: ${RED}${FAIL}${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Your platform is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start server: cd backend && pm2 start ecosystem.config.js"
    echo "2. Monitor logs: pm2 logs ctf-backend"
    echo "3. Check health: curl http://localhost:10000/api/health"
    exit 0
else
    echo -e "${RED}⚠️  Please fix the failed checks before launching.${NC}"
    echo ""
    echo "Most critical:"
    echo "- Redis connection (Test 7)"
    echo "- MongoDB connection (Test 8)"
    echo "- Dependencies installed (Test 5)"
    exit 1
fi
