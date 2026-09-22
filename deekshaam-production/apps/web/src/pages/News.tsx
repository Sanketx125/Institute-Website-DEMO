import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';

interface NewsProps {
  onNavigate: (path: string) => void;
}

export const News: React.FC<NewsProps> = ({ onNavigate }) => {
  const [newsList, setNewsList] = useState<any[]>([]);

  useEffect(() => {
    api.getNews().then(setNewsList).catch(console.error);
    api.trackEvent({ eventType: 'page_view', pagePath: '/news' }).catch(() => {});
  }, []);

  return (
    <>
      <SEOHead
        title="News, Articles & Career Insights"
        description="Latest institutional news, academic updates, and career advice from Deekshaam Business School."
        canonicalPath="/news"
      />

      <section className="page-hero compact">
        <div className="container">
          <span className="eyebrow">Institutional Updates</span>
          <h1>News, Insights & Academic Notifications</h1>
          <p>Read about campus happenings, educational guidance, and career planning resources.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="news-grid">
            {newsList.map((item, i) => (
              <article key={i} className="news-card" style={{ cursor: 'pointer' }}>
                <span className="news-meta">
                  {item.category} &middot; {item.date}
                </span>
                <h3 style={{ margin: '12px 0 8px' }}>{item.title}</h3>
                <p>{item.summary || item.content.slice(0, 120) + '...'}</p>
                <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                  <a
                    href={`/news/${item.slug}`}
                    className="text-link"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/news/${item.slug}`);
                    }}
                  >
                    Read Full Article <Icon name="arrow" size={15} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
