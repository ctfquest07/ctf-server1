# CTFd-Style Scoreboard & Dynamic Scoring

This platform now features **CTFd-style dynamic scoring** and an enhanced scoreboard with your platform's unique theme.

## 🎯 Features Implemented

### 1. **Dynamic Scoring (CTFd-Style)**
Challenges now use a dynamic point system where values decrease as more teams solve them:

- **Initial Value**: Maximum points for the first solve
- **Minimum Value**: Floor value (25% of initial by default)
- **Decay Formula**: Logarithmic decay based on solve count
- **Formula**: `value = ((minimum - initial) / (decay²)) × (solves²) + initial`

#### Example:
- Challenge worth **500 points** initially
- Minimum value: **125 points** (25%)
- After 50 solves: reaches minimum value
- After 25 solves: ~312 points (progressive decay)

### 2. **Enhanced Scoreboard**

#### Visual Improvements:
- **Top 3 Medal Badges**:
  - 🥇 Gold gradient for 1st place
  - 🥈 Silver gradient for 2nd place
  - 🥉 Bronze gradient for 3rd place
- **Solve Count Column**: Shows number of challenges solved
- **Row Highlighting**: Subtle gradient for top 3 teams/users
- **Hover Effects**: Left border accent on hover

#### Data Display:
```
Rank | Team/User Name | Points | Solves
-----|----------------|--------|-------
🥇 1  | r4kapig       | 5400   | 12
🥈 2  | :D            | 4200   | 10
🥉 3  | ThatWeeb...   | 3800   | 9
```

### 3. **Time-Series Progression Graph**
- Shows top 10 teams' score progression over time
- CTFd-inspired color scheme with high-contrast lines
- Elapsed time format (hours/minutes)
- Interactive legend to toggle team visibility

### 4. **Challenge Display Updates**
- Shows **current dynamic value** instead of static points
- Displays solve count on challenge cards
- Real-time value updates as teams solve challenges

## 🚀 Usage

### Enable Dynamic Scoring
```bash
cd backend
node scripts/enableDynamicScoring.js
```

This will:
- Enable dynamic scoring for all challenges
- Set initial value to current points
- Set minimum to 25% of initial
- Set decay rate to 50 solves

### Disable Dynamic Scoring
```bash
cd backend
node scripts/disableDynamicScoring.js
```

This reverts to static point values.

### Configure Per Challenge
Dynamic scoring can be configured individually via the admin panel:

```javascript
{
  dynamicScoring: {
    enabled: true,
    initial: 500,     // Max points
    minimum: 125,     // Min points (floor)
    decay: 50         // Solves to reach minimum
  }
}
```

## 🎨 Theme Integration

The CTFd-style features maintain your platform's theme:
- **Primary Color**: `#00ffaa` (Cyan/Green accent)
- **Dark Background**: `#0a0e17`
- **Medal Colors**: Gold, Silver, Bronze gradients
- **Typography**: Uppercase headers, clean sans-serif

## 📊 Scoreboard Mechanics

### Tie-Breaking
When teams have equal points, the system uses:
1. **Total Points** (primary)
2. **Last Solve Time** (tie-breaker - earlier is better)

### Real-Time Updates
- Auto-refresh every 25-35 seconds (jitter to prevent thundering herd)
- Freezes when event ends
- Redis-cached for performance

### Redis ZSET Scoring
```
Score = (Points × 10^10) + (10^10 - UnixTimestamp)
```
This ensures:
- Higher points = higher rank
- Earlier solves break ties
- O(log N) leaderboard queries

## 🔧 Technical Details

### Backend Changes
1. **Challenge Model** (`models/Challenge.js`)
   - Added `dynamicScoring` field with `enabled`, `initial`, `minimum`, `decay`
   - Added `getCurrentValue()` method for dynamic calculation

2. **Challenge Routes** (`routes/challenges.js`)
   - Calculate dynamic value before awarding points
   - Store dynamic value in submissions
   - Return current value in API responses

3. **Scoreboard Routes** (`routes/auth.js`)
   - Enhanced to include solve counts
   - Maintains tie-breaking logic

### Frontend Changes
1. **Scoreboard.jsx**
   - Added "Solves" column
   - Enhanced rank badges with medal colors
   - Top 3 row highlighting

2. **Scoreboard.css**
   - CTFd-style medal gradients
   - Improved hover effects
   - Responsive layout adjustments

3. **Challenges.jsx**
   - Display dynamic point values
   - Show `currentValue` instead of static `points`

4. **ScoreGraph.jsx**
   - Already CTFd-inspired, maintained

## 💡 Tips

### For Admins
- Enable dynamic scoring at event start for fairness
- Monitor decay settings - adjust per challenge difficulty
- Consider disabling for very hard challenges (to maintain incentive)

### For Participants
- Solve challenges early for maximum points
- Check current values before choosing what to solve
- Team collaboration becomes more strategic

## 🔍 Monitoring

Check dynamic scoring in action:
```bash
# Watch challenge values in real-time
curl http://localhost:5000/api/challenges | jq '.data[] | {title, points, currentValue, solves: (.solvedBy | length)}'
```

## 📝 Notes

- Dynamic scoring only applies to **new solves** after enabling
- Previous submissions keep their original point values
- Minimum value prevents challenges from becoming worthless
- System is backward compatible - works with static scoring too

---

**Enjoy your CTFd-style competitive CTF platform! 🚀**
