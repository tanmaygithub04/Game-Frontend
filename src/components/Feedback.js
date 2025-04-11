import React, { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';

function Feedback({ isCorrect, funFact, correctAnswer }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const containerRef = useRef(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0
  });

  useEffect(() => {
    // Set confetti to show immediately if answer is correct
    if (isCorrect) {
      setShowConfetti(true);
      // Turn off confetti after 3 seconds
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isCorrect]);

  useEffect(() => {
    if (containerRef.current) {
      const updateDimensions = () => {
        const { width, height, top, left } = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width, height, top, left });
      };
      
      // Initial measurement
      updateDimensions();
      
      // Update dimensions on window resize
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, [containerRef]);

  return (
    <div 
      ref={containerRef}
      className={`feedback-container ${isCorrect ? 'correct' : 'incorrect'}`}
    >
      {showConfetti && (
        <div className="confetti-container">
          <Confetti
            width={containerDimensions.width}
            height={containerDimensions.height}
            recycle={false}
            numberOfPieces={400}
            gravity={0.5}
            initialVelocityY={15}
            tweenDuration={100}
            confettiSource={{
              x: containerDimensions.width / 2,
              y: 0,
              w: 0,
              h: 0
            }}
            colors={['#f44336', '#2196f3', '#ffeb3b', '#4caf50', '#9c27b0', '#ff9800']}
          />
        </div>
      )}
      
      <div className="feedback-content">
        {isCorrect ? (
          <div className="correct-answer">
            <h2>🎉 Correct! 🎉</h2>
          </div>
        ) : (
          <div className="incorrect-answer">
            <h2>😢 Oops! Not quite right.</h2>
            <p>The correct answer was: <strong>{correctAnswer}</strong></p>
          </div>
        )}
        
        <div className="fun-fact">
          <h3>Fun Fact:</h3>
          <p>{funFact}</p>
        </div>
      </div>
    </div>
  );
}

export default Feedback;
