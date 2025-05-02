import React, { useState, useEffect, useRef } from 'react';
import Clues from './Clues';
import Options from './Options';
import Feedback from './Feedback';
import Score from './Score';
import ChallengeButton from './ChallengeButton';
import Party from './Party';
import { useUser } from '../UserContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function Game() {
  const { user, setUser, setParty, fetchPartyInfo, logout } = useUser();
  const [destination, setDestination] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const partyUpdateInterval = useRef(null);
  
  // Set up party data refresh
  useEffect(() => {
    console.log("Setting up polling with partyID:", user?.partyID);
    
    if (!user?.partyID) {
      console.log("No party ID available, not setting up polling");
      return;
    }
    
    // Initial fetch on mount
    fetchPartyInfo(user.partyID);
    
    // Create polling function
    const startPolling = () => {
      // Clear any existing interval first
      if (partyUpdateInterval.current) {
        clearInterval(partyUpdateInterval.current);
      }
      
      // Start a new 2-second interval
      partyUpdateInterval.current = setInterval(() => {
        if (user?.partyID) {
          fetchPartyInfo(user.partyID);
        }
      }, 5000);
    };
    
    // Start polling immediately
    startPolling();
    
    // Visibility change handler - stop polling when hidden, restart when visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Immediately fetch fresh data when returning to the tab
        if (user?.partyID) {
          fetchPartyInfo(user.partyID, true); // Use forced=true to bypass cache
        }
        startPolling();
      } else {
        // Stop polling when tab is inactive
        if (partyUpdateInterval.current) {
          clearInterval(partyUpdateInterval.current);
          partyUpdateInterval.current = null;
        }
      }
    };
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup on unmount or dependency change
    return () => {
      if (partyUpdateInterval.current) {
        clearInterval(partyUpdateInterval.current);
        partyUpdateInterval.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.partyID, fetchPartyInfo]); // Only depend on partyID and fetchPartyInfo

  const fetchDestination = async () => {
    setLoading(true);
    setError(null);
    setDestination(null);
    setFeedback(null);
    
    try {
      const response = await fetch(`${API_URL}/api/destinations/random`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setDestination(await response.json());
    } catch (e) {
      console.error("Failed to fetch destination:", e);
      setError("Failed to load game. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestination();
  }, []);

  const handleAnswerSubmit = async (answer) => {
    if (!destination || feedback) return;
    
    // Verify user is authenticated before proceeding
    if (!user || !user.userID) {
      setError("User session expired. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/destinations/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          destinationId: destination.id, 
          userAnswer: answer,
          userID: user.userID
        }),
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      setFeedback(result);
      
      // Update user with returned score
      if (result.updatedScore) {
        setUser(prevUser => ({
          ...prevUser,
          score: result.updatedScore
        }));
        
        // Update in session storage with error handling
        try {
          const storedUser = JSON.parse(sessionStorage.getItem('globetrotter_user'));
          if (storedUser) {
            storedUser.score = result.updatedScore;
            sessionStorage.setItem('globetrotter_user', JSON.stringify(storedUser));
          }
        } catch (storageError) {
          console.error('Failed to update session storage:', storageError);
          // Non-blocking error - won't affect main functionality
        }
      }
      
      // If party data was returned, update party state
      if (result.party) {
        setParty(result.party);
      }
    }
    catch (e) {
      console.error("Failed to check answer:", e);
      setError("Failed to submit answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>Globetrotter</h1>
        {user && (
          <>
            <div className="user-info">
              <p className="username">Playing as: <strong>{user.username}</strong></p>
            </div>
            <div className="score-header">
              <h3>Score</h3>
              <Score score={user.score} />
            </div>
          </>
        )}
        <div className="logout-button">
          <button onClick={logout}>Logout</button>
        </div>
      </div>
      
      <div className="game-content">
        <div className="game-sidebar">
          <Party />
        </div>
        <div className="game-main">
          {loading && !destination && <p>Loading your next destination...</p>}
          
          {destination && (
            <>
              <Clues clues={destination.clues} />
              {!feedback ? (
                <div className="guess-section">
                  <Options
                    options={destination.options}
                    onSelect={handleAnswerSubmit}
                    disabled={loading}
                  />
                </div>
              ) : (
                <div className="feedback-wrapper">
                  <Feedback
                    isCorrect={feedback.correct}
                    funFact={feedback.funFact}
                    correctAnswer={feedback.correctAnswer}
                  />
                </div>
              )}
              {(feedback || error) && (
                <div className="next-button-container">
                  <button className="next-button" onClick={fetchDestination} disabled={loading}>
                    {loading ? 'Loading...' : 'Next Destination'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {user && (
        <div className="game-footer">
          <ChallengeButton />
        </div>
      )}
    </div>
  );
}

export default Game;
