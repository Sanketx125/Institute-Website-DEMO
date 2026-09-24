import React, { useEffect, useRef } from 'react';

interface DialogProps { open: boolean; onClose: () => void; label: string; className?: string; children: React.ReactNode; }

/** Native modal handles focus containment, Escape, and background inertness. */
export const Dialog: React.FC<DialogProps> = ({ open, onClose, label, className = '', children }) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, [open]);
  return <dialog ref={ref} className={`campus-dialog ${className}`} aria-label={label} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}>{children}</dialog>;
};
