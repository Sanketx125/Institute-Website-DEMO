import React, { useState } from 'react';
import { Icon } from '@deekshaam/ui';

const places = [
  { name: 'Our campus', label: 'Deekshaam Business School', lat: 13.2611403, lng: 77.5988094, description: 'MY Samruddhi Nagar, Kundana, Devanahalli, Bengaluru 562110.', detail: 'Come for a campus walk. Meet our admissions team and explore where you could spend your next chapter.' },
  { name: 'Airport connection', label: 'Kempegowda International Airport', lat: 13.1986, lng: 77.7066, description: 'Arriving from outside Bengaluru? Plan your journey from BLR to our Devanahalli campus.', detail: 'Travel time depends on your route and traffic. Contact our team for help planning your visit.' },
];

export const CampusMap: React.FC = () => {
  const [selected, setSelected] = useState(0);
  const place = places[selected];
  const bbox = `${place.lng - 0.035},${place.lat - 0.022},${place.lng + 0.035},${place.lat + 0.022}`;
  return <section className="section campus-location">
    <div className="container">
      <div className="section-head"><span className="eyebrow">Visit Deekshaam</span><h2>A little closer to your future.</h2><p>Discover our campus in Devanahalli, North Bengaluru. We would love to show you around.</p></div>
      <div className="location-layout">
        <div className="location-details">
          <div className="location-tabs" aria-label="Choose a location">{places.map((item, i) => <button key={item.name} aria-pressed={selected === i} className={selected === i ? 'selected' : ''} onClick={() => setSelected(i)}>{item.name}</button>)}</div>
          <div className="location-address" aria-live="polite"><span className="eyebrow">{selected === 0 ? 'Learn here. Belong here.' : 'Getting here'}</span><h3>{place.label}</h3><p>{place.description}</p><p>{place.detail}</p></div>
          <a className="btn btn-primary" href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`} target="_blank" rel="noopener noreferrer">Get directions <Icon name="arrow" size={16} /></a>
          <a className="location-contact" href="tel:+918971435297"><Icon name="phone" size={16} /> Speak to our campus team</a>
        </div>
        <div className="location-map"><iframe key={selected} title={`Map showing ${place.label}`} src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${place.lat},${place.lng}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /><div className="map-caption"><span>Explore the neighbourhood</span><a href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=14/${place.lat}/${place.lng}`} target="_blank" rel="noopener noreferrer">Open full map <Icon name="arrow" size={14} /></a></div></div>
      </div>
    </div>
  </section>;
};
