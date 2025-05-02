import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create context
const UserContext = createContext();

// Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [challengeUser, setChallengeUser] = useState(null);
  const [party, setParty] = useState(null);
  
  // Refs to track pending requests and registration state
  const pendingRequests = useRef({
    registration: false,
    partyFetch: false,
    userFetch: false,
    general: false
  });
  const registrationInProgress = useRef(false);
  const activeFetchTimeout = useRef(null);
  const partyCache = useRef({});
  const partyRetryCount = useRef({});
  
  // Check for session and userID in URL on initial mount
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const initializeUser = async () => {
      setLoading(true); // Ensure loading is true during init
      let restoredUser = null;

      // 1. Try restoring user from sessionStorage
      try {
        const storedUser = sessionStorage.getItem('globetrotter_user');
        if (storedUser) {
          restoredUser = JSON.parse(storedUser);
          console.log("Restored user from session:", restoredUser);
          if (isMounted) {
            setUser(restoredUser); // Set user state immediately
          }
        }
      } catch (e) {
        console.error("Failed to parse stored user data", e);
        sessionStorage.removeItem('globetrotter_user');
      }

      // 2. Check for userID in URL
      const urlParams = new URLSearchParams(window.location.search);
      const userID = urlParams.get('userID');

      // Fetch user info if userID is in URL and no user was restored
      if (userID && !restoredUser) {
         try {
           await fetchUserInfo(userID);
         } catch(e) {
            console.error("Error fetching user info during init:", e);
         }
      }

      // 3. Finalize loading state
      if (isMounted) {
        setLoading(false);
      }
    };

    initializeUser();

    // Cleanup function
    return () => {
      isMounted = false;
      if (activeFetchTimeout.current) {
        clearTimeout(activeFetchTimeout.current);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const registerUser = useCallback(async (username) => {
    // Prevent multiple registration attempts
    if (registrationInProgress.current) {
      console.log('Registration already in progress, skipping');
      return user;
    }
    
    registrationInProgress.current = true;
    pendingRequests.current.registration = true;
    setLoading(true);
    setError(null);
    
    try {
      // Get userID from URL if it exists
      const urlParams = new URLSearchParams(window.location.search);
      const userID = urlParams.get('userID');
      
      // If there's a userID, join that party instead of registering normally
      if (userID) {
        const result = await joinParty(username, userID);
        return result;
      }
      
      // Check if we already have this user registered *IN THE CURRENT CONTEXT*
      // This check is now more reliable as the context might be pre-populated from session
      if (user && user.username === username) {
        console.log("User already registered in context:", username);
        registrationInProgress.current = false; // Ensure flag is reset
        // Optionally fetch updated user data here if needed, or just return existing user
        return user;
      }
      
      // Regular registration
      console.log("Registering user:", username);
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to register user');
      }
      
      const userData = await response.json();
      console.log("Registration successful:", userData);
      
      // Update user state with new data
      const newUser = {
        userID: userData.userID,
        username: userData.username,
        score: userData.score,
        partyID: userData.partyID
      };
      
      setUser(newUser);
      
      // Update party data if present (only if different from current)
      if (userData.party && (!party || JSON.stringify(userData.party) !== JSON.stringify(party))) {
        setParty(userData.party);
      }
      
      // Store in session storage
      sessionStorage.setItem('globetrotter_user', JSON.stringify(userData));
      return userData;
    } catch (e) {
      console.error("Registration error:", e);
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
      registrationInProgress.current = false;
      pendingRequests.current.registration = false;
    }
  }, [user, party]);

  const joinParty = async (username, userID) => {
    if (pendingRequests.current.general) {
      console.log('Request already in progress, skipping join party');
      return null;
    }
    
    pendingRequests.current.general = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Joining party with username: ${username}, userID: ${userID}`);
      
      // Get the party creator's info
      const userResponse = await fetch(`${API_URL}/api/users/${userID}`);
      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error || 'User not found');
      }
      
      const userData = await userResponse.json();
      
      if (!userData.partyID) {
        throw new Error('No party found for this user');
      }
      
      // Register the user with the party ID
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username,
          partyID: userData.partyID
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join party');
      }
      
      const newUserData = await response.json();
      console.log("Successfully joined party:", newUserData);
      
      // Update user state with new data
      const newUser = {
        userID: newUserData.userID, 
        username: newUserData.username, 
        score: newUserData.score, 
        partyID: newUserData.partyID
      };
      
      setUser(newUser);
      
      // Update party data if present (only if different from current)
      if (newUserData.party && (!party || JSON.stringify(newUserData.party) !== JSON.stringify(party))) {
        setParty(newUserData.party);
      }
      
      // Store in session storage
      sessionStorage.setItem('globetrotter_user', JSON.stringify(newUserData));
      return newUserData;
    } catch (e) {
      console.error("Party join error:", e);
      setError(e.message || 'Failed to join party');
      throw e;
    } finally {
      setLoading(false);
      pendingRequests.current.general = false;
    }
  };

  const fetchUserInfo = async (userID) => {
    if (pendingRequests.current.userFetch) {
      console.log('User fetch already in progress, skipping');
      return null;
    }
    
    pendingRequests.current.userFetch = true;
    
    try {
      console.log("Fetching user info for userID:", userID);
      const response = await fetch(`${API_URL}/api/users/${userID}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("User fetch error response:", errorData);
        throw new Error(errorData.error || 'User not found');
      }
      
      const userData = await response.json();
      console.log("User data:", userData);
      
      // Only update if different from current
      if (!challengeUser || userData.userID !== challengeUser.userID || 
          JSON.stringify(userData.score) !== JSON.stringify(challengeUser.score)) {
        setChallengeUser(userData);
      }
      
      // Store party data if present and different from current
      if (userData.party && (!party || JSON.stringify(userData.party) !== JSON.stringify(party))) {
        setParty(userData.party);
      } 
      
      // If the user has a partyId but no party data, fetch it
      if (userData.partyID && !userData.party) {
        try {
          await fetchPartyInfo(userData.partyID, true); // Force fetch the party info
        } catch (e) {
          console.error("Failed to fetch party after getting user info:", e);
        }
      }
      
      return userData;
    } catch (e) {
      console.error("Failed to fetch user info:", e);
      setError(e.message || "Failed to fetch user");
      return null;
    } finally {
      pendingRequests.current.userFetch = false;
    }
  };

  const fetchPartyInfo = useCallback(async (partyID, forced = false) => {
    if (!partyID) return null;
    
    // Simple caching mechanism to prevent too frequent requests
    const now = Date.now();
    const lastFetchTime = partyCache.current[partyID] || 0;
    const timeSinceLastFetch = now - lastFetchTime;
    
    // Only fetch if it's been more than 1800ms since the last fetch (adjusted from 2000ms)
    // or if forced=true parameter is passed
    if (timeSinceLastFetch < 1800 && !forced) {
      console.log(`Skipping party fetch - last fetch was ${timeSinceLastFetch}ms ago`);
      return party;
    }
    
    // Prevent concurrent party fetch requests
    if (pendingRequests.current.partyFetch) {
      console.log('Party fetch already in progress, skipping');
      return party;
    }
    
    pendingRequests.current.partyFetch = true;
    
    try {
      console.log("Fetching party info for partyID:", partyID);
      const response = await fetch(`${API_URL}/api/parties/${partyID}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Party fetch error response:", errorData);
        throw new Error(errorData.error || 'Failed to fetch party info');
      }
      
      const partyData = await response.json();
      
      // Only update party state if data has changed
      const partyDataString = JSON.stringify(partyData);
      const currentPartyString = party ? JSON.stringify(party) : null;
      
      if (!party || partyDataString !== currentPartyString) {
        console.log("Party info updated:", partyData);
        setParty(partyData);
      } else {
        console.log("Party info unchanged, no update needed");
      }
      
      // Update cache timestamp and reset retry count on success
      partyCache.current[partyID] = now;
      partyRetryCount.current[partyID] = 0;
      
      return partyData;
    } catch (e) {
      console.error("Failed to fetch party info:", e);
      setError(e.message || "Failed to fetch party info");
      
      // Implement exponential backoff retry logic
      const currentRetry = partyRetryCount.current[partyID] || 0;
      if (currentRetry < 3) { // Maximum 3 retries
        const retryDelay = Math.pow(2, currentRetry) * 500; // 500ms, 1s, 2s
        console.log(`Scheduling retry ${currentRetry + 1} in ${retryDelay}ms`);
        
        // Increment retry count
        partyRetryCount.current[partyID] = currentRetry + 1;
        
        // Schedule retry
        activeFetchTimeout.current = setTimeout(() => {
          pendingRequests.current.partyFetch = false; // Reset lock before retry
          fetchPartyInfo(partyID, true); // Force bypass cache on retry
        }, retryDelay);
      } else {
        console.warn(`Max retry attempts (${currentRetry}) reached for party ${partyID}`);
        // Reset retry count after max attempts to allow future polling to work
        partyRetryCount.current[partyID] = 0;
      }
      
      return null;
    } finally {
      // Only reset flag if we're not scheduling a retry
      if (!activeFetchTimeout.current) {
        pendingRequests.current.partyFetch = false;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally removing party dependency to avoid circular reference

  const logout = () => {
    setUser(null);
    setParty(null);
    setChallengeUser(null);
    sessionStorage.removeItem('globetrotter_user');
    
    // Remove userID param from URL
    const url = new URL(window.location);
    url.searchParams.delete('userID');
    window.history.replaceState({}, '', url);
    
    // Clear any pending timeouts
    if (activeFetchTimeout.current) {
      clearTimeout(activeFetchTimeout.current);
      activeFetchTimeout.current = null;
    }
    
    // Reset all pending request flags
    pendingRequests.current = {
      registration: false,
      partyFetch: false,
      userFetch: false,
      general: false
    };
  };

  const generateShareUrl = () => {
    if (!user) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}?userID=${user.userID}`;
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      loading, 
      error, 
      challengeUser,
      party,
      registerUser,
      joinParty,
      fetchPartyInfo,
      logout,
      generateShareUrl,
      fetchUserInfo,
      setUser,
      setParty
    }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for using the context
export const useUser = () => useContext(UserContext);

export default UserContext; 