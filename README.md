
# Globetrotter: Technical Documentation

## System Architecture

Globetrotter employs a classic client-server architecture with modern React frontend and Express backend:

### Frontend (React.js)
- **State Management**: Context API with custom hooks
- **Component Structure**: Functional components with React hooks
- **Network**: Optimized fetch API calls with throttling, caching, and visibility detection
- **Performance**: Conditional rendering and memoization techniques

### Backend (Express.js)
- **Data Storage**: In-memory Maps for user sessions and party management
- **API Design**: RESTful endpoints for game mechanics, user management, and social features
- **State Persistence**: Session-based with challenge link sharing capabilities

## Technical Implementation Highlights

### 1. Adaptive Polling with Visibility API
```javascript
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (user?.partyId) fetchPartyInfo(user.partyId);
    startPolling();
  } else {
    stopPolling();
  }
});
```

### 2. Request Throttling & Cache Implementation
```javascript
// Simple caching mechanism with timestamp validation
const now = Date.now();
const lastFetchTime = partyCache.current[partyId] || 0;
const timeSinceLastFetch = now - lastFetchTime;

if (timeSinceLastFetch < 5000 && !forced) {
  console.log(`Skipping party fetch - last fetch was ${timeSinceLastFetch}ms ago`);
  return party;
}
```

### 3. Cryptographic Challenge Generation
```javascript
const challengeId = crypto.randomBytes(8).toString('hex');
```

### 4. Two-Phase Party Joining Protocol
```javascript
// First get the party creator's info
const challengeResponse = await fetch(`${API_URL}/api/users/challenge/${challengeId}`);
// Then register with the party ID
const response = await fetch(`${API_URL}/api/users/register`, {/*...*/});
```

## API Endpoints

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/api/destinations/random` | GET | Fetches randomized geography question | None |
| `/api/destinations/answer` | POST | Validates user answer | `destinationId`, `userAnswer` |
| `/api/users/register` | POST | Creates/retrieves user | `username`, `partyId` (optional) |
| `/api/users/challenge/:challengeId` | GET | Retrieves challenge info | `challengeId` in URL |
| `/api/parties/:partyId` | GET | Gets party information | `partyId` in URL |
| `/api/users/:username/score` | PUT | Updates user score | `correct` (boolean) |

## Performance Optimizations

1. **Reduced Network Traffic**: 
   - Polling frequency reduced from 5s → 10s
   - Request throttling with 5s window
   - Page visibility integration

2. **Error Handling & Fault Tolerance**:
   - Comprehensive error middleware
   - JSON error responses
   - Request retry mechanism

3. **Memory Management**:
   - Reference cleanup in component unmounting
   - Timeout/interval management
   - Concurrent request prevention

## Code Organization

```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Game.js       # Main game logic
│   │   │   ├── Options.js    # Answer selection interface
│   │   │   ├── Party.js      # Multiplayer interface
│   │   │   └── ...
│   │   ├── UserContext.js    # Auth & session management
│   │   └── ...
└── backend/
    ├── server.js             # Express server & API endpoints
    └── data.json             # Geography quiz data
```

This architecture follows separation of concerns and modern React practices while maintaining a lightweight footprint appropriate for a geography quiz game.
