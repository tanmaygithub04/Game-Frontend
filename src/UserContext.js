import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create context
const UserContext = createContext();

// Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [challengeUser, setChallengeUser] = useState(null);
  const [party, setParty] = useState(null);
  
  // Refs to track pending requests and registration state
  const pendingRequest = useRef(false);
  const registrationInProgress = useRef(false);
  const activeFetchTimeout = useRef(null);
  const partyCache = useRef({});
  
  // Check for challenge in URL
  useEffect(() => {
    // Only check for challenge, don't restore user from localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const challengeId = urlParams.get('challenge');
    if (challengeId) {
      fetchChallengeUser(challengeId);
    }
    
    // Clean up any active intervals/timeouts on unmount
    return () => {
      if (activeFetchTimeout.current) {
        clearTimeout(activeFetchTimeout.current);
      }
    };
  }, []);

  const registerUser = useCallback(async (username) => {
    // Prevent multiple registration attempts
    if (registrationInProgress.current) {
      console.log('Registration already in progress, skipping');
      return user;
    }
    
    registrationInProgress.current = true;
    setLoading(true);
    setError(null);
    
    try {
      // Get challengeId from URL if it exists
      const urlParams = new URLSearchParams(window.location.search);
      const challengeId = urlParams.get('challenge');
      
      // If there's a challenge ID, join that party instead of registering normally
      if (challengeId) {
        const result = await joinParty(username, challengeId);
        registrationInProgress.current = false;
        return result;
      }
      
      // Check if we already have this user registered
      if (user && user.username === username) {
        console.log("User already registered:", username);
        registrationInProgress.current = false;
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
      setUser(userData);
      
      // Update party data if present
      if (userData.party) {
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
    }
  }, [user]);

  const joinParty = async (username, challengeId) => {
    if (pendingRequest.current) {
      console.log('Request already in progress, skipping');
      return null;
    }
    
    pendingRequest.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Joining party with username: ${username}, challengeId: ${challengeId}`);
      
      // First get the party creator's info
      const challengeResponse = await fetch(`${API_URL}/api/users/challenge/${challengeId}`);
      if (!challengeResponse.ok) {
        const errorData = await challengeResponse.json();
        throw new Error(errorData.error || 'Challenge not found');
      }
      
      const challengeData = await challengeResponse.json();
      if (!challengeData.party?.id) {
        throw new Error('No party found for this challenge');
      }
      
      // Then register the user with the party ID
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username,
          partyId: challengeData.party.id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join party');
      }
      
      const userData = await response.json();
      console.log("Successfully joined party:", userData);
      setUser(userData);
      
      if (userData.party) {
        setParty(userData.party);
      }
      
      sessionStorage.setItem('globetrotter_user', JSON.stringify(userData));
      return userData;
    } catch (e) {
      console.error("Party join error:", e);
      setError(e.message || 'Failed to join party');
      throw e;
    } finally {
      setLoading(false);
      pendingRequest.current = false;
    }
  };

  const fetchChallengeUser = async (challengeId) => {
    if (pendingRequest.current) {
      console.log('Request already in progress, skipping challenge user fetch');
      return null;
    }
    
    pendingRequest.current = true;
    
    try {
      console.log("Fetching challenge user for challengeId:", challengeId);
      const response = await fetch(`${API_URL}/api/users/challenge/${challengeId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Challenge fetch error response:", errorData);
        throw new Error(errorData.error || 'Challenge not found');
      }
      
      const userData = await response.json();
      console.log("Challenge user data:", userData);
      setChallengeUser(userData);
      
      // Store party data if present
      if (userData.party) {
        setParty(userData.party);
      }
      
      return userData;
    } catch (e) {
      console.error("Failed to fetch challenge user:", e);
      setError(e.message || "Failed to fetch challenge");
      return null;
    } finally {
      pendingRequest.current = false;
    }
  };

  // Use useCallback to prevent unnecessary re-renders
  const fetchPartyInfo = useCallback(async (partyId, forced = false) => {
    if (!partyId) return null;
    
    // Simple caching mechanism to prevent too frequent requests
    const now = Date.now();
    const lastFetchTime = partyCache.current[partyId] || 0;
    const timeSinceLastFetch = now - lastFetchTime;
    
    // Only fetch if it's been more than 5 seconds since the last fetch for this party
    // unless forced is true
    if (timeSinceLastFetch < 5000 && !forced) {
      console.log(`Skipping party fetch - last fetch was ${timeSinceLastFetch}ms ago`);
      return party;
    }
    
    // Prevent concurrent requests
    if (pendingRequest.current) {
      return null;
    }
    
    pendingRequest.current = true;
    
    try {
      console.log("Fetching party info for partyId:", partyId);
      const response = await fetch(`${API_URL}/api/parties/${partyId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Party fetch error response:", errorData);
        throw new Error(errorData.error || 'Failed to fetch party info');
      }
      
      const partyData = await response.json();
      console.log("Party info:", partyData);
      setParty(partyData);
      
      // Update cache timestamp
      partyCache.current[partyId] = now;
      
      return partyData;
    } catch (e) {
      console.error("Failed to fetch party info:", e);
      setError(e.message || "Failed to fetch party info");
      return null;
    } finally {
      pendingRequest.current = false;
    }
  }, [party]);

  const updateUserScore = async (username, correct) => {
    if (!username) return;
    
    // Prevent concurrent requests
    if (pendingRequest.current) {
      // Schedule a retry after a short delay
      activeFetchTimeout.current = setTimeout(() => {
        updateUserScore(username, correct);
      }, 1000);
      return;
    }
    
    pendingRequest.current = true;
    
    try {
      const response = await fetch(`${API_URL}/api/users/${username}/score`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correct }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Score update error:", errorData);
        throw new Error(errorData.error || 'Failed to update score');
      }
      
      const responseData = await response.json();
      
      setUser(prevUser => {
        if (!prevUser) return null;
        
        const updatedUser = {
          ...prevUser,
          score: responseData.score
        };
        // Update in session storage
        sessionStorage.setItem('globetrotter_user', JSON.stringify(updatedUser));
        return updatedUser;
      });
      
      // Update party data if it was returned
      if (responseData.party) {
        setParty(responseData.party);
      } else if (user && user.partyId) {
        // If party data wasn't returned but user is in a party, fetch latest party info
        // Schedule it with a small delay to avoid race conditions
        activeFetchTimeout.current = setTimeout(() => {
          fetchPartyInfo(user.partyId);
        }, 500);
      }
    } catch (e) {
      console.error("Failed to update score:", e);
    } finally {
      pendingRequest.current = false;
    }
  };

  const logout = () => {
    setUser(null);
    setParty(null);
    setChallengeUser(null);
    sessionStorage.removeItem('globetrotter_user');
    
    // Remove challenge param from URL
    const url = new URL(window.location);
    url.searchParams.delete('challenge');
    window.history.replaceState({}, '', url);
    
    // Clear any pending timeouts
    if (activeFetchTimeout.current) {
      clearTimeout(activeFetchTimeout.current);
    }
  };

  const generateShareUrl = () => {
    if (!user) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}?challenge=${user.challengeId}`;
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
      updateUserScore, 
      fetchPartyInfo,
      logout,
      generateShareUrl
    }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for using the context
export const useUser = () => useContext(UserContext);

export default UserContext; 