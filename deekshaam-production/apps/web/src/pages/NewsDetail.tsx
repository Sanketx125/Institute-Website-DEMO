import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';

interface NewsDetailProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const NewsDetail: React.FC<NewsDetailProps> = ({ slug, onNavigate }) => {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getNewsItem(slug)
      .then((data) => {
        setItem(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    api.trackEvent({ eventType: 'page_view', pagePath: `/news/${slug}` }).catch(() => {});
  }, [slug]);

  if (loading) {
    return <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>Loading article...</div>;
  }

  if (!item) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Article Not Found</h2>
        <button className="btn btn-primary" onClick={() => onNavigate('/news')}>
          Return to News
        </button>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={item.title}
        description={item.summary || item.content.slice(0, 160)}
        canonicalPath={`/news/${item.slug}`}
      />

      <section className="page-hero compact">
        <div className="container" style={{ maxWidth: '820px' }}>
          <div className="crumbs">
            <a href="/news" onClick={(e) => { e.preventDefault(); onNavigate('/news'); }}>
              News
            </a>
            <span>/</span>
            <span>{item.category}</span>
          </div>
          <span className="eyebrow">{item.category} &middot; {item.date}</span>
          <h1 style={{ fontSize: '38px', margin: '12px 0 16px' }}>{item.title}</h1>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '820px', lineHeight: '1.8', fontSize: '16px', color: '#333' }}>
          {item.summary && (
            <p style={{ fontSize: '18px', fontWeight: 500, color: '#555', marginBottom: '24px', borderLeft: '3px solid var(--orange)', paddingLeft: '16px' }}>
              {item.summary}
            </p>
          )}

          <div style={{ whiteSpace: 'pre-line' }}>{item.content}</div>

          {item.href && (
            <div style={{ marginTop: '36px' }}>
              <a href={item.href} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Read Original Source <Icon name="arrow" size={16} />
              </a>
            </div>
          )}

          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--line)' }}>
            <button className="btn btn-ghost" onClick={() => onNavigate('/news')}>
              &larr; Back to All Articles
            </button>
          </div>
        </div>
      </section>
    </>
  );
};
