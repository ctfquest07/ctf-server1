#!/bin/bash

# CTFd-Style Scoreboard - Quick Commands

echo "================================================"
echo "  CTFd-Style Scoreboard Quick Commands"
echo "================================================"
echo ""

# Enable dynamic scoring
echo "1. Enable Dynamic Scoring for All Challenges:"
echo "   cd backend && node scripts/enableDynamicScoring.js"
echo ""

# Disable dynamic scoring
echo "2. Disable Dynamic Scoring:"
echo "   cd backend && node scripts/disableDynamicScoring.js"
echo ""

# Restart services
echo "3. Restart Backend (to apply changes):"
echo "   cd backend && pm2 restart ecosystem.config.js"
echo ""

# Check challenge values
echo "4. View Current Challenge Values:"
echo "   curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:5000/api/challenges | jq '.data[] | {title, points, currentValue, solves: (.solvedBy | length)}'"
echo ""

# Monitor scoreboard
echo "5. Monitor Scoreboard Updates:"
echo "   watch -n 5 'curl -H \"Authorization: Bearer YOUR_TOKEN\" http://localhost:5000/api/auth/scoreboard?type=teams | jq \".data[0:5]\"'"
echo ""

echo "================================================"
echo "  Features Implemented:"
echo "================================================"
echo "✓ Dynamic scoring (CTFd-style decay)"
echo "✓ Medal badges for top 3 (Gold/Silver/Bronze)"
echo "✓ Solve count column"
echo "✓ Enhanced row highlighting"
echo "✓ Time-series progression graph"
echo "✓ Real-time value updates"
echo ""
echo "Documentation: See CTFD_STYLE_FEATURES.md"
echo "================================================"
