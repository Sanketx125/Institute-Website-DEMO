import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';

export interface PulsePost {
  id: string;
  category: 'PLACEMENT' | 'ACADEMIC' | 'URGENT' | 'EVENT';
  title: string;
  timestamp: string;
  summary: string;
  actionText?: string;
  actionPath?: string;
}

const SAMPLE_POSTS: PulsePost[] = [
  {
    id: 'post-1',
    category: 'PLACEMENT',
    title: 'Pre-Admission Corporate Selection: 12 New IT & Logistics Partners Onboarded',
    timestamp: '2 hours ago',
    summary: 'Consultant and HR partners have opened 240 pre-academic Letter of Intent (LOI) placement slots for eligible 2026 BBA & BCA applicants.',
    actionText: 'Apply for Placement Guarantee',
    actionPath: '/apply',
  },
  {
    id: 'post-2',
    category: 'URGENT',
    title: 'Admissions Desk 2026-27: Saturday Campus Counseling Session',
    timestamp: 'Today, 10:00 AM',
    summary: 'Deekshaam admissions board will host direct parent-student counseling and spot scholarship evaluation this Saturday at the Kundana campus.',
    actionText: 'Book Campus Visit',
    actionPath: '/visit',
  },
  {
    id: 'post-3',
    category: 'ACADEMIC',
    title: 'Bengaluru North University Academic Affiliation & AICTE Approval Gazette',
    timestamp: 'Yesterday',
    summary: 'Official gazette circular for undergraduate degrees including semester syllabus credit structure and NEP 2020 compliance published.',
    actionText: 'View Degree Details',
    actionPath: '/programs',
  },
  {
    id: 'post-4',
    category: 'EVENT',
    title: 'Deekshaam Innovation Labs: Student AI Project Showcase',
    timestamp: 'Sep 21, 2026',
    summary: 'Final year computing students demonstrated real-world automated logistics and enterprise analytics prototypes to corporate recruiters.',
  },
];

interface CampusPulseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const CampusPulseDrawer: React.FC<CampusPulseDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [posts] = useState<PulsePost[]>(SAMPLE_POSTS);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredPosts = selectedCategory === 'ALL'
    ? posts
    : posts.filter((p) => p.category === selectedCategory);

  const getCategoryBadge = (cat: PulsePost['category']) => {
    switch (cat) {
      case 'PLACEMENT':
        return { bg: 'rgba(234, 88, 12, 0.15)', color: '#ea580c', border: 'rgba(234, 88, 12, 0.3)' };
      case 'URGENT':
        return { bg: 'rgba(220, 38, 38, 0.15)', color: '#ef4444', border: 'rgba(220, 38, 38, 0.3)' };
      case 'ACADEMIC':
        return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
      case 'EVENT':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9990,
        background: 'rgba(2, 6, 23, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          background: '#0f172a',
          color: '#ffffff',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* DRAWER HEADER */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 10px #ef4444',
              }}
            />
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                Campus Pulse
              </h2>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Live updates, circulars & recruiter alerts
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            &times;
          </button>
        </div>

        {/* CATEGORY FILTER TABS */}
        <div style={{ padding: '12px 24px', display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          {['ALL', 'PLACEMENT', 'URGENT', 'ACADEMIC', 'EVENT'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? '#c2410c' : 'rgba(255, 255, 255, 0.05)',
                color: selectedCategory === cat ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* POSTS LIST */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredPosts.map((post) => {
            const badge = getCategoryBadge(post.category);
            return (
              <article
                key={post.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px',
                  transition: 'background 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '5px',
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    {post.category}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{post.timestamp}</span>
                </div>

                <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#f8fafc', lineHeight: '1.4' }}>
                  {post.title}
                </h3>
                <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                  {post.summary}
                </p>

                {post.actionText && post.actionPath && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate(post.actionPath!);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#ea580c',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{post.actionText}</span>
                    <Icon name="arrow" size={12} />
                  </button>
                )}
              </article>
            );
          })}
        </div>

        {/* DRAWER FOOTER */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: '#0b132b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Live Feed &middot; Deekshaam Notice Desk
          </span>
          <button
            onClick={() => {
              onClose();
              onNavigate('/news');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            All Archives &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
