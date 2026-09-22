import React, { useState } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';

interface AIChatbotProps {
  onNavigate: (path: string) => void;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'bot'; text: string }>>([
    {
      role: 'bot',
      text: 'Hello! I am Deeksha Guide, your virtual assistant. Ask me anything about our undergraduate programs, eligibility, hostel facilities, admissions, or placements.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = query.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await api.askAI(userMsg);
      setMessages((prev) => [...prev, { role: 'bot', text: res.reply || 'Thank you for your enquiry.' }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'I am currently unable to answer that directly. Please connect with our admissions office at +91 8971435297 or request a callback on the Contact page.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'What is BCA eligibility?',
    'Hostel and campus facilities?',
    'How do I apply online?',
    'Recruiters and career outcomes?',
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button className="ai-fab" onClick={() => setIsOpen(true)} title="Ask Deeksha Guide">
        <Icon name="robot" size={22} />
        <span>Ask Deeksha Guide</span>
      </button>

      {/* Slide-out Chat Panel */}
      <div className={`ai-panel ${isOpen ? 'open' : ''}`}>
        <div className="ai-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--orange)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Icon name="robot" size={20} color="#fff" />
            </div>
            <div>
              <strong style={{ fontSize: '15px' }}>Deeksha Guide</strong>
              <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>Official Assistant &middot; Online</div>
            </div>
          </div>
          <button className="icon-btn" onClick={() => setIsOpen(false)}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="ai-body">
          {messages.map((m, i) => (
            <div key={i} className={`ai-message ${m.role}`}>
              {m.text}
            </div>
          ))}

          {loading && (
            <div className="ai-message bot" style={{ fontStyle: 'italic', color: '#777' }}>
              Thinking...
            </div>
          )}

          {messages.length === 1 && (
            <div style={{ display: 'grid', gap: '6px', marginTop: '10px' }}>
              <span style={{ fontSize: '11px', color: '#888', fontWeight: 600 }}>Suggested Questions:</span>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  style={{
                    background: '#fff',
                    border: '1px solid #e0dcd7',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ai-input">
          <input
            type="text"
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="btn btn-primary small" onClick={() => handleSend()} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </>
  );
};
