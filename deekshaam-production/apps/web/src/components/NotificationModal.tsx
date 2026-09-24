import React from 'react';
import { Icon } from '@deekshaam/ui';
import { Dialog } from './Dialog';
export type NotificationType = 'error' | 'warning' | 'success' | 'info';
interface NotificationModalProps { isOpen: boolean; title?: string; message: string; type?: NotificationType; confirmText?: string; onClose: () => void; }
export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, title, message, type = 'warning', confirmText = 'Got it', onClose }) => {
  const headings = { error: 'Something needs your attention', warning: 'A few details are missing', success: 'You are all set', info: 'Good to know' };
  return <Dialog open={isOpen} onClose={onClose} label={title || headings[type]} className={`notification-dialog notification-${type}`}>
    <div className="notification-icon"><Icon name={type === 'success' ? 'check' : type === 'info' ? 'document' : 'alert'} size={25} /></div>
    <h2>{title || headings[type]}</h2><p>{message}</p><button className="btn btn-primary" onClick={onClose}>{confirmText}</button>
  </Dialog>;
};
