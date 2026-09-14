import { createContext, useContext, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { chatApi, buildChatWsUrl } from '../api/chatApi';

const ChatContext = createContext();

const ACTIVE_CONVERSATION_KEY = 'zivdah_chat_active_conversation';
const MAX_RECONNECT_ATTEMPTS = 6;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
const TYPING_SEND_THROTTLE_MS = 3000;
const TYPING_AUTO_CLEAR_MS = 5000;

function readStoredConversationId() {
  try {
    const raw = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    if (!raw) return null;
    const asNumber = Number(raw);
    return Number.isFinite(asNumber) ? asNumber : raw;
  } catch {
    return null;
  }
}

function persistConversationId(id) {
  try {
    if (id == null) {
      localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    } else {
      localStorage.setItem(ACTIVE_CONVERSATION_KEY, String(id));
    }
  } catch {
    // best-effort — losing this only means a reload won't resume the HUMAN conversation
  }
}

// A "real" (server-persisted) message id is numeric; optimistic/local entries use a
// `local-`-prefixed string id until reconciled against a server echo or backfill row.
function isLocalId(id) {
  return typeof id === 'string' && id.startsWith('local-');
}

function sortMessages(list) {
  return [...list].sort((a, b) => {
    if (!isLocalId(a.id) && !isLocalId(b.id)) {
      const an = Number(a.id);
      const bn = Number(b.id);
      if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
    }
    const at = new Date(a.createdAt).getTime() || 0;
    const bt = new Date(b.createdAt).getTime() || 0;
    return at - bt;
  });
}

// Merges freshly-received/backfilled message records into the existing list, reconciling
// against our own optimistic (client-generated) entries by clientMessageId first, then by id.
function mergeMessages(prev, incoming) {
  const list = [...prev];
  for (const msg of incoming) {
    let idx = -1;
    if (msg.clientMessageId) {
      idx = list.findIndex((m) => m.clientMessageId === msg.clientMessageId);
    }
    if (idx === -1) {
      idx = list.findIndex((m) => String(m.id) === String(msg.id));
    }
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...msg, pending: false };
    } else {
      list.push(msg);
    }
  }
  return sortMessages(list);
}

function normalizeIncomingMessage(payload, frameType) {
  return {
    id: payload?.id ?? `local-${crypto.randomUUID()}`,
    conversationId: payload?.conversationId,
    senderId: payload?.senderId ?? null,
    senderType: payload?.senderType ?? (frameType === 'SYSTEM' ? 'SYSTEM' : 'AGENT'),
    messageType: payload?.messageType ?? 'TEXT',
    message: payload?.message ?? '',
    attachmentUrl: payload?.attachmentUrl ?? null,
    status: payload?.status ?? 'DELIVERED',
    createdAt: payload?.createdAt ?? new Date().toISOString(),
    clientMessageId: payload?.clientMessageId ?? null,
  };
}

export function ChatProvider({ children }) {
  const { isAuthenticated, token } = useAuth();

  const [screen, setScreen] = useState('CHOICE'); // CHOICE | BOT | HUMAN | RATING
  const [mode, setMode] = useState('BOT'); // BOT | HUMAN | CLOSED
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('IDLE');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [typingAgent, setTypingAgent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const reconnectNonceRef = useRef(0);
  const [reconnectNonce, setReconnectNonceState] = useState(0);
  const lastMessageIdRef = useRef(0);
  const typingClearTimerRef = useRef(null);

  // --- Restore an active HUMAN conversation on mount / login (survives a page reload) ---
  useEffect(() => {
    if (!isAuthenticated) return;
    const stored = readStoredConversationId();
    if (stored != null) {
      setConversationId(stored);
      setMode('HUMAN');
      setScreen('HUMAN');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per auth transition only
  }, [isAuthenticated]);

  const resetToChoiceBot = useCallback(() => {
    setScreen('CHOICE');
    setMode('BOT');
    setConversationId(null);
    setMessages([]);
    lastMessageIdRef.current = 0;
    persistConversationId(null);
  }, []);

  // --- Clear on logout (manual, or the auto-expiry AuthContext listens for) ---
  useEffect(() => {
    if (!isAuthenticated) {
      resetToChoiceBot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the auth transition
  }, [isAuthenticated]);

  useEffect(() => {
    if (mode !== 'HUMAN') setTypingAgent(false);
  }, [mode]);

  const applyBotResponse = useCallback((response) => {
    const {
      conversationId: newConversationId,
      reply,
      quickReplies,
      conversationType,
      products,
      orderCard,
      requiresConfirmation,
      handoffOffered,
    } = response || {};

    if (newConversationId != null) setConversationId(newConversationId);

    if (conversationType === 'HUMAN') {
      // Handoff already happened server-side (explicit request, or an intent that
      // auto-escalated, e.g. REFUND_REQUEST/TALK_TO_HUMAN). The authoritative transcript
      // (bot history + the handoff SYSTEM message + this reply) is already persisted —
      // clear the ephemeral BOT-mode list and let the WS-connect effect's initial
      // backfill (afterId=0) repopulate it with real message ids, rather than trying to
      // reconcile local temp-id entries against server ones.
      setMessages([]);
      lastMessageIdRef.current = 0;
      setMode('HUMAN');
      setScreen('HUMAN');
      if (newConversationId != null) persistConversationId(newConversationId);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `local-${crypto.randomUUID()}`,
        senderType: 'BOT',
        messageType: 'TEXT',
        message: reply,
        status: 'DELIVERED',
        createdAt: new Date().toISOString(),
        quickReplies: quickReplies || [],
        products: products || null,
        orderCard: orderCard || null,
        requiresConfirmation: requiresConfirmation || null,
        handoffOffered: !!handoffOffered,
      },
    ]);
  }, []);

  const sendBotMessage = useCallback(
    async (text) => {
      const trimmed = (text || '').trim();
      if (!trimmed || sending) return;
      setError(null);
      setSending(true);
      setScreen('BOT');
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${crypto.randomUUID()}`,
          senderType: 'CUSTOMER',
          messageType: 'TEXT',
          message: trimmed,
          status: 'SENT',
          createdAt: new Date().toISOString(),
        },
      ]);
      try {
        const response = await chatApi.sendMessage({
          conversationId: conversationId ?? undefined,
          message: trimmed,
        });
        applyBotResponse(response);
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.');
      } finally {
        setSending(false);
      }
    },
    [conversationId, sending, applyBotResponse]
  );

  const requestHuman = useCallback(async () => {
    if (!isAuthenticated) return;
    setSending(true);
    setError(null);
    try {
      let cid = conversationId;
      if (cid == null) {
        const started = await chatApi.sendMessage({ message: 'I would like to talk to a human agent.' });
        cid = started.conversationId;
        setConversationId(cid);
      }
      await chatApi.requestHuman(cid);
      setMessages([]);
      lastMessageIdRef.current = 0;
      setMode('HUMAN');
      setScreen('HUMAN');
      persistConversationId(cid);
    } catch (err) {
      setError(err.message || 'Could not reach a human agent right now.');
    } finally {
      setSending(false);
    }
  }, [conversationId, isAuthenticated]);

  const confirmAction = useCallback(
    async (requiresConfirmation, confirmed) => {
      if (!conversationId || !requiresConfirmation) return;
      setSending(true);
      setError(null);
      // Optimistically hide the prompt so the buttons don't linger while in flight.
      setMessages((prev) =>
        prev.map((m) => (m.requiresConfirmation === requiresConfirmation ? { ...m, confirmationResolved: true } : m))
      );
      try {
        const response = await chatApi.confirmAction({
          conversationId,
          actionType: requiresConfirmation.actionType,
          payload: requiresConfirmation.payload,
          confirmed,
        });
        applyBotResponse(response);
      } catch (err) {
        setError(err.message || 'Could not process that action. Please try again.');
      } finally {
        setSending(false);
      }
    },
    [conversationId, applyBotResponse]
  );

  // --- WebSocket lifecycle (HUMAN mode only) ---
  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const handleFrame = useCallback((frame) => {
    const { type, payload } = frame || {};
    if (!type) return;
    switch (type) {
      case 'MESSAGE':
      case 'SYSTEM': {
        const incoming = normalizeIncomingMessage(payload, type);
        setMessages((prev) => mergeMessages(prev, [incoming]));
        const n = Number(incoming.id);
        if (Number.isFinite(n)) lastMessageIdRef.current = Math.max(lastMessageIdRef.current, n);
        if (type === 'SYSTEM') {
          const closed = payload?.conversationStatus === 'CLOSED' || payload?.status === 'CLOSED';
          if (closed) {
            setMode('CLOSED');
            setScreen('RATING');
            persistConversationId(null);
          }
        }
        break;
      }
      case 'TYPING': {
        if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
        if (payload?.isTyping) {
          setTypingAgent(true);
          typingClearTimerRef.current = setTimeout(() => setTypingAgent(false), TYPING_AUTO_CLEAR_MS);
        } else {
          setTypingAgent(false);
        }
        break;
      }
      case 'READ_RECEIPT': {
        const lastReadId = payload?.lastReadMessageId;
        if (lastReadId != null) {
          setMessages((prev) =>
            prev.map((m) =>
              m.senderType === 'CUSTOMER' && !isLocalId(m.id) && Number(m.id) <= Number(lastReadId)
                ? { ...m, status: 'READ' }
                : m
            )
          );
        }
        break;
      }
      case 'PRESENCE':
        // Informational only — no dedicated UI state requested for v1.
        break;
      case 'ERROR':
        setError(payload?.message || 'A connection error occurred.');
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    if (mode !== 'HUMAN' || conversationId == null || !token) {
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
      clearReconnectTimer();
      reconnectAttemptRef.current = 0;
      setReconnectAttempt(0);
      setConnectionStatus('IDLE');
      return undefined;
    }

    let cancelled = false;

    const backfill = async () => {
      try {
        const page = await chatApi.getMessages(conversationId, lastMessageIdRef.current || undefined);
        const list = Array.isArray(page) ? page : page?.content || [];
        if (list.length && !cancelled) {
          setMessages((prev) => mergeMessages(prev, list));
          const maxId = list.reduce((max, m) => {
            const n = Number(m.id);
            return Number.isFinite(n) ? Math.max(max, n) : max;
          }, lastMessageIdRef.current);
          lastMessageIdRef.current = maxId;
        }
      } catch {
        // Backfill failures aren't fatal — the socket can still deliver live traffic;
        // the next successful (re)connect retries it.
      }
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setConnectionStatus('FAILED');
        return;
      }
      reconnectAttemptRef.current += 1;
      setReconnectAttempt(reconnectAttemptRef.current);
      setConnectionStatus('RECONNECTING');
      const backoff = Math.min(MAX_RECONNECT_DELAY_MS, BASE_RECONNECT_DELAY_MS * 2 ** (reconnectAttemptRef.current - 1));
      const delay = Math.min(MAX_RECONNECT_DELAY_MS, backoff / 2 + Math.random() * (backoff / 2));
      clearReconnectTimer();
      reconnectTimerRef.current = setTimeout(open, delay); // eslint-disable-line no-use-before-define
    };

    function open() {
      if (cancelled) return;
      setConnectionStatus(reconnectAttemptRef.current > 0 ? 'RECONNECTING' : 'CONNECTING');
      let ws;
      try {
        ws = new WebSocket(buildChatWsUrl(conversationId, token));
      } catch {
        scheduleReconnect();
        return;
      }
      socketRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        reconnectAttemptRef.current = 0;
        setReconnectAttempt(0);
        setConnectionStatus('CONNECTED');
        backfill();
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        let frame;
        try {
          frame = JSON.parse(event.data);
        } catch {
          return;
        }
        handleFrame(frame);
      };

      ws.onclose = () => {
        if (cancelled) return;
        socketRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = () => {
        // onclose fires immediately after in browsers; reconnect scheduling lives there.
      };
    }

    open();

    return () => {
      cancelled = true;
      clearReconnectTimer();
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
    // reconnectNonce is a write-only trigger for manual retry(); attempt bookkeeping lives in refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, conversationId, token, reconnectNonce, clearReconnectTimer, handleFrame]);

  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0;
    setReconnectAttempt(0);
    setConnectionStatus('CONNECTING');
    reconnectNonceRef.current += 1;
    setReconnectNonceState(reconnectNonceRef.current);
  }, []);

  const sendWsFrame = useCallback((frame) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(frame));
      return true;
    }
    return false;
  }, []);

  const sendHumanMessage = useCallback(
    (text) => {
      const trimmed = (text || '').trim();
      if (!trimmed || conversationId == null) return;
      const clientMessageId = crypto.randomUUID();
      const optimistic = {
        id: `local-${clientMessageId}`,
        clientMessageId,
        conversationId,
        senderType: 'CUSTOMER',
        messageType: 'TEXT',
        message: trimmed,
        status: 'SENT',
        createdAt: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => sortMessages([...prev, optimistic]));
      const sent = sendWsFrame({
        type: 'MESSAGE',
        payload: { conversationId, message: trimmed, messageType: 'TEXT', clientMessageId },
      });
      if (!sent) {
        setMessages((prev) =>
          prev.map((m) => (m.clientMessageId === clientMessageId ? { ...m, pending: false, failed: true } : m))
        );
        setError('Not connected — message not sent.');
      }
    },
    [conversationId, sendWsFrame]
  );

  const lastTypingSentRef = useRef(0);
  const sendTypingSignal = useCallback(() => {
    if (conversationId == null) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_SEND_THROTTLE_MS) return;
    lastTypingSentRef.current = now;
    sendWsFrame({ type: 'TYPING', payload: { conversationId, isTyping: true } });
  }, [conversationId, sendWsFrame]);

  const markAgentMessagesRead = useCallback(() => {
    if (conversationId == null) return;
    const unread = messages.filter(
      (m) => (m.senderType === 'AGENT' || m.senderType === 'SYSTEM') && m.status !== 'READ' && !isLocalId(m.id)
    );
    if (unread.length === 0) return;
    const lastReadMessageId = unread.reduce((max, m) => Math.max(max, Number(m.id)), 0);
    if (!lastReadMessageId) return;
    setMessages((prev) =>
      prev.map((m) =>
        (m.senderType === 'AGENT' || m.senderType === 'SYSTEM') && !isLocalId(m.id) && Number(m.id) <= lastReadMessageId
          ? { ...m, status: 'READ' }
          : m
      )
    );
    sendWsFrame({ type: 'READ_RECEIPT', payload: { conversationId, lastReadMessageId } });
  }, [conversationId, messages, sendWsFrame]);

  const uploadAttachment = useCallback(
    async (file) => {
      if (conversationId == null) return;
      setSending(true);
      setError(null);
      try {
        const messageRecord = await chatApi.uploadAttachment(conversationId, file);
        setMessages((prev) => mergeMessages(prev, [messageRecord]));
        const n = Number(messageRecord?.id);
        if (Number.isFinite(n)) lastMessageIdRef.current = Math.max(lastMessageIdRef.current, n);
      } catch (err) {
        setError(err.message || 'Upload failed. Please try again.');
      } finally {
        setSending(false);
      }
    },
    [conversationId]
  );

  const closeAndRate = useCallback(
    async (rating, feedback) => {
      if (conversationId == null) {
        resetToChoiceBot();
        return;
      }
      setSending(true);
      setError(null);
      try {
        await chatApi.rate(conversationId, { rating, feedback: feedback || undefined });
      } catch (err) {
        setError(err.message || 'Could not submit your rating.');
      } finally {
        setSending(false);
        resetToChoiceBot();
      }
    },
    [conversationId, resetToChoiceBot]
  );

  const dismissRating = useCallback(() => {
    resetToChoiceBot();
  }, [resetToChoiceBot]);

  // Customer-initiated end of the current Assistant (BOT) conversation — distinct from
  // closeAndRate above, which only ever fires from the RATING screen an agent-closed HUMAN
  // conversation lands on. Stays on the BOT screen (mode flips to 'CLOSED', same value the
  // WS-lifecycle effect already treats as "no socket needed" for HUMAN mode, so no extra
  // branching there) so ChatBotThread can keep the transcript visible with an ended banner —
  // history isn't cleared here; startNewBotChat below is what actually resets it.
  const endBotChat = useCallback(async () => {
    if (conversationId == null) return;
    setSending(true);
    setError(null);
    try {
      await chatApi.endConversation(conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${crypto.randomUUID()}`,
          senderType: 'SYSTEM',
          messageType: 'SYSTEM',
          message: 'You ended this chat.',
          status: 'DELIVERED',
          createdAt: new Date().toISOString(),
        },
      ]);
      setMode('CLOSED');
    } catch (err) {
      setError(err.message || 'Could not end the chat. Please try again.');
    } finally {
      setSending(false);
    }
  }, [conversationId]);

  // Lets the customer start a fresh Assistant conversation right after ending the last one —
  // the ended conversation and its messages aren't touched server-side (still there, just
  // CLOSED); this only resets local state so the next sendBotMessage starts a brand new one,
  // exactly like the very first message of a session (conversationId == null).
  const startNewBotChat = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    lastMessageIdRef.current = 0;
    setError(null);
    setMode('BOT');
    setScreen('BOT');
  }, []);

  const openChoice = useCallback(() => setScreen('CHOICE'), []);
  const openBotScreen = useCallback(() => setScreen('BOT'), []);

  const unreadCount = useMemo(
    () =>
      messages.filter((m) => (m.senderType === 'AGENT' || m.senderType === 'SYSTEM') && m.status !== 'READ').length,
    [messages]
  );

  const value = {
    screen,
    mode,
    conversationId,
    messages,
    connectionStatus,
    reconnectAttempt,
    typingAgent,
    unreadCount,
    sending,
    error,
    sendBotMessage,
    requestHuman,
    sendHumanMessage,
    sendTypingSignal,
    uploadAttachment,
    confirmAction,
    closeAndRate,
    dismissRating,
    endBotChat,
    startNewBotChat,
    reconnect,
    markAgentMessagesRead,
    openChoice,
    openBotScreen,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => useContext(ChatContext);
