import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { Dialog } from './Dialog';
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
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    let active = true;
    setError('');
    const timer = setTimeout(async () => {
      if (query.trim()) {
        setLoading(true);
        try {
          const res = await api.searchSite(query.trim());
          if (active) setResults(res || []);
        } catch (err) {
          if (active) { setResults([]); setError('Search is unavailable right now. Please try again.'); }
        } finally {
          if (active) setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 200);

    return () => { active = false; clearTimeout(timer); };
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
    <Dialog open={isOpen} onClose={onClose} label="Search Deekshaam" className="site-search-dialog">
      <div>
        <div className="search-row">
          <Icon name="search" size={20} color="#777" />
          <input
            aria-label="Search the website"
            type="text"
            placeholder="Search programs, admissions, hostel, certifications..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button className="icon-btn" aria-label="Close search" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="search-results" aria-live="polite">
          {error && <p role="alert" className="inline-feedback error">{error}</p>}
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

          {!loading && !error && query.trim() && results.length === 0 && (
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
    </Dialog>
  );
};
