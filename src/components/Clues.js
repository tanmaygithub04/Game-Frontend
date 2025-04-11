import React from 'react';

function Clues({ clues }) {
  if (!clues || clues.length === 0) {
    return <p>Loading clues...</p>;
  }

  return (
    <div className="clues-container">
      <h2>Clues:</h2>
      <ul>
        {clues.map((clue, index) => (
          <li key={index}>{clue}</li>
        ))}
      </ul>
    </div>
  );
}

export default Clues;
