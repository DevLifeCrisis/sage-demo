import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import WelcomeScreen from '../components/chat/WelcomeScreen';
import { startConversation, sendMessage as apiSendMessage, sendChoice as apiSendChoice, sendAction as apiSendAction } from '../services/api';
// import { sendToLLM } from '../services/llm'; // Disabled — using ServiceNow backend
import styles from './ChatView.module.css';

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Parse ServiceNow record references from text
const RECORD_PATTERNS = [
  { pattern: /\b(INC-?\d{4,7})\b/gi, type: 'Incident', icon: '🔴', table: 'incident' },
  { pattern: /\b(REQ-?\d{4,7})\b/gi, type: 'Request', icon: '📋', table: 'sc_request' },
  { pattern: /\b(RITM-?\d{4,7})\b/gi, type: 'Requested Item', icon: '📦', table: 'sc_req_item' },
  { pattern: /\b(CHG-?\d{4,7})\b/gi, type: 'Change Request', icon: '🔄', table: 'change_request' },
  { pattern: /\b(PRB-?\d{4,7})\b/gi, type: 'Problem', icon: '⚠️', table: 'problem' },
  { pattern: /\b(TASK-?\d{4,7})\b/gi, type: 'Task', icon: '✅', table: 'task' },
  { pattern: /\b(HR-?\d{4,7})\b/gi, type: 'HR Case', icon: '👤', table: 'sn_hr_core_case' },
  { pattern: /\b(KB-?\d{4,7})\b/gi, type: 'Knowledge Article', icon: '📖', table: 'kb_knowledge' },
  { pattern: /\b(SCTASK-?\d{4,7})\b/gi, type: 'Catalog Task', icon: '⚙️', table: 'sc_task' },
];

function extractRecords(text) {
  const found = [];
  const seen = new Set();
  for (const { pattern, type, icon, table } of RECORD_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const number = match[1].toUpperCase();
      if (!seen.has(number)) {
        seen.add(number);
        found.push({ number, type, icon, table, timestamp: formatTime() });
      }
    }
  }
  return found;
}

// Detect action keywords for status inference
function inferStatus(text, recordNumber) {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(recordNumber.toLowerCase());
  // Look at surrounding context (100 chars around the record number)
  const start = Math.max(0, idx - 100);
  const end = Math.min(lower.length, idx + 100);
  const context = lower.slice(start, end);

  if (/created|opened|submitted|filed|logged/.test(context)) return 'Created';
  if (/updated|modified|changed|assigned|reassigned/.test(context)) return 'Updated';
  if (/resolved|closed|completed|fixed/.test(context)) return 'Resolved';
  if (/cancelled|canceled|rejected/.test(context)) return 'Cancelled';
  return 'Referenced';
}

// ===== Record Panel Component =====
function RecordPanel({ records }) {
  return (
    <div className={styles.recordPanel}>
      <div className={styles.recordPanelHeader}>
        <span className={styles.recordPanelIcon}>⚡</span>
        <span className={styles.recordPanelTitle}>ServiceNow Records</span>
        <span className={styles.recordCount}>{records.length}</span>
      </div>
      <div className={styles.recordList}>
        {records.map((r, i) => (
          <motion.div
            key={r.number}
            className={styles.recordCard}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
            <div className={styles.recordCardTop}>
              <span className={styles.recordIcon}>{r.icon}</span>
              <div className={styles.recordInfo}>
                <span className={styles.recordNumber}>{r.number}</span>
                <span className={styles.recordType}>{r.type}</span>
              </div>
              <span className={`${styles.recordStatus} ${styles[`status${r.status}`] || styles.statusReferenced}`}>
                {r.status}
              </span>
            </div>
            <div className={styles.recordMeta}>
              <span>Table: {r.table}</span>
              <span>{r.timestamp}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function ChatView() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const conversationIdRef = useRef(null);

  // Track all discovered records across the conversation
  const [records, setRecords] = useState([]);

  const hasStarted = messages.length > 0;
  const hasRecords = records.length > 0;

  // Process new text for records
  const processRecords = useCallback((text) => {
    const newRecords = extractRecords(text);
    if (newRecords.length > 0) {
      setRecords(prev => {
        const existing = new Set(prev.map(r => r.number));
        const toAdd = newRecords
          .filter(r => !existing.has(r.number))
          .map(r => ({ ...r, status: inferStatus(text, r.number) }));
        // Update status of existing records if mentioned again
        const updated = prev.map(r => {
          if (newRecords.some(nr => nr.number === r.number)) {
            return { ...r, status: inferStatus(text, r.number), timestamp: formatTime() };
          }
          return r;
        });
        return [...updated, ...toAdd];
      });
    }
  }, []);

  const handleApiResponse = useCallback((data) => {
    const sageMsg = {
      role: 'sage',
      text: data.message,
      timestamp: formatTime(),
      choices: data.choices || [],
      actionCard: data.actionCard || null,
    };
    setMessages((prev) => [...prev, sageMsg]);
    processRecords(data.message);

    // Add activeRecords from ServiceNow response
    if (data.activeRecords?.length) {
      setRecords(prev => {
        const existing = new Set(prev.map(r => r.number));
        const toAdd = data.activeRecords
          .filter(r => r.id) // skip records with no id
          .filter(r => !existing.has(r.number || r.id))
          .map(r => ({
            number: r.number || r.id,
            type: r.label || r.type || 'Record',
            icon: (r.type || '').includes('hr') ? '👤' : (r.type || '').includes('incident') ? '🔧' : '📋',
            table: r.type || 'unknown',
            status: r.status || 'Created',
            timestamp: formatTime(),
          }));
        return [...prev, ...toAdd];
      });
    }
  }, [processRecords]);

  // Ensure we have a conversation, starting one if needed
  const ensureConversation = useCallback(async () => {
    if (conversationIdRef.current) return conversationIdRef.current;
    const result = await startConversation();
    conversationIdRef.current = result.conversationId;
    return conversationIdRef.current;
  }, []);

  const handleSend = useCallback(async (text) => {
    const userMsg = { role: 'user', text, timestamp: formatTime() };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Check user message for records too
    processRecords(text);

    try {
      const convId = await ensureConversation();
      const data = await apiSendMessage(convId, text);
      handleApiResponse(data);
    } catch (err) {
      console.error('API error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'sage', text: `Sorry, something went wrong: ${err.message || 'Unknown error'}. Please try again.`, timestamp: formatTime() },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [handleApiResponse, processRecords, ensureConversation]);

  const handleChoiceSelect = useCallback(async (choice) => {
    const userMsg = { role: 'user', text: choice.label, timestamp: formatTime() };
    setMessages((prev) => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].role === 'sage' && updated[i].choices?.length) {
          updated[i] = { ...updated[i], choices: [] };
          break;
        }
      }
      return [...updated, userMsg];
    });
    setIsTyping(true);

    try {
      const convId = await ensureConversation();
      const data = await apiSendChoice(convId, choice.value);
      handleApiResponse(data);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'sage', text: 'Sorry, something went wrong. Please try again.', timestamp: formatTime() },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [handleApiResponse]);

  const handleConfirmAction = useCallback(async () => {
    setIsTyping(true);
    try {
      const convId = await ensureConversation();
      // Find the latest action card in messages
      let actionId = 'pending';
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].actionCard?.id) {
          actionId = messages[i].actionCard.id;
          break;
        }
      }
      const data = await apiSendAction(convId, actionId, true);
      handleApiResponse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  }, [handleApiResponse, ensureConversation, messages]);

  const handleCancelAction = useCallback(async () => {
    setIsTyping(true);
    try {
      const convId = await ensureConversation();
      let actionId = 'pending';
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].actionCard?.id) {
          actionId = messages[i].actionCard.id;
          break;
        }
      }
      const data = await apiSendAction(convId, actionId, false);
      handleApiResponse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  }, [handleApiResponse, ensureConversation, messages]);

  return (
    <div className={styles.chatView}>
      <div className={styles.chatArea}>
        {!hasStarted ? (
          <WelcomeScreen onScenarioSelect={handleSend} />
        ) : (
          <MessageList
            messages={messages}
            isTyping={isTyping}
            onChoiceSelect={handleChoiceSelect}
            onConfirmAction={handleConfirmAction}
            onCancelAction={handleCancelAction}
          />
        )}
        <ChatInput onSend={handleSend} disabled={isTyping} />

        {/* Mobile record toggle — only show when records exist */}
        {hasRecords && (
          <button
            className={styles.contextToggle}
            onClick={() => setDrawerOpen(true)}
          >
            ⚡ {records.length}
          </button>
        )}
      </div>

      {/* Desktop record panel — slides in when records appear */}
      <AnimatePresence>
        {hasRecords && (
          <motion.div
            className={styles.contextPanelDesktop}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          >
            <RecordPanel records={records} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && hasRecords && (
          <>
            <motion.div
              className={styles.contextDrawerOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className={styles.contextDrawer}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            >
              <RecordPanel records={records} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
