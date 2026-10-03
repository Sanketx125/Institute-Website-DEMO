import React from 'react';

/** Thumb-reach Apply / Visit bar for phones (hidden on wider screens by CSS). */
export const MobileActionBar: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => (
  <div className="mobile-action-bar" role="region" aria-label="Quick actions">
    <button type="button" className="btn btn-ghost" data-track="mobile_visit" onClick={() => onNavigate('/visit')}>Visit campus</button>
    <button type="button" className="btn btn-primary" data-track="mobile_apply" onClick={() => onNavigate('/apply')}>Apply now</button>
  </div>
);
