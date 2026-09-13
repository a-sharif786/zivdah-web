function formatBubbleTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// Shared bubble renderer used by both ChatBotThread and ChatHumanThread — customer/bot/agent/
// system styling, timestamp, and read-receipt ticks (customer's own sent messages only, driven
// by message.status: SENT/DELIVERED/READ).
export default function ChatMessageBubble({ message }) {
  const senderType = message.senderType || 'BOT';
  const isOwn = senderType === 'CUSTOMER';
  const isSystem = senderType === 'SYSTEM';

  if (isSystem) {
    return (
      <div className="chat-msg-system">
        <span>{message.message}</span>
      </div>
    );
  }

  return (
    <div className={`chat-msg-row ${isOwn ? 'own' : 'other'}`}>
      <div className={`chat-bubble chat-bubble-${senderType.toLowerCase()} ${message.failed ? 'failed' : ''}`}>
        {message.messageType === 'IMAGE' && message.attachmentUrl && (
          <img src={message.attachmentUrl} alt="attachment" className="chat-bubble-image" />
        )}
        {message.messageType === 'FILE' && message.attachmentUrl && (
          <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="chat-bubble-file">
            <i className="fas fa-paperclip"></i> Attachment
          </a>
        )}
        {message.message && <p className="chat-bubble-text">{message.message}</p>}
        <div className="chat-bubble-meta">
          <span className="chat-bubble-time">{formatBubbleTime(message.createdAt)}</span>
          {isOwn && (
            <span className={`chat-bubble-ticks ${message.status === 'READ' ? 'read' : ''}`}>
              {message.pending ? (
                <i className="fas fa-clock" title="Sending"></i>
              ) : message.failed ? (
                <i className="fas fa-exclamation-circle" title="Not sent"></i>
              ) : message.status === 'READ' || message.status === 'DELIVERED' ? (
                <i className="fas fa-check-double" title={message.status === 'READ' ? 'Read' : 'Delivered'}></i>
              ) : (
                <i className="fas fa-check" title="Sent"></i>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
