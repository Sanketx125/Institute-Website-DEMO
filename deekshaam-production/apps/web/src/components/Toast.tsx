import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Icon } from '@deekshaam/ui';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: () => {},
      success: (msg) => console.log('[Toast Success]', msg),
      error: (msg) => console.error('[Toast Error]', msg),
      warning: (msg) => console.warn('[Toast Warning]', msg),
      info: (msg) => console.info('[Toast Info]', msg),
    };
  }
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = item.duration ?? 4500;
    const newToast: ToastItem = { ...item, id, duration };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep at most 5 toasts visible

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => {
    addToast({ type: 'success', message, title });
  }, [addToast]);

  const error = useCallback((message: string, title?: string) => {
    addToast({ type: 'error', message, title: title || 'Error' });
  }, [addToast]);

  const warning = useCallback((message: string, title?: string) => {
    addToast({ type: 'warning', message, title: title || 'Attention' });
  }, [addToast]);

  const info = useCallback((message: string, title?: string) => {
    addToast({ type: 'info', message, title });
  }, [addToast]);

  // Listen to global events from api.ts
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const custom = e as CustomEvent<{ type?: 'success' | 'error' | 'warning' | 'info'; message: string; title?: string }>;
      if (custom.detail?.message) {
        addToast({
          type: custom.detail.type || 'info',
          message: custom.detail.message,
          title: custom.detail.title,
        });
      }
    };

    const handleSessionExpired = (e: Event) => {
      const custom = e as CustomEvent<{ message?: string }>;
      error(custom.detail?.message || 'Your staff session has expired. Please sign in again.', 'Session Expired');
    };

    window.addEventListener('dbs:toast', handleGlobalToast);
    window.addEventListener('dbs:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('dbs:toast', handleGlobalToast);
      window.removeEventListener('dbs:session-expired', handleSessionExpired);
    };
  }, [addToast, error]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          width: 'calc(100vw - 48px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const typeStyles: Record<string, { bg: string; border: string; color: string; icon: string }> = {
            success: { bg: '#064e3b', border: '#059669', color: '#ecfdf5', icon: 'check' },
            error: { bg: '#7f1d1d', border: '#dc2626', color: '#fef2f2', icon: 'alert' },
            warning: { bg: '#78350f', border: '#d97706', color: '#fffbeb', icon: 'alert' },
            info: { bg: '#1e293b', border: '#475569', color: '#f8fafc', icon: 'document' },
          };
          const style = typeStyles[t.type] || typeStyles.info;

          return (
            <div
              key={t.id}
              role="alert"
              style={{
                pointerEvents: 'auto',
                background: style.bg,
                border: `1px solid ${style.border}`,
                color: style.color,
                borderRadius: '8px',
                padding: '12px 16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                fontSize: '13px',
                lineHeight: '1.4',
                animation: 'slideIn 0.2s ease-out',
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                <Icon name={style.icon as any} size={18} color={style.color} />
              </div>
              <div style={{ flex: 1 }}>
                {t.title && (
                  <strong style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>
                    {t.title}
                  </strong>
                )}
                <span>{t.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Close notification"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: style.color,
                  opacity: 0.7,
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Icon name="close" size={14} color={style.color} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
