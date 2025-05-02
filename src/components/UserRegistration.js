import React, { useState } from 'react';
import { useUser } from '../UserContext';
import { FaTrophy } from 'react-icons/fa';

function UserRegistration() {
  const [username, setUsername] = useState('');
  const { registerUser, loading, error, challengeUser } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Trim once and store for efficiency
    const trimmedUsername = username.trim();
    if (trimmedUsername.length === 0) return;
    
    try {
      await registerUser(trimmedUsername);
      // On success, UserContext updates user state which triggers App.js to show Game component
    } catch (err) {
      // Error is already handled in the context via setError() - displayed below
    }
  };

  // Create a message based on whether we're joining a party or creating a new one
  const getMessage = () => {
    if (challengeUser) {
      return (
        <div className="challenge-info">
          <h3><FaTrophy /> Challenge Accepted?</h3>
          <p>You've been challenged by <strong>{challengeUser.username}</strong>!</p>
          <p>They have correctly answered {challengeUser.score.correct} questions.</p>
          <p>Can you beat their score?</p>
        </div>
      );
    } else {
      return (
        <p>Enter your username to start the game:</p>
      );
    }
  };

  return (
    <div className="user-registration">
      <h2>Welcome to Globetrotter!</h2>
      
      {getMessage()}
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your username"
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading || username.trim().length === 0}>
          {loading ? 'Loading...' : challengeUser ? 'Join Game' : 'Start Playing'}
        </button>
      </form>
      
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default UserRegistration; 