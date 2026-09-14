import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import ChatMessageBubble from './ChatMessageBubble';
import ProductCard from './ProductCard';

// Mirrors IntentClassifier#isAffirmative/isNegative on the backend — whole-message match only,
// so a longer sentence that happens to contain "no" doesn't accidentally hijack a real message.
const AFFIRMATIVE_RE = /^(yes|yeah|yep|yup|sure|confirm(ed)?|ok(ay)?|do it|go ahead|please( do it)?|correct)[.!]?$/i;
const NEGATIVE_RE = /^(no|nah|nope|don'?t|do not|never ?mind|keep it|keep( the)? order|leave it)[.!]?$/i;

export default function ChatBotThread() {
  const {
    mode,
    messages,
    sendBotMessage,
    requestHuman,
    confirmAction,
    endBotChat,
    startNewBotChat,
    conversationId,
    sending,
    error,
  } = useChat();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [text, setText] = useState('');
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const isEnded = mode === 'CLOSED';
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const lastBotMessage = [...messages].reverse().find((m) => m.senderType === 'BOT');

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending || isEnded) return;

    // Typing "yes"/"no" instead of clicking the confirm buttons below used to just get sent as
    // a plain message, which the bot's intent classifier doesn't recognize (falls back to
    // "I'm not sure I understood that"), silently dropping the pending confirmation. Route a
    // yes/no-shaped reply through the same confirmAction the buttons use instead — it already
    // carries the real orderId in requiresConfirmation.payload, which the persisted message
    // text alone (just the display order number) can't reliably be reconstructed back into.
    if (lastBotMessage?.requiresConfirmation && !lastBotMessage.confirmationResolved) {
      if (AFFIRMATIVE_RE.test(trimmed)) {
        confirmAction(lastBotMessage.requiresConfirmation, true);
        setText('');
        return;
      }
      if (NEGATIVE_RE.test(trimmed)) {
        confirmAction(lastBotMessage.requiresConfirmation, false);
        setText('');
        return;
      }
    }

    sendBotMessage(trimmed);
    setText('');
  };

  const handleTalkToHuman = () => {
    if (!isAuthenticated) {
      setShowGuestPrompt(true);
      return;
    }
    requestHuman();
  };

  const handleConfirmEnd = async () => {
    await endBotChat();
    setShowEndConfirm(false);
  };

  return (
    <div className="chat-thread">
      <div className="chat-thread-messages">
        {messages.length === 0 && (
          <div className="chat-empty-hint">
            Ask me about your orders, products, offers, or delivery — I&apos;m here to help.
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="chat-thread-item">
            <ChatMessageBubble message={msg} />

            {msg.products && msg.products.length > 0 && (
              <div className="chat-product-strip">
                {msg.products.map((p) => (
                  <div className="chat-product-strip-item" key={p.id}>
                    <ProductCard product={p} compact />
                  </div>
                ))}
              </div>
            )}

            {msg.orderCard && (
              <div className="chat-order-card">
                <div className="chat-order-card-row">
                  <strong>Order #{msg.orderCard.orderNumber || msg.orderCard.orderId}</strong>
                  {msg.orderCard.status && <span className="chat-order-card-status">{msg.orderCard.status}</span>}
                </div>
                {msg.orderCard.totalAmount != null && (
                  <div className="chat-order-card-amount">₹{Number(msg.orderCard.totalAmount).toFixed(2)}</div>
                )}
                <Link to={`/orders/${msg.orderCard.orderId}`} className="btn-secondary chat-order-card-btn">
                  View Order
                </Link>
              </div>
            )}

            {msg.requiresConfirmation && !msg.confirmationResolved && (
              <div className="chat-confirm-actions">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={sending}
                  onClick={() => confirmAction(msg.requiresConfirmation, true)}
                >
                  {msg.requiresConfirmation.actionType === 'CANCEL_ORDER' ? 'Cancel Order' : 'Confirm'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={sending}
                  onClick={() => confirmAction(msg.requiresConfirmation, false)}
                >
                  {msg.requiresConfirmation.actionType === 'CANCEL_ORDER' ? 'Keep Order' : 'Cancel'}
                </button>
              </div>
            )}

            {msg.senderType === 'BOT' && msg === lastBotMessage && msg.quickReplies?.length > 0 && (
              <div className="chat-quick-replies">
                {msg.quickReplies.map((qr) => (
                  <button
                    key={qr}
                    type="button"
                    className="chat-quick-reply-pill"
                    disabled={sending}
                    onClick={() => sendBotMessage(qr)}
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && <div className="chat-error-banner">{error}</div>}

      <div className="chat-human-affordance">
        {isEnded ? (
          <div className="chat-ended-banner">
            <span><i className="fas fa-check-circle"></i> This chat has ended.</span>
            <button type="button" className="btn-primary chat-ended-restart-btn" onClick={startNewBotChat}>
              Start New Chat
            </button>
          </div>
        ) : showEndConfirm ? (
          <div className="chat-end-confirm">
            <span>End this chat with the assistant?</span>
            <div className="chat-end-confirm-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={sending}
                onClick={() => setShowEndConfirm(false)}
              >
                Cancel
              </button>
              <button type="button" className="btn-primary" disabled={sending} onClick={handleConfirmEnd}>
                End Chat
              </button>
            </div>
          </div>
        ) : showGuestPrompt ? (
          <div className="chat-guest-prompt">
            <span>Please log in to talk to a human agent.</span>
            <div className="chat-guest-prompt-actions">
              <Link className="btn-primary" to="/login" state={{ from: location }}>Log In</Link>
              <Link className="btn-secondary" to="/register" state={{ from: location }}>Create Account</Link>
            </div>
          </div>
        ) : (
          <div className="chat-bot-affordance-row">
            <button type="button" className="chat-talk-human-btn" onClick={handleTalkToHuman}>
              <i className="fas fa-user"></i> Talk to Human Support
            </button>
            {conversationId != null && (
              <button
                type="button"
                className="chat-end-chat-btn"
                onClick={() => setShowEndConfirm(true)}
                title="End Chat"
                aria-label="End chat"
              >
                <i className="fas fa-power-off"></i>
              </button>
            )}
          </div>
        )}
      </div>

      {!isEnded && (
        <form className="chat-composer" onSubmit={handleSend}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit" disabled={!text.trim() || sending} aria-label="Send">
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      )}
    </div>
  );
}
