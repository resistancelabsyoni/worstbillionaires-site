# WORST BILLIONAIRE 2025 - Collective Tournament

A timed bracket tournament where everyone votes together and the people's choice advances.

## How It Works

1. **Round 1 (Jan 6-12)**: 8 matchups open. Everyone votes on all 8. Whoever gets more votes in each matchup advances.
2. **Round 2 (Jan 13-19)**: 4 matchups with Round 1 winners
3. **Semifinals (Jan 20-26)**: 2 matchups
4. **Final (Jan 27-Feb 2)**: 1 matchup → WINNER CROWNED

## Features

- **One vote per matchup per email** - prevents ballot stuffing
- **Vote counts hidden** until round closes - builds suspense
- **Countdown timers** - urgency drives participation
- **Past round results** - see who got eliminated and by how much
- **Email capture** - required to vote, with opt-in for updates
- **Social sharing** - share at any point

## Setup

### 1. Configure Dates

Edit `index.html` and set your tournament dates in `CONFIG.rounds`:

```javascript
rounds: [
    { 
        name: 'ROUND OF 16',
        startDate: '2025-01-06T00:00:00-05:00',  // Your timezone
        endDate: '2025-01-12T23:59:59-05:00'
    },
    // ... etc
]
```

### 2. Set Up Google Sheets Backend

1. Create a new Google Sheet
2. Copy the spreadsheet ID from the URL
3. Go to Extensions > Apps Script
4. Paste contents of `google-apps-script.js`
5. Replace `YOUR_SPREADSHEET_ID_HERE` with your ID
6. Run `setupSheets()` to create the sheet structure
7. Deploy > New deployment > Web app > Anyone can access
8. Copy the web app URL

### 3. Connect Frontend to Backend

In `index.html`, replace:
```javascript
apiUrl: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'
```

### 4. Deploy Frontend

Upload `index.html` to any static host:
- Netlify (drag & drop)
- GitHub Pages
- Your own server

### 5. Set Up Round Closing

**Option A: Manual**
At the end of each round, open Apps Script and run:
- `closeRound1()`
- `closeRound2()`
- etc.

**Option B: Automatic**
Run `setupTriggers()` once. It will create time-based triggers to automatically close each round at the scheduled time.

## Demo Mode

For testing, set in `index.html`:
```javascript
demoMode: true,
demoRound: 1  // Which round to simulate (1-4)
```

This bypasses date checks and shows mock data.

## Data Collected

**Contacts Sheet:**
- Timestamp
- Email
- Name (optional)
- ZIP (optional)
- Opt-in status

**Votes Sheet:**
- Timestamp
- Email
- Matchup ID
- Candidate ID
- Round number

**Results Sheet:**
- Round
- Matchup
- Winner
- Loser
- Vote counts

## Customization

### Change the Billionaires

Edit `BILLIONAIRES` object in `index.html` and `INITIAL_BRACKET` in both files.

### Change the Schedule

Edit `CONFIG.rounds` in `index.html` and `ROUNDS` in the Apps Script.

### Styling

All CSS is in `index.html`. Key colors:
```css
--red: #ff3333;
--black: #050505;
--white: #ffffff;
--green: #00ff88;
--gold: #ffd700;
```

## Promotion Tips

1. **Announce early** - "Voting opens Jan 6"
2. **Remind at each round** - "Quarterfinals now open!"
3. **Tease results** - "Round 1 was CLOSE. Musk beat Cook by just 847 votes"
4. **Final countdown** - "24 hours left to vote in the FINAL"
5. **Crown the winner** - Big announcement + social push

---

Built for Movement Labs 🗳️
