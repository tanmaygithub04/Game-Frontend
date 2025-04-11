import React, { useState } from 'react';
import { useUser } from '../UserContext';
import { FaTrophy, FaUsers, FaUserAlt } from 'react-icons/fa';

function UserRegistration() {
  const [username, setUsername] = useState('');
  const { registerUser, loading, error, challengeUser, party } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.trim().length === 0) return;
    try {
      await registerUser(username.trim());
    } catch (err) {
      // Error is handled in the context
    }
  };

  // Create a message based on whether we're joining a party or creating a new one
  const getMessage = () => {
    if (challengeUser) {
      if (party && party.members && party.members.length > 1) {
        return (
          <div className="challenge-info">
            <h3><FaUsers /> Join the Party!</h3>
            <p>You've been invited to join <strong>{challengeUser.username}</strong>'s party!</p>
            <p>Currently {party.members.length} players in this game.</p>
            <div className="party-preview">
              {party.members.slice(0, 3).map((member, index) => (
                <div key={index} className="preview-member">
                  <FaUserAlt className="user-icon" />
                  <span>{member.username}</span>
                  <span className="member-score-preview">
                    {member.score.correct} ✓
                  </span>
                </div>
              ))}
              {party.members.length > 3 && (
                <div className="more-members">
                  +{party.members.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
      } else {
        return (
          <div className="challenge-info">
            <h3><FaTrophy /> Challenge Accepted?</h3>
            <p>You've been challenged by <strong>{challengeUser.username}</strong>!</p>
            <p>They have correctly answered {challengeUser.score.correct} questions.</p>
            <p>Can you beat their score?</p>
          </div>
        );
      }
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