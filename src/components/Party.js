import React from 'react';
import { useUser } from '../UserContext';
import { FaMedal, FaUserFriends, FaTrophy } from 'react-icons/fa';

function Party() {
  const { party, user } = useUser();

  if (!party || !party.members) {
    return (
      <div className="party-container">
        <h3 className="party-title">
          <FaUserFriends /> Party Players
        </h3>
        <div className="party-empty">
          <p>Waiting for players to join...</p>
          <p>Share your game link to invite friends!</p>
        </div>
      </div>
    );
  }

  // Sort party members by correct answers in descending order
  const sortedMembers = [...party.members].sort((a, b) => {
    // First compare by correct answers
    if (b.score.correct !== a.score.correct) {
      return b.score.correct - a.score.correct;
    }
    // If tied, sort by least incorrect answers
    return a.score.incorrect - b.score.incorrect;
  });


  return (
    <div className="party-container">
      <h3 className="party-title">
        <FaUserFriends /> Party Players
      </h3>
      
      <div className="party-members">
        {sortedMembers.map((member, index) => {
          const isCurrentUser = member.username === user?.username;
          const isCreator = party.createdBy === member.username;
          
          // Determine medal for top 3 positions
          let medal = null;
          if (index === 0) medal = <FaTrophy className="gold-medal" />;
          else if (index === 1) medal = <FaMedal className="silver-medal" />;
          else if (index === 2) medal = <FaMedal className="bronze-medal" />;
          
          return (
            <div 
              key={`${member.username}-${member.score.correct}-${member.score.incorrect}`} 
              className={`party-member ${isCurrentUser ? 'current-user' : ''}`}
            >
              <div className="member-name">
                {medal && <span className="medal">{medal}</span>}
                <span className="rank">#{index + 1}</span>
                <span className="name">{member.username}</span>
                {isCreator && <span className="creator-tag">👑</span>}
                {isCurrentUser && <span className="user-tag">you</span>}
              </div>
              <div className="member-score">
                <span className="score-value correct">{member.score.correct} correct</span>
                <span className="score-value incorrect">{member.score.incorrect} incorrect</span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="party-footer">
        Players: {party.members.length}
      </div>
    </div>
  );
}

export default Party; 