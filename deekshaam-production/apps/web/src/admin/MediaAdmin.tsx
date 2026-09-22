import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';

export const MediaAdmin: React.FC = () => {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMedia = () => {
    api.getMedia().then((data) => {
      setMediaList(data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchMedia();
  }, []);

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
      alert('File successfully uploaded to public media storage.');
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px' }}>Public Media Library</h1>
          <p style={{ color: '#777', margin: 0 }}>Manage public banners, promotional assets, and brochure PDFs.</p>
        </div>

        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
          <Icon name="laptop" size={16} />
          {uploading ? 'Uploading...' : 'Upload Media Asset'}
          <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
        </label>
      </div>

      <div className="admin-card">
        {loading ? (
          <div>Loading assets...</div>
        ) : mediaList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No media uploaded yet. Use the upload button above to add assets.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
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
    </div>
  );
};
