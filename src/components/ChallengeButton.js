import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { useUser } from '../UserContext';
import { FaWhatsapp, FaCopy, FaTimes, FaShareAlt } from 'react-icons/fa';

function ChallengeButton() {
  const { user, generateShareUrl } = useUser();
  const [showShare, setShowShare] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [shareImage, setShareImage] = useState(null);
  
  const handleChallengeClick = async () => {
    setShowShare(true);
    setGeneratingImage(true);
    
    try {
      // Instead of capturing the entire game container, create a custom game summary card
      const scoreCard = createScoreCard();
      const canvas = await html2canvas(scoreCard, {
        scale: 2,
        backgroundColor: '#f0f8ff',
        logging: false,
        allowTaint: true,
        useCORS: true
      });
      
      document.body.removeChild(scoreCard);
      const imageUrl = canvas.toDataURL('image/png');
      setShareImage(imageUrl);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setGeneratingImage(false);
    }
  };

  // Create a custom score card for sharing
  const createScoreCard = () => {
    const card = document.createElement('div');
    card.style.width = '500px';
    card.style.padding = '20px';
    card.style.backgroundColor = 'white';
    card.style.borderRadius = '12px';
    card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'center';
    card.style.fontFamily = 'Arial, sans-serif';
    card.style.position = 'absolute';
    card.style.left = '-9999px';
    
    // Heading
    const heading = document.createElement('h2');
    heading.textContent = 'Globetrotter Challenge';
    heading.style.color = '#3498db';
    heading.style.marginBottom = '15px';
    card.appendChild(heading);
    
    // User info
    const userInfo = document.createElement('div');
    userInfo.textContent = `${user.username}'s Score`;
    userInfo.style.fontSize = '18px';
    userInfo.style.fontWeight = 'bold';
    userInfo.style.marginBottom = '15px';
    card.appendChild(userInfo);
    
    // Score display
    const scoreContainer = document.createElement('div');
    scoreContainer.style.display = 'flex';
    scoreContainer.style.gap = '20px';
    scoreContainer.style.marginBottom = '15px';
    
    // Correct answers
    const correctContainer = document.createElement('div');
    correctContainer.style.padding = '15px 25px';
    correctContainer.style.backgroundColor = '#e8f8f5';
    correctContainer.style.borderRadius = '10px';
    correctContainer.style.textAlign = 'center';
    
    const correctScore = document.createElement('div');
    correctScore.textContent = user.score.correct;
    correctScore.style.fontSize = '32px';
    correctScore.style.fontWeight = 'bold';
    correctScore.style.color = '#27ae60';
    
    const correctLabel = document.createElement('div');
    correctLabel.textContent = 'Correct';
    correctLabel.style.color = '#7f8c8d';
    
    correctContainer.appendChild(correctScore);
    correctContainer.appendChild(correctLabel);
    
    // Incorrect answers
    const incorrectContainer = document.createElement('div');
    incorrectContainer.style.padding = '15px 25px';
    incorrectContainer.style.backgroundColor = '#fdedec';
    incorrectContainer.style.borderRadius = '10px';
    incorrectContainer.style.textAlign = 'center';
    
    const incorrectScore = document.createElement('div');
    incorrectScore.textContent = user.score.incorrect;
    incorrectScore.style.fontSize = '32px';
    incorrectScore.style.fontWeight = 'bold';
    incorrectScore.style.color = '#e74c3c';
    
    const incorrectLabel = document.createElement('div');
    incorrectLabel.textContent = 'Incorrect';
    incorrectLabel.style.color = '#7f8c8d';
    
    incorrectContainer.appendChild(incorrectScore);
    incorrectContainer.appendChild(incorrectLabel);
    
    scoreContainer.appendChild(correctContainer);
    scoreContainer.appendChild(incorrectContainer);
    card.appendChild(scoreContainer);
    
    // Challenge text
    const challenge = document.createElement('p');
    challenge.textContent = 'Can you beat my score? Click the link to try!';
    challenge.style.textAlign = 'center';
    challenge.style.marginBottom = '10px';
    card.appendChild(challenge);
    
    // Trophy icon
    const trophy = document.createElement('div');
    trophy.innerHTML = '🏆';
    trophy.style.fontSize = '40px';
    trophy.style.marginBottom = '10px';
    card.appendChild(trophy);
    
    document.body.appendChild(card);
    return card;
  };

  const handleClose = () => {
    setShowShare(false);
    setShareImage(null);
  };

  const shareUrl = generateShareUrl();

  const handleShareWhatsApp = () => {
    const text = `I challenge you to beat my score in Globetrotter! I've answered ${user.score.correct} questions correctly. Try it here: ${shareUrl}`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  if (!user) return null;

  return (
    <div className="challenge-section">
      <button className="challenge-button" onClick={handleChallengeClick}>
        <FaShareAlt /> Challenge a Friend
      </button>
      
      {showShare && (
        <div className="share-overlay" onClick={(e) => {
          // Close if user clicks outside the modal
          if (e.target.className === 'share-overlay') {
            handleClose();
          }
        }}>
          <div className="share-modal">
            <button className="close-button" onClick={handleClose}><FaTimes /></button>
            <h3>Challenge Your Friends!</h3>
            
            {generatingImage ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div className="loading-spinner"></div>
                <p>Generating image...</p>
              </div>
            ) : (
              <>
                {shareImage && (
                  <div className="share-image-container">
                    <img src={shareImage} alt="Your current game score" className="share-image" />
                  </div>
                )}
                
                <div className="share-link">
                  <p>Share this link with your friends:</p>
                  <div className="share-url-container">
                    <input type="text" value={shareUrl} readOnly />
                    <button onClick={copyToClipboard}><FaCopy /></button>
                  </div>
                </div>
                
                <div className="share-buttons">
                  <button onClick={handleShareWhatsApp} className="whatsapp-share">
                    <FaWhatsapp /> Share on WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChallengeButton; 