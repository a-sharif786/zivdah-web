import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

export default function ChatChoiceScreen() {
  const { openBotScreen, requestHuman } = useChat();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  const handleHuman = () => {
    if (!isAuthenticated) {
      setShowGuestPrompt(true);
      return;
    }
    requestHuman();
  };

  return (
    <div className="chat-choice-screen">
      <h3 className="chat-choice-title">How can we help you?</h3>

      <button type="button" className="chat-choice-option" onClick={openBotScreen}>
        <span className="chat-choice-emoji" aria-hidden="true">🤖</span>
        Chat with Zivdah Assistant
      </button>

      <button type="button" className="chat-choice-option" onClick={handleHuman}>
        <span className="chat-choice-emoji" aria-hidden="true">👤</span>
        Talk to Human Support
      </button>

      {showGuestPrompt && (
        <div className="chat-guest-prompt">
          <span>Please log in to talk to a human agent.</span>
          <div className="chat-guest-prompt-actions">
            <Link className="btn-primary" to="/login" state={{ from: location }}>Log In</Link>
            <Link className="btn-secondary" to="/register" state={{ from: location }}>Create Account</Link>
          </div>
        </div>
      )}
    </div>
  );
}
