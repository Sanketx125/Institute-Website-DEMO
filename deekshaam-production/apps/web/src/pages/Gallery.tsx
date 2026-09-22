import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';

interface GalleryProps {
  onNavigate: (path: string) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    api.getGallery().then(setItems).catch(console.error);
    api.trackEvent({ eventType: 'page_view', pagePath: '/gallery' }).catch(() => {});
  }, []);

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))];
  const filtered = activeCategory === 'All' ? items : items.filter((i) => i.category === activeCategory);

  return (
    <>
      <SEOHead
        title="Campus Photo Gallery"
        description="View photographs of the Deekshaam Business School campus, academic laboratories, seminar halls, and student life."
        canonicalPath="/gallery"
      />

      <section className="page-hero compact">
        <div className="container">
          <span className="eyebrow">Campus In Pictures</span>
          <h1>Photo Gallery</h1>
          <p>Explore our classrooms, laboratories, collaborative study spaces, and campus events.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* CATEGORY FILTER */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`btn small ${activeCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* GALLERY GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {filtered.map((item, i) => (
              <article
                key={i}
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{ width: '100%', height: '260px', objectFit: 'cover' }}
                />
                <div style={{ padding: '16px' }}>
                  <span className="eyebrow">{item.category}</span>
                  <h3 style={{ margin: '6px 0 4px', fontSize: '18px' }}>{item.title}</h3>
                  {item.caption && <p style={{ color: '#777', fontSize: '12px', margin: 0 }}>{item.caption}</p>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
