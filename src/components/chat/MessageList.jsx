import React, { useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import ChoiceButtons from './ChoiceButtons';
import ActionCard from './ActionCard';
import TypingIndicator from './TypingIndicator';
import styles from './chat.module.css';

export default function MessageList({
  messages,
  isTyping,
  onChoiceSelect,
  onConfirmAction,
  onCancelAction,
}) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className={styles.messageList}>
      {messages.map((msg, i) => (
        <React.Fragment key={i}>
          <MessageBubble message={msg} index={i} />
          {msg.role === 'sage' && msg.choices && msg.choices.length > 0 && (
            <ChoiceButtons
              choices={msg.choices}
              onSelect={onChoiceSelect}
              disabled={i !== messages.length - 1}
            />
          )}
          {msg.role === 'sage' && msg.actionCard && (
            <ActionCard
              actionCard={msg.actionCard}
              onConfirm={onConfirmAction}
              onCancel={onCancelAction}
              awaitingConfirmation={
                i === messages.length - 1 &&
                (msg.actionCard.type === 'confirmation' ||
                  (msg.actionCard.items && msg.actionCard.items.some((it) => it.status === 'pending')))
              }
            />
          )}
        </React.Fragment>
      ))}
      <AnimatePresence>
        {isTyping && <TypingIndicator />}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  );
}
