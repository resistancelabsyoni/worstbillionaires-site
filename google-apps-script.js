/**
 * WORST BILLIONAIRE 2025 - Collective Tournament Backend
 * Google Apps Script
 * 
 * SETUP:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Run setupSheets() once to create the sheet structure
 * 5. Deploy > New deployment > Web app > Anyone can access
 * 6. Copy the URL to your index.html CONFIG.apiUrl
 */

// ============================================
// CONFIGURATION
// ============================================
// Spreadsheet ID for storing votes and contact data.  This must be
// replaced with the ID of the sheet you created for the Worst Billionaires
// tournament.  See the README for setup instructions.
const SPREADSHEET_ID = '1T65YvdTQNXMb_l9nUnMtBTOMyF7TgP_4dVAc6qNAN_I';

// Initial bracket (must match frontend)
// Initial bracket.  Each pair represents a Round of 16 matchup.  This
// bracket must match the frontend ordering in index.html.  The first
// element in each sub‑array is the first candidate, the second is the
// opponent.  Candidate IDs correspond to the keys in the BILLIONAIRES
// object on the frontend.
const INITIAL_BRACKET = [
  ['musk',        'andreessen'],  // Matchup 1
  ['trump',       'sacks'],       // Matchup 2
  ['bezos',       'zuckerberg'],  // Matchup 3
  ['adelson',     'sun'],         // Matchup 4
  ['ellison',     'thiel'],       // Matchup 5
  ['zhao',        'murdoch'],     // Matchup 6
  ['schwarzman',  'adani'],       // Matchup 7
  ['koch',        'dimon']        // Matchup 8
];

// Round schedule (must match frontend)
// Tournament schedule.  Each round has a start and end date.  Dates
// should be in ISO‑8601 format (YYYY‑MM‑DD).  The current round is
// determined based on the server’s timezone at runtime.  Update these
// dates to control when voting opens and closes for each stage.
const ROUNDS = [
  // Round of 16 runs from Dec 24, 2025 through Jan 5, 2026
  { name: 'Round of 16',    start: '2025-12-24', end: '2026-01-05' },
  // Quarterfinals follow immediately after, Jan 6–Jan 12, 2026
  { name: 'Quarterfinals',  start: '2026-01-06', end: '2026-01-12' },
  // Semifinals: Jan 13–Jan 19, 2026
  { name: 'Semifinals',     start: '2026-01-13', end: '2026-01-19' },
  // Final: Jan 20–Jan 26, 2026
  { name: 'The Final',      start: '2026-01-20', end: '2026-01-26' }
];

// ============================================
// WEB APP HANDLERS
// ============================================

function doGet(e) {
  const action = e.parameter.action;
  
  let result;
  switch (action) {
    case 'getTournament':
      result = getTournamentData();
      break;
    default:
      result = { error: 'Unknown action', status: 'error' };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let result;
    switch (action) {
      case 'submitVotes':
        result = submitVotes(data.email, data.votes);
        break;
      case 'registerEmail':
        result = registerEmail(data.email, data.name, data.zip, data.optIn);
        break;
      default:
        result = { error: 'Unknown action', status: 'error' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString(), status: 'error' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// TOURNAMENT DATA
// ============================================

function getTournamentData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const currentRound = getCurrentRound();
  
  const data = {
    currentRound: currentRound,
    totalVotes: getTotalVoteCount(),
    matchups: {},
    results: {}
  };
  
  // Get current round matchups
  if (currentRound >= 1 && currentRound <= 4) {
    data.matchups = getMatchupsForRound(currentRound);
  }
  
  // Get past round results
  for (let r = 1; r < currentRound; r++) {
    data.results[r] = getRoundResults(r);
  }
  
  return data;
}

function getCurrentRound() {
  const now = new Date();
  
  for (let i = 0; i < ROUNDS.length; i++) {
    const start = new Date(ROUNDS[i].start + 'T00:00:00');
    const end = new Date(ROUNDS[i].end + 'T23:59:59');
    
    if (now >= start && now <= end) {
      return i + 1;
    }
  }
  
  // Before tournament
  if (now < new Date(ROUNDS[0].start + 'T00:00:00')) {
    return 0;
  }
  
  // After tournament
  if (now > new Date(ROUNDS[3].end + 'T23:59:59')) {
    return 5;
  }
  
  // Between rounds - return negative of next round
  for (let i = 0; i < ROUNDS.length - 1; i++) {
    const endCurrent = new Date(ROUNDS[i].end + 'T23:59:59');
    const startNext = new Date(ROUNDS[i + 1].start + 'T00:00:00');
    
    if (now > endCurrent && now < startNext) {
      return -(i + 2);
    }
  }
  
  return 1;
}

function getMatchupsForRound(roundNum) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const matchups = {};
  
  if (roundNum === 1) {
    // Round 1 uses initial bracket
    INITIAL_BRACKET.forEach((pair, i) => {
      const matchupId = `r1m${i + 1}`;
      matchups[matchupId] = {
        id: matchupId,
        round: 1,
        candidates: pair,
        votes: getVoteCountsForMatchup(matchupId)
      };
    });
  } else {
    // Later rounds: get winners from previous round
    const prevResults = getRoundResults(roundNum - 1);
    const winners = prevResults.map(r => r.winner);
    
    for (let i = 0; i < winners.length; i += 2) {
      const matchupId = `r${roundNum}m${Math.floor(i / 2) + 1}`;
      matchups[matchupId] = {
        id: matchupId,
        round: roundNum,
        candidates: [winners[i], winners[i + 1]],
        votes: getVoteCountsForMatchup(matchupId)
      };
    }
  }
  
  return matchups;
}

function getVoteCountsForMatchup(matchupId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const votesSheet = ss.getSheetByName('Votes');
  
  if (!votesSheet) return {};
  
  const data = votesSheet.getDataRange().getValues();
  const counts = {};
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === matchupId) {
      const candidate = data[i][3];
      counts[candidate] = (counts[candidate] || 0) + 1;
    }
  }
  
  return counts;
}

function getRoundResults(roundNum) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const resultsSheet = ss.getSheetByName('Results');
  
  if (!resultsSheet) return [];
  
  const data = resultsSheet.getDataRange().getValues();
  const results = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === roundNum) {
      results.push({
        matchup: data[i][1],
        winner: data[i][2],
        loser: data[i][3],
        winnerVotes: data[i][4],
        loserVotes: data[i][5]
      });
    }
  }
  
  return results;
}

function getTotalVoteCount() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const votesSheet = ss.getSheetByName('Votes');
  
  if (!votesSheet) return 0;
  
  return Math.max(0, votesSheet.getLastRow() - 1);
}

// ============================================
// VOTING
// ============================================

function submitVotes(email, votes) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const votesSheet = ss.getSheetByName('Votes');
  const currentRound = getCurrentRound();
  
  if (currentRound < 1 || currentRound > 4) {
    return { success: false, error: 'Voting is not currently open' };
  }
  
  // Check for duplicate votes
  const existingVotes = votesSheet.getDataRange().getValues();
  const alreadyVoted = {};
  
  for (let i = 1; i < existingVotes.length; i++) {
    if (existingVotes[i][1] === email) {
      alreadyVoted[existingVotes[i][2]] = true;
    }
  }
  
  // Submit new votes
  const timestamp = new Date().toISOString();
  let votesSubmitted = 0;
  
  for (const [matchupId, candidateId] of Object.entries(votes)) {
    if (!alreadyVoted[matchupId]) {
      votesSheet.appendRow([
        timestamp,
        email,
        matchupId,
        candidateId,
        currentRound
      ]);
      votesSubmitted++;
    }
  }
  
  return { 
    success: true, 
    votesSubmitted: votesSubmitted,
    message: `${votesSubmitted} votes recorded`
  };
}

// ============================================
// EMAIL REGISTRATION
// ============================================

function registerEmail(email, name, zip, optIn) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let contactsSheet = ss.getSheetByName('Contacts');
  
  if (!contactsSheet) {
    contactsSheet = ss.insertSheet('Contacts');
    contactsSheet.appendRow(['Timestamp', 'Email', 'Name', 'ZIP', 'Opt In', 'Source']);
    contactsSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }
  
  // Check if email already exists
  const data = contactsSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email) {
      return { success: true, existing: true };
    }
  }
  
  contactsSheet.appendRow([
    new Date().toISOString(),
    email,
    name || '',
    zip || '',
    optIn ? 'Yes' : 'No',
    'Worst Billionaire 2025'
  ]);
  
  return { success: true, existing: false };
}

// ============================================
// ROUND MANAGEMENT (run manually or via trigger)
// ============================================

/**
 * Call this when a round ends to calculate winners
 * Can be set up as a time-based trigger
 */
function closeRound(roundNum) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const votesSheet = ss.getSheetByName('Votes');
  let resultsSheet = ss.getSheetByName('Results');
  
  if (!resultsSheet) {
    resultsSheet = ss.insertSheet('Results');
    resultsSheet.appendRow(['Round', 'Matchup', 'Winner', 'Loser', 'Winner Votes', 'Loser Votes']);
    resultsSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }
  
  // Get matchups for this round
  const matchups = getMatchupsForRound(roundNum);
  
  // Calculate winners
  for (const [matchupId, matchup] of Object.entries(matchups)) {
    const votes = getVoteCountsForMatchup(matchupId);
    const [c1, c2] = matchup.candidates;
    const v1 = votes[c1] || 0;
    const v2 = votes[c2] || 0;
    
    const winner = v1 >= v2 ? c1 : c2;
    const loser = v1 >= v2 ? c2 : c1;
    const winnerVotes = Math.max(v1, v2);
    const loserVotes = Math.min(v1, v2);
    
    resultsSheet.appendRow([
      roundNum,
      matchupId,
      winner,
      loser,
      winnerVotes,
      loserVotes
    ]);
  }
  
  Logger.log(`Round ${roundNum} closed. Results recorded.`);
}

/**
 * Manually close rounds (run from script editor)
 */
function closeRound1() { closeRound(1); }
function closeRound2() { closeRound(2); }
function closeRound3() { closeRound(3); }
function closeRound4() { closeRound(4); }

// ============================================
// SETUP
// ============================================

/**
 * Run this once to set up all sheets
 */
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Votes sheet
  let votesSheet = ss.getSheetByName('Votes');
  if (!votesSheet) {
    votesSheet = ss.insertSheet('Votes');
    votesSheet.appendRow(['Timestamp', 'Email', 'Matchup ID', 'Candidate ID', 'Round']);
    votesSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#ff3333').setFontColor('#ffffff');
  }
  
  // Results sheet
  let resultsSheet = ss.getSheetByName('Results');
  if (!resultsSheet) {
    resultsSheet = ss.insertSheet('Results');
    resultsSheet.appendRow(['Round', 'Matchup', 'Winner', 'Loser', 'Winner Votes', 'Loser Votes']);
    resultsSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#ffd700');
  }
  
  // Contacts sheet
  let contactsSheet = ss.getSheetByName('Contacts');
  if (!contactsSheet) {
    contactsSheet = ss.insertSheet('Contacts');
    contactsSheet.appendRow(['Timestamp', 'Email', 'Name', 'ZIP', 'Opt In', 'Source']);
    contactsSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#00ff88');
  }
  
  Logger.log('All sheets created successfully!');
}

/**
 * Set up automatic round closing triggers
 */
function setupTriggers() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Create triggers for each round end
  ROUNDS.forEach((round, i) => {
    const endDate = new Date(round.end + 'T23:59:59');
    
    ScriptApp.newTrigger('closeRound' + (i + 1))
      .timeBased()
      .at(endDate)
      .create();
  });
  
  Logger.log('Triggers created for round closings');
}

// ============================================
// UTILITIES
// ============================================

/**
 * Get current standings for a round (for admin view)
 */
function getCurrentStandings(roundNum) {
  const matchups = getMatchupsForRound(roundNum);
  const standings = [];
  
  for (const [matchupId, matchup] of Object.entries(matchups)) {
    const votes = getVoteCountsForMatchup(matchupId);
    standings.push({
      matchup: matchupId,
      candidates: matchup.candidates,
      votes: votes,
      total: Object.values(votes).reduce((a, b) => a + b, 0)
    });
  }
  
  return standings;
}

/**
 * Export contacts to CSV format
 */
function exportContacts() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const contactsSheet = ss.getSheetByName('Contacts');
  
  if (!contactsSheet) return 'No contacts found';
  
  const data = contactsSheet.getDataRange().getValues();
  return data.map(row => row.join(',')).join('\n');
}
