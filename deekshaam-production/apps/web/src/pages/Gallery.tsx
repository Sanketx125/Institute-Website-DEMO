import { SiteImage } from '../components/SiteImage';
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import { Dialog } from '../components/Dialog';
import { Icon } from '@deekshaam/ui';

interface GalleryProps {
  onNavigate: (path: string) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  useEffect(() => {
    api.getGallery().then((res) => setItems(res || [])).catch(console.error);
    api.trackEvent({ eventType: 'page_view', pagePath: '/gallery' }).catch(() => {});
  }, []);

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))];
  const filtered = activeCategory === 'All' ? items : items.filter((i) => i.category === activeCategory);

  return (
    <>
      <SEOHead canonicalPath="/gallery" title="Campus Photo Gallery | Deekshaam Business School" />

      <section className="page-hero compact">
        <div className="container">
          <span className="eyebrow">Campus In Pictures</span>
          <h1>See life at Deekshaam.</h1>
          <p>A closer look at our campus, learning spaces and community, through images chosen by the Deekshaam team.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* CATEGORY FILTER */}
          <div className="gallery-filters" role="group" aria-label="Filter gallery photos">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn small ${activeCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* GALLERY GRID */}
          <div className="gallery-page-grid">
            {filtered.map((item, i) => (
              <article
                key={item.id || i}
                className="gallery-page-card"
                onClick={() => setSelectedPhoto(item)}
                style={{ cursor: 'pointer' }}
                title="Click to view full photo"
              >
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  <SiteImage
                    src={item.imageUrl}
                    alt={item.title || 'Deekshaam Campus'}
                    loading="lazy"
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: '10px',
                      bottom: '10px',
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Icon name="search" size={12} /> View
                  </div>
                </div>
                <div>
                  <span className="eyebrow">{item.category || 'Campus'}</span>
                  <h3>{item.title}</h3>
                  {item.caption && <p>{item.caption}</p>}
                </div>
              </article>
            ))}
          </div>

          {!filtered.length && (
            <div className="story-empty">
              <div>
                <h2>No photos in this collection yet.</h2>
                <p>New campus photographs will appear here as they are added by the campus team.</p>
              </div>
              <button className="btn btn-ghost" onClick={() => onNavigate('/campus')}>
                Explore campus life
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FULL PHOTO LIGHTBOX DIALOG */}
      {selectedPhoto && (
        <Dialog
          open={true}
          onClose={() => setSelectedPhoto(null)}
          label={selectedPhoto.title || 'Campus Photo'}
          className="workspace-editor"
        >
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ maxHeight: '70vh', overflow: 'hidden', borderRadius: '10px', background: '#000', marginBottom: '16px' }}>
              <SiteImage
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.title}
                style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
              />
            </div>
            <span className="eyebrow" style={{ display: 'inline-block', marginBottom: '6px' }}>
              {selectedPhoto.category || 'Campus Life'}
            </span>
            <h2 style={{ fontSize: '20px', margin: '0 0 8px', color: '#0f172a' }}>{selectedPhoto.title}</h2>
            {selectedPhoto.caption && (
              <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '600px', margin: '0 auto 16px' }}>
                {selectedPhoto.caption}
              </p>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => setSelectedPhoto(null)}>
              Close
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
};
