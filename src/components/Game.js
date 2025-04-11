import React, { useState, useEffect } from 'react';
import Clues from './Clues';
import Options from './Options';
import Feedback from './Feedback';
import Score from './Score';
import ChallengeButton from './ChallengeButton';
import Party from './Party';
import { useUser } from '../UserContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function Game() {
  const { user, registerUser, updateUserScore, party, fetchPartyInfo } = useUser();
  const [destination, setDestination] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check for existing session only once on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedUser = sessionStorage.getItem('globetrotter_user');
      if (storedUser && !user) {
        try {
          const userData = JSON.parse(storedUser);
          await registerUser(userData.username);
        } catch (e) {
          console.error("Failed to parse stored user data", e);
          sessionStorage.removeItem('globetrotter_user');
        }
      }
    };
    
    checkSession();
  }, [registerUser, user]);

  // Set up party data refresh
  useEffect(() => {
    if (!user?.partyId) return;
    
    fetchPartyInfo(user.partyId);
    
    let partyUpdateInterval;
    const startPolling = () => {
      if (partyUpdateInterval) clearInterval(partyUpdateInterval);
      partyUpdateInterval = setInterval(() => {
        if (user?.partyId) fetchPartyInfo(user.partyId);
      }, 10000);
    };
    
    const stopPolling = () => {
      if (partyUpdateInterval) {
        clearInterval(partyUpdateInterval);
        partyUpdateInterval = null;
      }
    };
    
    startPolling();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (user?.partyId) fetchPartyInfo(user.partyId);
        startPolling();
      } else {
        stopPolling();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, fetchPartyInfo]);

  const fetchDestination = async () => {
    setLoading(true);
    setError(null);
    setDestination(null);
    setSelectedAnswer(null);
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

    setSelectedAnswer(answer);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/destinations/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationId: destination.id, userAnswer: answer }),
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      setFeedback(result);
      
      if (user) {
        updateUserScore(user.username, result.correct);
      }
    } catch (e) {
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
      </div>
      
      <div className="game-content">
        {party?.members && (
          <div className="game-sidebar">
            <Party />
          </div>
        )}
        
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
                    selectedAnswer={selectedAnswer}
                  />
                </div>
              ) : (
                <div className="feedback-wrapper">
                  <Feedback
                    isCorrect={feedback.correct}
                    funFact={feedback.funFact}
                    correctAnswer={feedback.correctAnswer}
                    selectedAnswer={selectedAnswer}
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
