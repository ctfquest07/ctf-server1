#!/bin/bash
# Deploy Notification Feature to Production Server
# Run this script ON YOUR EC2 SERVER

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔔 Deploying Notification Feature"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Navigate to backend
cd ~/ctf-server1/backend || exit 1

echo "✅ Step 1: Pulling latest backend changes..."
git pull origin main

echo "✅ Step 2: Installing backend dependencies..."
npm install

# Navigate to frontend
cd ~/ctf-server1/frontend || exit 1

echo "✅ Step 3: Pulling latest frontend changes..."
git pull origin main 

echo "✅ Step 4: Installing frontend dependencies..."
npm install

echo "✅ Step 5: Copying notification sound to public folder..."
# Make sure the sound file exists
if [ ! -f "public/notification.wav" ]; then
    echo "⚠️  Warning: notification.wav not found in public folder"
    echo "   Looking for mixkit file in project root..."
    if [ -f "../mixkit-interface-option-select-2573.wav" ]; then
        cp ../mixkit-interface-option-select-2573.wav public/notification.wav
        echo "   ✓ Sound file copied"
    elif [ -f "../../mixkit-interface-option-select-2573.wav" ]; then
        cp ../../mixkit-interface-option-select-2573.wav public/notification.wav
        echo "   ✓ Sound file copied from parent directory"
    else
        echo "   ⚠️  Sound file not found, please copy manually"
    fi
fi

echo "✅ Step 6: Building frontend with new changes..."
npm run build

echo "✅ Step 7: Restarting backend with PM2..."
pm2 restart ctf-backend

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 Checking status..."
pm2 status

echo ""
echo "📋 Checking recent logs for errors..."
pm2 logs ctf-backend --lines 20 --nostream

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing the API endpoints..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "1. Testing /api/notices endpoint..."
curl -s http://localhost:3000/api/notices | jq '.success'

echo ""
echo "2. Testing if notification.wav is accessible..."
curl -I http://localhost/notification.wav 2>&1 | grep "HTTP/"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Open https://ctfquest.ddns.net in browser"
echo "2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
echo "3. Login and check Notices link for badge"
echo "4. Create a new notice from admin dashboard"
echo "5. Wait 30 seconds or refresh to see badge update"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
