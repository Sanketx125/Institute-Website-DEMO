import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';

export interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  category: string;
  duration: string;
  description: string;
}

const DEFAULT_VIDEOS: VideoItem[] = [
  {
    id: 'vid-1',
    youtubeId: 'kJQP7kiw5Fk', // Luis Fonsi or educational placeholder ID
    title: 'Job Before Academy: Inside Deekshaam Corporate Selection Model',
    category: 'Placement Model',
    duration: '04:12',
    description: 'How students secure verified corporate offer letters and consultant backing before starting their degrees.',
  },
  {
    id: 'vid-2',
    youtubeId: 'L_LUpnjgPso',
    title: 'Advanced AI & Computing Laboratories Tour',
    category: 'Infrastructure',
    duration: '03:45',
    description: 'Explore the modern high-performance workstations and real-world project development suites.',
  },
  {
    id: 'vid-3',
    youtubeId: 'JGwWNGJdvx8',
    title: 'Student Life, Hostels & Bengaluru Campus Walkthrough',
    category: 'Campus Life',
    duration: '05:20',
    description: 'Hear from BBA and BCA students living at the Kundana campus near Devanahalli.',
  },
  {
    id: 'vid-4',
    youtubeId: 'fJ9rUzIMcZQ',
    title: 'Industry Mentorship & HR Consultant Roundtable',
    category: 'Corporate Connect',
    duration: '06:10',
    description: 'HR leaders from Bangalore tech and logistics corridors discussing work-integrated training.',
  },
];

export const VideoShowcase: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('dbs_custom_youtube_videos');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_VIDEOS;
  });
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const MAX_VIDEOS = 6;

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem('dbs_custom_youtube_videos');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVideos(parsed);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('dbs_videos_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('dbs_videos_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <section className="section" style={{ background: '#0b132b', color: '#ffffff', padding: '80px 0' }}>
      <div className="container">
        {/* SECTION HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginBottom: '36px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#ea580c', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>
              <span>CAMPUS SPOTLIGHT</span> &middot; <span>VIDEO ARCHIVE</span>
            </div>
            <h2 style={{ fontSize: '34px', fontWeight: 800, margin: '0 0 10px', color: '#ffffff', letterSpacing: '-0.5px' }}>
              Watch Deekshaam in action.
            </h2>
            <p style={{ margin: 0, fontSize: '15px', color: '#94a3b8', maxWidth: '640px' }}>
              Corporate interviews, student orientation, campus infrastructure, and laboratory walk-throughs curated by the media team.
            </p>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '12px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            <span>Active Stack: <strong>{videos.length}/{MAX_VIDEOS} Cards</strong></span>
          </div>
        </div>

        {/* VIDEO CARDS GRID */}
        <div
          className="video-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {videos.map((vid) => (
            <article
              key={vid.id}
              onClick={() => setActiveVideo(vid)}
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(234, 88, 12, 0.5)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* VIDEO THUMBNAIL */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#020617', overflow: 'hidden' }}>
                <img
                  src={`https://img.youtube.com/vi/${vid.youtubeId}/hqdefault.jpg`}
                  alt={vid.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85, transition: 'transform 0.3s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
                
                {/* PLAY BUTTON OVERLAY */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'rgba(194, 65, 12, 0.92)',
                    boxShadow: '0 0 20px rgba(194, 65, 12, 0.8)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#ffffff',
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>

                {/* DURATION BADGE */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0, 0, 0, 0.82)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 7px',
                    borderRadius: '5px',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {vid.duration}
                </span>

                {/* CATEGORY TAG */}
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(15, 36, 64, 0.85)',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 9px',
                    borderRadius: '6px',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {vid.category}
                </span>
              </div>

              {/* CARD DETAILS */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3
                  style={{
                    margin: '0 0 8px',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: '1.4',
                  }}
                >
                  {vid.title}
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', flex: 1 }}>
                  {vid.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ea580c', fontSize: '13px', fontWeight: 600 }}>
                  <span>Watch Video</span>
                  <Icon name="arrow" size={14} />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* LIGHTBOX MODAL PLAYER */}
        {activeVideo && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              background: 'rgba(2, 6, 23, 0.88)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
            onClick={() => setActiveVideo(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '860px',
                background: '#0f172a',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
                    {activeVideo.category}
                  </span>
                  <strong style={{ color: '#ffffff', fontSize: '15px' }}>{activeVideo.title}</strong>
                </div>

                <button
                  onClick={() => setActiveVideo(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#ffffff',
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

              {/* EMBEDDED IFRAME */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=1`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
