# Globetrotter - Geography Guessing Game

## Application Documentation & Overview

Globetrotter is an interactive web application designed as a geography guessing game. Users are presented with clues about a specific destination and must guess the correct location from a set of options.
* Link to Backend Github : https://github.com/tanmaygithub04/Game-Backend
* Link to deployed backend  : https://game-backend-505i.onrender.com ( health route : get '/api/health')
* Link to deployed frontend : https://game-frontend-mu.vercel.app/

**Core Features:**

*   **Guessing Game:** Fetches random destinations and associated clues from a backend API. Users submit their guesses and receive immediate feedback, including fun facts about the location.
*   **User Registration:** Users can register with a username to track their progress and participate in challenges. User sessions are maintained using Session Storage.
*   **Scoring:** The application tracks the number of correct and incorrect guesses for registered users.
*   **Party & Challenge System:**
    *   Users can initiate a challenge, generating a unique shareable link.
    *   Other users can join the challenger's "party" via this link.
    *   A party view displays the members currently playing together, with scores updated periodically.
*   **Social Sharing:** Users can share their scores and challenge links on platforms like WhatsApp.


## Tech Stack

*   **Frontend:** React.js
*   **State Management**: Context API with custom hooks
*   **Styling:** CSS3 (`App.css`, component-specific styles implied)
*   **API Communication:** Fetch API
*   **Frontend Libraries:**
    *   `react-icons`: For UI icons.
    *   `html2canvas`: For generating score images.
*   **Backend:** External REST API hosted at `https://game-backend-505i.onrender.com` (Specific backend technology is not determined from the frontend codebase).
*   **Data Storage**: In-memory Maps for user sessions and party management
*   **API Design**: RESTful endpoints for game mechanics, user management, and social features
*   **State Persistence**: Session-based with challenge link sharing capabilities

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


## Technical Challenges Faced & Solutions

1.  **Challenge:** Managing user state (authentication, score, party details) consistently across different components.
    *   **Solution:** Implemented React's Context API (`UserContext`) to create a centralized store for user-related data and actions, accessible throughout the component tree.

2.  **Challenge:** Handling asynchronous API calls for fetching data, submitting answers, and user registration without blocking the UI and providing user feedback.
    *   **Solution:** Utilized `async/await` with the `fetch` API. Implemented `loading` states to show indicators during requests and `error` states to display informative messages if APIs fail.

3.  **Challenge:** Providing near real-time updates for the party view when multiple users are playing together.
    *   **Solution:** Implemented a polling mechanism using `setInterval` in the `Game` component to periodically fetch updated party information from the backend. Optimized by pausing polling when the browser tab is inactive using the Page Visibility API.

4.  **Challenge:** Preventing duplicate or unnecessary API requests, such as multiple registration attempts or rapid fetching of party data.
    *   **Solution:** Employed `useRef` hooks (`pendingRequest`, `registrationInProgress`) as flags to track ongoing API calls and prevent concurrent requests for the same resource. Added a simple time-based cache (5-second cooldown) for party info fetching.

5.  **Challenge:** Persisting user sessions only for the duration of the active browser tab/session.
    *   **Solution:** Leveraged `sessionStorage` to store user data. This ensures the user remains logged in across page refreshes within the same tab but requires re-authentication upon closing the tab or browser. Added logic on component mount to check `sessionStorage` and restore the session if applicable.

6.  **Challenge:** Creating a visually appealing and easily shareable summary of a user's game score.
    *   **Solution:** Integrated the `html2canvas` library within the `ChallengeButton` component to dynamically generate an image representation of the user's score card, which can then be shared.

7.  **Challenge:** Enabling users to join a specific game/party directly via a shared link.
    *   **Solution:** Implemented logic to parse URL query parameters (`URLSearchParams`) upon application load. If a `challenge` ID is present, the application triggers the `joinParty` flow instead of the standard user registration.


## Setup and Running the Project

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory (`frontend`) and add the backend API URL:
    ```env
    REACT_APP_API_URL=https://game-backend-505i.onrender.com
    ```
4.  **Start the development server:**
    ```bash
    npm start
    ```
    The application should now be running on `http://localhost:3000` (or another port if 3000 is busy).
 
