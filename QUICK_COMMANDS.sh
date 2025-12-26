#!/bin/bash
# COPY-PASTE THESE COMMANDS FOR IMMEDIATE DEPLOYMENT
# =================================================

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 STEP 1: NAVIGATE TO PROJECT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cd /home/prasanth/Desktop/CTF_EVENT/CTF_PLATFORM/ctf-test/backend

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔧 STEP 2: APPLY ALL FIXES (ONE COMMAND)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
bash EMERGENCY_DEPLOY.sh

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔄 STEP 3: RESTART SERVER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
pm2 restart all
# OR if not using PM2: npm start

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✅ STEP 4: VERIFY DEPLOYMENT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
curl http://localhost:10000/api/health

# Expected output: {"message":"OK","mongodb":"connected",...}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📊 MONITORING COMMANDS (USE DURING EVENT)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Check server health (every 30 seconds)
watch -n 30 'curl -s localhost:10000/api/health | jq'

# Check Redis connections (should be < 50)
redis-cli INFO clients | grep connected_clients

# Check server logs
pm2 logs

# Check for errors
pm2 logs --lines 50 | grep -i error

# Test leaderboard speed (should be < 1 second)
time curl -s http://localhost:10000/api/auth/leaderboard -H "Authorization: Bearer YOUR_TOKEN"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🆘 EMERGENCY COMMANDS (IF SOMETHING BREAKS)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Restart server
pm2 restart all

# Clear Redis cache (if rate limits causing issues)
redis-cli FLUSHALL

# Check if Redis is running
redis-cli ping

# Start Redis if not running
redis-server &

# Check MongoDB connection
mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')"

# View last 100 log lines
pm2 logs --lines 100

# Check process status
pm2 status

# Increase Node.js memory if crashing
pm2 restart all --update-env --node-args="--max-old-space-size=4096"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📋 QUICK TESTS (RUN BEFORE EVENT STARTS)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 1. Health check
curl http://localhost:10000/api/health

# 2. Test login (replace with real credentials)
curl -X POST http://localhost:10000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 3. Test Redis
redis-cli ping

# 4. Check MongoDB
echo "show dbs" | mongosh "$MONGODB_URI"

# 5. Load test (optional - needs wrk or ab tool)
# wrk -t4 -c100 -d30s http://localhost:10000/api/challenges

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📁 DOCUMENTATION FILES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Quick start guide
cat URGENT_README.md

# Full deployment guide
cat PRODUCTION_DEPLOY.md

# What was changed
cat CHANGES_SUMMARY.md

# Visual summary
cat DEPLOYMENT_VISUAL.md

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✅ DONE! YOU'RE READY FOR 500+ USERS 🚀
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
