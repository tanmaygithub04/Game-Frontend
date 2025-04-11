import React from 'react';

function Options({ options, onSelect, disabled }) {
  if (!options || options.length === 0) {
    return <p>Loading options...</p>;
  }

  return (
    <div className="options-container">
      <h2>Guess the City:</h2>
      <div className="options-grid">
        {options.map((option, index) => (
          <div key={index} className="option-wrapper">
            <button
              onClick={() => onSelect(option)}
              disabled={disabled}
              className="option-button"
            >
              {option}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Options;
