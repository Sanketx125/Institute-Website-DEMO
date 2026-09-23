import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { NotificationModal, NotificationType } from '../components/NotificationModal';

interface VideoItem {
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
    youtubeId: 'kJQP7kiw5Fk',
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

export const MediaAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'files' | 'videos'>('videos');
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Notification state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<NotificationType>('info');

  const showNotification = (title: string, message: string, type: NotificationType = 'info') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalOpen(true);
  };

  // Video Management State
  const MAX_VIDEOS = 6;
  const [videoList, setVideoList] = useState<VideoItem[]>(() => {
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

  const [showAddVideoForm, setShowAddVideoForm] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoCategory, setNewVideoCategory] = useState('Placement Model');
  const [newVideoDuration, setNewVideoDuration] = useState('03:30');
  const [newVideoDescription, setNewVideoDescription] = useState('');

  const fetchMedia = () => {
    api.getMedia().then((data) => {
      setMediaList(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const saveVideos = (newVideos: VideoItem[]) => {
    setVideoList(newVideos);
    try {
      localStorage.setItem('dbs_custom_youtube_videos', JSON.stringify(newVideos));
      window.dispatchEvent(new Event('dbs_videos_updated'));
    } catch (e) {}
  };

  const extractYoutubeId = (input: string): string | null => {
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = trimmed.match(regex);
    return match ? match[1] : null;
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (videoList.length >= MAX_VIDEOS) {
      showNotification('Limit Reached', `Maximum allowed video cards is ${MAX_VIDEOS}. Please remove an existing card before adding a new one.`, 'warning');
      return;
    }

    const yId = extractYoutubeId(newVideoUrl);
    if (!yId) {
      showNotification('Invalid YouTube URL', 'Please enter a valid YouTube video link or 11-character video ID.', 'error');
      return;
    }

    if (!newVideoTitle.trim()) {
      showNotification('Missing Title', 'Please enter a descriptive title for this YouTube card.', 'warning');
      return;
    }

    const newItem: VideoItem = {
      id: `vid-${Date.now()}`,
      youtubeId: yId,
      title: newVideoTitle.trim(),
      category: newVideoCategory,
      duration: newVideoDuration.trim() || '03:00',
      description: newVideoDescription.trim() || 'Student and corporate experience showcase.',
    };

    const updated = [...videoList, newItem];
    saveVideos(updated);
    setNewVideoUrl('');
    setNewVideoTitle('');
    setNewVideoDescription('');
    setShowAddVideoForm(false);
    showNotification('Video Card Added', `"${newItem.title}" was added to the public video showcase.`, 'success');
  };

  const handleDeleteVideo = (id: string, title: string) => {
    const updated = videoList.filter(v => v.id !== id);
    saveVideos(updated);
    showNotification('Card Removed', `"${title}" has been removed from the video showcase.`, 'info');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', 'General');
    fd.append('altText', file.name);

    try {
      await api.uploadMedia(fd);
      fetchMedia();
      showNotification('Upload Success', 'File successfully uploaded to public media storage.', 'success');
    } catch (err: any) {
      showNotification('Upload Failed', err.message || 'File upload encountered an error.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Media & Content Hub</h1>
          <p style={{ color: '#777', margin: 0, fontSize: '14px' }}>
            Manage homepage YouTube video cards, promotional banners, and brochure assets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'files' ? (
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              <Icon name="laptop" size={16} />
              {uploading ? 'Uploading...' : 'Upload Media Asset'}
              <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddVideoForm(!showAddVideoForm)}
              disabled={videoList.length >= MAX_VIDEOS && !showAddVideoForm}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {showAddVideoForm ? 'Close Video Form' : 'Add YouTube Video Card'}
            </button>
          )}
        </div>
      </div>

      {/* TAB SELECTOR */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('videos')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'videos' ? '2px solid var(--orange)' : '2px solid transparent',
            color: activeTab === 'videos' ? 'var(--orange)' : '#666',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          YouTube Showcase Cards ({videoList.length}/{MAX_VIDEOS})
        </button>
        <button
          onClick={() => setActiveTab('files')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'files' ? '2px solid var(--orange)' : '2px solid transparent',
            color: activeTab === 'files' ? 'var(--orange)' : '#666',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Icon name="document" size={16} />
          Uploaded Static Files & PDFs ({mediaList.length})
        </button>
      </div>

      {/* TAB 1: YOUTUBE VIDEO MANAGER */}
      {activeTab === 'videos' && (
        <div>
          {/* CAPACITY INFO BANNER */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <strong style={{ fontSize: '14px', color: '#0f172a' }}>Homepage Video Showcase Capacity</strong>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                Admin users can link up to 6 curated YouTube video cards displayed on the public landing page.
              </p>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: videoList.length >= MAX_VIDEOS ? '#fff4e5' : '#e0f2fe',
                color: videoList.length >= MAX_VIDEOS ? '#b45309' : '#0284c7',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />
              <span>{videoList.length} of {MAX_VIDEOS} Slots Used</span>
            </div>
          </div>

          {/* ADD VIDEO FORM */}
          {showAddVideoForm && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2ddd8',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.04)',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Link New YouTube Video Card</h3>
              <form onSubmit={handleAddVideo} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <label style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  YouTube Link or Video ID *
                  <input
                    type="text"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="e.g. https://www.youtube.com/watch?v=kJQP7kiw5Fk or kJQP7kiw5Fk"
                    required
                    style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                  />
                  <small style={{ color: '#64748b', fontSize: '12px' }}>Accepts standard YouTube URLs, youtu.be short links, or direct 11-char video IDs.</small>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  Video Title *
                  <input
                    type="text"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    placeholder="e.g. Job Before Academy: Corporate Selection Walkthrough"
                    required
                    style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                    Category
                    <select
                      value={newVideoCategory}
                      onChange={(e) => setNewVideoCategory(e.target.value)}
                      style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                    >
                      <option value="Placement Model">Placement Model</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Campus Life">Campus Life</option>
                      <option value="Corporate Connect">Corporate Connect</option>
                      <option value="Student Voice">Student Voice</option>
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                    Duration
                    <input
                      type="text"
                      value={newVideoDuration}
                      onChange={(e) => setNewVideoDuration(e.target.value)}
                      placeholder="e.g. 04:15"
                      style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                    >
                    </input>
                  </label>
                </div>

                <label style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  Short Card Description
                  <textarea
                    value={newVideoDescription}
                    onChange={(e) => setNewVideoDescription(e.target.value)}
                    placeholder="Brief 1-2 sentence description explaining what applicants will learn from this video."
                    rows={2}
                    style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                  />
                </label>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="submit" className="btn btn-primary">
                    Publish Video Card to Homepage
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowAddVideoForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIDEO CARDS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {videoList.map((vid, idx) => (
              <div
                key={vid.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* THUMBNAIL PREVIEW */}
                <div style={{ position: 'relative', height: '180px', background: '#000' }}>
                  <img
                    src={`https://img.youtube.com/vi/${vid.youtubeId}/hqdefault.jpg`}
                    alt={vid.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(4px)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Card #{idx + 1} &middot; {vid.category}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {vid.duration}
                  </div>
                </div>

                {/* CONTENT */}
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
                    {vid.title}
                  </h4>
                  <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#64748b', lineHeight: 1.5, flex: 1 }}>
                    {vid.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <a
                      href={`https://www.youtube.com/watch?v=${vid.youtubeId}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '12px', color: 'var(--orange)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      Open YouTube Link &rarr;
                    </a>
                    <button
                      onClick={() => handleDeleteVideo(vid.id, vid.title)}
                      style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Delete Card
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: STATIC ASSETS & PDFS */}
      {activeTab === 'files' && (
        <div className="admin-card">
          {loading ? (
            <div>Loading assets...</div>
          ) : mediaList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
              No media uploaded yet. Use the upload button above to add assets.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {mediaList.map((asset) => (
                <div
                  key={asset.id}
                  style={{
                    border: '1px solid #eee',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#faf9f7',
                  }}
                >
                  {asset.mimeType.startsWith('image/') ? (
                    <img src={asset.url} alt={asset.altText} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '160px', display: 'grid', placeItems: 'center', background: '#eee' }}>
                      <Icon name="document" size={40} color="#777" />
                    </div>
                  )}
                  <div style={{ padding: '12px' }}>
                    <strong style={{ fontSize: '13px', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {asset.originalName}
                    </strong>
                    <small style={{ color: '#888', display: 'block', margin: '4px 0 10px' }}>
                      {(asset.size / 1024).toFixed(1)} KB &middot; {asset.category}
                    </small>
                    <button
                      className="btn btn-ghost small full"
                      onClick={() => copyUrl(asset.url, asset.id)}
                    >
                      {copiedId === asset.id ? 'Copied URL!' : 'Copy Asset URL'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BRANDED NOTIFICATION MODAL */}
      <NotificationModal
        isOpen={modalOpen}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};
