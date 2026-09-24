import { SiteImage } from '../components/SiteImage';
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
        description="Browse campus photographs and clearly labeled program visuals selected by the Deekshaam Business School team."
        canonicalPath="/gallery"
      />

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
                key={i}
                className="gallery-page-card"
              >
                <SiteImage
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                />
                <div>
                  <span className="eyebrow">{item.category}</span>
                  <h3>{item.title}</h3>
                  {item.caption && <p>{item.caption}</p>}
                </div>
              </article>
            ))}
          </div>
          {!filtered.length && <div className="story-empty"><div><h2>No photos in this collection yet.</h2><p>New campus photographs will appear here as they are added.</p></div><button className="btn btn-ghost" onClick={() => onNavigate('/campus')}>Explore campus life</button></div>}
        </div>
      </section>
    </>
  );
};
