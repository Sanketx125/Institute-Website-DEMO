import React, { useEffect } from 'react';
import { Icon } from '@deekshaam/ui';

export type NotificationType = 'error' | 'warning' | 'success' | 'info';

interface NotificationModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: NotificationType;
  confirmText?: string;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmText = 'Understood',
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeConfig = {
    error: {
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.1)',
      border: 'rgba(220, 38, 38, 0.25)',
      defaultTitle: 'Attention Required',
      icon: 'alert' as const,
    },
    warning: {
      color: '#ea580c',
      bg: 'rgba(234, 88, 12, 0.1)',
      border: 'rgba(234, 88, 12, 0.25)',
      defaultTitle: 'Incomplete Information',
      icon: 'alert' as const,
    },
    success: {
      color: '#15803d',
      bg: 'rgba(21, 128, 61, 0.1)',
      border: 'rgba(21, 128, 61, 0.25)',
      defaultTitle: 'Success',
      icon: 'check' as const,
    },
    info: {
      color: '#0284c7',
      bg: 'rgba(2, 132, 199, 0.1)',
      border: 'rgba(2, 132, 199, 0.25)',
      defaultTitle: 'Notice',
      icon: 'document' as const,
    },
  }[type];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: 'rgba(11, 19, 43, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid rgba(15, 36, 64, 0.1)',
          boxShadow: '0 25px 60px -12px rgba(15, 36, 64, 0.28), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP ACCENT BAR */}
        <div style={{ height: '4px', background: typeConfig.color }} />

        <div style={{ padding: '28px 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: typeConfig.bg,
                border: `1px solid ${typeConfig.border}`,
                color: typeConfig.color,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name={typeConfig.icon} size={22} color={typeConfig.color} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  margin: '0 0 6px',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#0f2440',
                  letterSpacing: '-0.3px',
                }}
              >
                {title || typeConfig.defaultTitle}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  lineHeight: '1.55',
                  color: '#4b5563',
                  wordBreak: 'break-word',
                }}
              >
                {message}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                background: '#0f2440',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 22px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s ease, transform 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#c2410c')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#0f2440')}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
