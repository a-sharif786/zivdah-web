import { useEffect, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import ChatMessageBubble from './ChatMessageBubble';

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

function ConnectionBanner({ connectionStatus, reconnectAttempt, onRetry }) {
  if (connectionStatus === 'CONNECTED') return null;

  if (connectionStatus === 'CONNECTING' || connectionStatus === 'IDLE') {
    return <div className="chat-status-banner">Connecting…</div>;
  }
  if (connectionStatus === 'RECONNECTING') {
    return <div className="chat-status-banner">Reconnecting… (attempt {reconnectAttempt})</div>;
  }
  if (connectionStatus === 'FAILED' || connectionStatus === 'DISCONNECTED') {
    return (
      <div className="chat-status-banner chat-status-banner-error">
        <span>Connection lost.</span>
        <button type="button" onClick={onRetry}>Retry</button>
      </div>
    );
  }
  return null;
}

export default function ChatHumanThread() {
  const {
    messages,
    connectionStatus,
    reconnectAttempt,
    typingAgent,
    sendHumanMessage,
    sendTypingSignal,
    uploadAttachment,
    markAgentMessagesRead,
    reconnect,
    sending,
    error,
  } = useChat();

  const [text, setText] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
  const [attachError, setAttachError] = useState(null);
  const fileInputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, typingAgent]);

  useEffect(() => {
    markAgentMessagesRead();
  }, [messages, markAgentMessagesRead]);

  useEffect(
    () => () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    },
    [pendingPreviewUrl]
  );

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendHumanMessage(text);
    setText('');
  };

  const clearPendingFile = () => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAttachError(null);
    if (!file.type.startsWith('image/')) {
      setAttachError('Only image attachments are supported.');
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachError('Image is too large (max 5MB).');
      return;
    }
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
  };

  const handleSendAttachment = async () => {
    if (!pendingFile) return;
    const file = pendingFile;
    clearPendingFile();
    await uploadAttachment(file);
  };

  return (
    <div className="chat-thread">
      <ConnectionBanner connectionStatus={connectionStatus} reconnectAttempt={reconnectAttempt} onRetry={reconnect} />

      <div className="chat-thread-messages">
        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}
        {typingAgent && (
          <div className="chat-typing-indicator" aria-label="Agent is typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <div className="chat-error-banner">{error}</div>}
      {attachError && <div className="chat-error-banner">{attachError}</div>}

      {pendingFile && (
        <div className="chat-attachment-preview">
          {pendingPreviewUrl && <img src={pendingPreviewUrl} alt="attachment preview" />}
          <span className="chat-attachment-name">{pendingFile.name}</span>
          <button type="button" className="chat-attachment-remove" onClick={clearPendingFile} aria-label="Remove attachment">
            <i className="fas fa-times"></i>
          </button>
          <button type="button" className="btn-primary chat-attachment-send" disabled={sending} onClick={handleSendAttachment}>
            Send
          </button>
        </div>
      )}

      <form className="chat-composer" onSubmit={handleSend}>
        <button
          type="button"
          className="chat-attach-btn"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach image"
        >
          <i className="fas fa-paperclip"></i>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            sendTypingSignal();
          }}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={!text.trim()} aria-label="Send">
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
}
