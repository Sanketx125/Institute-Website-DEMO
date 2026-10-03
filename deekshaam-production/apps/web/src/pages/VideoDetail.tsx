import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import type { VideoItem } from '../components/VideoShowcase';

interface VideoDetailProps {
  id: string;
  onNavigate: (path: string) => void;
}

const SECTION: Record<string, [string, string]> = {
  'Career stories': ['/placements', 'Placements'],
  'Our story': ['/about', 'About'],
};

/** Indexable watch page: Google indexes videos from pages where the video is the main content. */
export const VideoDetail: React.FC<VideoDetailProps> = ({ id, onNavigate }) => {
  const [video, setVideo] = useState<VideoItem | null | undefined>(undefined);

  useEffect(() => {
    api.getVideos().then((rows: VideoItem[]) => setVideo(rows.find((v) => v.youtubeId === id) || null)).catch(() => setVideo(null));
  }, [id]);

  if (video === undefined) return <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>Loading video...</div>;
  if (!video) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <SEOHead title="Video not found" noindex />
        <h2>Video Not Found</h2>
        <button className="btn btn-primary" onClick={() => onNavigate('/')}>Return to Homepage</button>
      </div>
    );
  }

  const [backPath, backLabel] = SECTION[video.category] || ['/campus', 'Campus'];
  return (
    <>
      <SEOHead title={video.title} description={video.description || video.title} canonicalPath={`/videos/${video.youtubeId}`} image={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} />
      <section className="section">
        <div className="container" style={{ maxWidth: '960px' }}>
          <div className="crumbs">
            <a href={backPath} onClick={(e) => { e.preventDefault(); onNavigate(backPath); }}>{backLabel}</a>
            <span>/</span>
            <span>Video</span>
          </div>
          <h1 style={{ fontSize: '34px', margin: '12px 0 20px' }}>{video.title}</h1>
          <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
            <iframe
              title={video.title}
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {video.description && <p style={{ marginTop: '20px', lineHeight: 1.8 }}>{video.description}</p>}
        </div>
      </section>
    </>
  );
};
