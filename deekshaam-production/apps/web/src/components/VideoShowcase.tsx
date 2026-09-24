import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { Dialog } from './Dialog';
import { api } from '../services/api';
export interface VideoItem { id: string; youtubeId: string; title: string; category: string; duration: string; description: string; }
export const VideoShowcase: React.FC<{ category?: string; title?: string; description?: string }> = ({ category, title = 'There is more to life here.', description = 'Meet the people, explore the spaces and get a feel for Deekshaam.' }) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [active, setActive] = useState<VideoItem | null>(null);
  useEffect(() => {
    let active = true;
    api.getVideos().then(data => { if (active) setVideos((category ? data.filter((video: VideoItem) => video.category === category) : data).slice(0, 6)); }).catch(() => {});
    return () => { active = false; };
  }, [category]);
  if (!videos.length) return null;
  return <section className="section campus-videos"><div className="container">
    <div className="section-head"><span className="eyebrow">Through our lens</span><h2>{title}</h2><p>{description}</p></div>
    <div className="video-grid">{videos.map((video, i) => <button className="campus-video-card" key={`${video.id}-${i}`} onClick={() => setActive(video)} aria-label={`Watch ${video.title}`}><div className="video-cover"><img src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" /><span className="video-play" aria-hidden="true">&#9654;</span>{video.duration && <span className="video-duration">{video.duration}</span>}</div><div className="video-copy"><span className="eyebrow">{video.category}</span><h3>{video.title}</h3><p>{video.description}</p><span className="text-link">Watch the story <Icon name="arrow" size={14} /></span></div></button>)}</div>
    <Dialog open={!!active} onClose={() => setActive(null)} label={active?.title || 'Campus video'} className="video-dialog">{active && <><div className="dialog-heading"><h2>{active.title}</h2><button className="icon-btn" aria-label="Close video" onClick={() => setActive(null)}><Icon name="close" size={20} /></button></div><iframe src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}?autoplay=1`} title={active.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></>}</Dialog>
  </div></section>;
};
