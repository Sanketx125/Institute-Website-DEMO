import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Icon } from '@deekshaam/ui';
import { Dialog } from '../components/Dialog';

const FeedbackContext = createContext<(message: string) => void>(() => {});
export const useAdminFeedback = () => useContext(FeedbackContext);

export const AdminFeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState('');
  const [overEditor, setOverEditor] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const dismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setMessage('');
    setOverEditor(false);
  };

  const notify = (value: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const isErrorInDialog =
      Boolean(document.querySelector('dialog[open]')) &&
      /failed|unable|invalid|error|denied|required|already|could not|must/i.test(value);
    setOverEditor(isErrorInDialog);
    setMessage(value);

    // Automatically dismiss the bottom toast after 4 seconds so it doesn't get stuck
    if (!isErrorInDialog) {
      timerRef.current = setTimeout(() => {
        setMessage('');
        timerRef.current = null;
      }, 4000);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <FeedbackContext.Provider value={notify}>
      {children}
      {message && !overEditor && (
        <div className="workspace-feedback" role="status">
          <span>{message}</span>
          <button className="icon-btn" aria-label="Dismiss notification" onClick={dismiss}>
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
      <Dialog
        open={!!message && overEditor}
        onClose={dismiss}
        label="Workspace notification"
        className="notification-dialog"
        preventBackdropClose={true}
        preventEscapeClose={true}
      >
        <div className="notification-icon">
          <Icon name="document" size={24} />
        </div>
        <h2>Workspace update</h2>
        <p>{message}</p>
        <button className="btn btn-primary" onClick={dismiss}>
          Got it
        </button>
      </Dialog>
    </FeedbackContext.Provider>
  );
};
