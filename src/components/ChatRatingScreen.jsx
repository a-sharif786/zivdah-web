import { useState } from 'react';
import { useChat } from '../context/ChatContext';

export default function ChatRatingScreen() {
  const { closeAndRate, dismissRating, sending } = useChat();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (!rating) return;
    closeAndRate(rating, feedback.trim());
  };

  return (
    <div className="chat-rating-screen">
      <h3 className="chat-rating-title">How was your support experience?</h3>

      <div className="chat-rating-stars" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="chat-rating-star"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            aria-pressed={n <= rating}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(n)}
          >
            <i className={n <= (hoverRating || rating) ? 'fas fa-star' : 'far fa-star'}></i>
          </button>
        ))}
      </div>

      <label className="chat-rating-feedback-label" htmlFor="chat-rating-feedback">Optional feedback:</label>
      <textarea
        id="chat-rating-feedback"
        className="chat-rating-feedback"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={3}
      />

      <div className="chat-rating-actions">
        <button type="button" className="btn-secondary" disabled={sending} onClick={dismissRating}>
          Skip
        </button>
        <button type="button" className="btn-primary" disabled={sending || !rating} onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}
