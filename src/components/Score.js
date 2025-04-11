import React from 'react';

function Score({ score }) {
  return (
    <div className="score-container">
      <div className="score-item">
        <div className="score-value">{score.correct}</div>
        <div className="score-label">Correct</div>
      </div>
      <div className="score-item">
        <div className="score-value">{score.incorrect}</div>
        <div className="score-label">Incorrect</div>
      </div>
    </div>
  );
}

export default Score;
