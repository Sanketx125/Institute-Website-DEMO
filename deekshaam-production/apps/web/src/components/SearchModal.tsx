import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (query.trim()) {
        setLoading(true);
        try {
          const res = await api.searchSite(query.trim());
          setResults(res || []);
        } catch (err) {
          console.error('Search query failed', err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-panel" onClick={(e) => e.stopPropagation()}>
        <div className="search-row">
          <Icon name="search" size={20} color="#777" />
          <input
            type="text"
            placeholder="Search programs, admissions, hostel, certifications..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button className="icon-btn" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="search-results">
          {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#777' }}>Searching...</div>}

          {!loading && results.length > 0 && (
            <div>
              {results.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(r.url);
                    onClose();
                  }}
                >
                  <span>{r.type}</span>
                  <strong>{r.title}</strong>
                  <small>{r.content ? r.content.slice(0, 110) + '...' : ''}</small>
                </a>
              ))}
            </div>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#777' }}>
              No matches found for "{query}". Try "BBA", "BCA", "hostel", or "admissions".
            </div>
          )}

          {!query.trim() && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
              Type a keyword to discover degree programs, campus facilities, or admission procedures.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
