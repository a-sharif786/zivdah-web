import { useState } from 'react';
import { useChat } from '../context/ChatContext';
import ChatChoiceScreen from './ChatChoiceScreen';
import ChatBotThread from './ChatBotThread';
import ChatHumanThread from './ChatHumanThread';
import ChatRatingScreen from './ChatRatingScreen';
import './ChatWidget.css';

const SCREEN_TITLES = {
  CHOICE: 'Zivdah Support',
  BOT: 'Zivdah Assistant',
  HUMAN: 'Human Support',
  RATING: 'Rate Your Experience',
};

export default function ChatWidget() {
  const { screen, mode, unreadCount } = useChat();
  const [open, setOpen] = useState(false);

  // Only show the badge for HUMAN-mode unread messages that arrived while the panel was
  // closed — BOT-mode turns are always visible the moment they happen (plain request/reply).
  const showBadge = !open && mode === 'HUMAN' && unreadCount > 0;

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel" role="dialog" aria-label="Support chat">
          <div className="chat-panel-header">
            <span>{SCREEN_TITLES[screen] || 'Zivdah Support'}</span>
            <button type="button" className="chat-panel-close" onClick={() => setOpen(false)} aria-label="Close chat">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="chat-panel-body">
            {screen === 'CHOICE' && <ChatChoiceScreen />}
            {screen === 'BOT' && <ChatBotThread />}
            {screen === 'HUMAN' && <ChatHumanThread />}
            {screen === 'RATING' && <ChatRatingScreen />}
          </div>
        </div>
      )}

      <button
        type="button"
        className="chat-bubble-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
      >
        <i className={`fas fa-${open ? 'times' : 'comment-dots'}`}></i>
        {showBadge && <span className="cart-badge chat-bubble-badge">{unreadCount}</span>}
      </button>
    </div>
  );
}
