import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@deekshaam/ui';

interface Landmark {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  lat: number;
  lng: number;
  zoom: number;
  tag: string;
  details: string;
}

const LANDMARKS: Landmark[] = [
  {
    id: 'campus',
    name: 'Deekshaam Business School',
    subtitle: 'MY Samruddhi Nagar, Kundana, Devanahalli, Bangalore - 562110',
    category: 'Main Campus',
    lat: 13.2611403,
    lng: 77.5988094,
    zoom: 16,
    tag: 'Academic Block',
    details: 'AICTE-approved state-of-the-art campus, computer laboratories, and academic auditoriums.',
  },
  {
    id: 'airport',
    name: 'Kempegowda International Airport (BLR)',
    subtitle: '15 mins drive via NH 44 / Airport Link Road',
    category: 'Transit Gateway',
    lat: 13.1986,
    lng: 77.7066,
    zoom: 13,
    tag: '15 Mins Away',
    details: 'Seamless domestic and international connectivity for outstation students and visiting corporate faculty.',
  },
  {
    id: 'aerospace',
    name: 'Devanahalli Aerospace & Tech SEZ',
    subtitle: 'North Bengaluru High-Growth Corporate Corridor',
    category: 'Corporate Hub',
    lat: 13.2215,
    lng: 77.6842,
    zoom: 13,
    tag: 'Recruiter Zone',
    details: 'Home to global aerospace, technology, logistics, and supply-chain corporations powering student live projects.',
  },
  {
    id: 'hostel',
    name: 'Student Living & Residential Quarters',
    subtitle: 'Dedicated student hostels with shuttle transit',
    category: 'Residence',
    lat: 13.2580,
    lng: 77.6020,
    zoom: 15,
    tag: 'Campus Living',
    details: 'High-speed Wi-Fi, hygienic cafeteria, recreational sports, and 24/7 security surveillance.',
  },
];

export const CampusMap: React.FC = () => {
  const [activeLandmark, setActiveLandmark] = useState<Landmark>(LANDMARKS[0]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  // Dynamically load Leaflet script & stylesheet
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    // Add Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Add Leaflet JS
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      const script = document.getElementById('leaflet-js') as HTMLScriptElement;
      script.addEventListener('load', () => setLeafletLoaded(true));
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Create map centered on Deekshaam Business School
    const map = L.map(mapContainerRef.current, {
      center: [LANDMARKS[0].lat, LANDMARKS[0].lng],
      zoom: LANDMARKS[0].zoom,
      zoomControl: false,
      scrollWheelZoom: false, // Prevent accidental scrolling when navigating page
    });

    // Add CartoDB DarkMatter tiles for the modern dark geospatial look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control in top-left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Custom Glowing Pin Marker
    const createCustomIcon = (isActive: boolean) => {
      return L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background: ${isActive ? 'rgba(6, 182, 212, 0.35)' : 'rgba(194, 65, 12, 0.3)'};
              animation: mapPulse 2s infinite ease-in-out;
            "></div>
            <div style="
              position: relative;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: ${isActive ? '#06b6d4' : '#c2410c'};
              border: 2px solid #ffffff;
              box-shadow: 0 0 14px ${isActive ? 'rgba(6, 182, 212, 0.8)' : 'rgba(194, 65, 12, 0.6)'};
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    // Add markers for all landmarks
    LANDMARKS.forEach((item) => {
      const marker = L.marker([item.lat, item.lng], {
        icon: createCustomIcon(item.id === LANDMARKS[0].id),
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; padding: 4px 2px;">
          <strong style="color: #0f2440; font-size: 14px; display: block; margin-bottom: 2px;">${item.name}</strong>
          <span style="color: #6b7280; font-size: 11px;">${item.subtitle}</span>
        </div>
      `);

      marker.on('click', () => {
        setActiveLandmark(item);
      });

      markersRef.current[item.id] = marker;
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [leafletLoaded]);

  // Handle Landmark Selection Fly-To
  const handleSelectLandmark = (item: Landmark) => {
    setActiveLandmark(item);
    if (!mapInstanceRef.current) return;

    mapInstanceRef.current.flyTo([item.lat, item.lng], item.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    const marker = markersRef.current[item.id];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 1000);
    }
  };

  return (
    <section className="section geospatial-section" style={{ background: '#091526', color: '#ffffff', padding: '80px 0' }}>
      <div className="container">
        {/* SECTION HEADER */}
        <div style={{ marginBottom: '40px', maxWidth: '780px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#06b6d4', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
            <span>08 — WHERE</span> &middot; <span>CAMPUS & CONNECTIVITY</span>
          </div>
          <h2 style={{ fontSize: '38px', fontWeight: 800, margin: '0 0 14px', letterSpacing: '-0.8px', color: '#ffffff' }}>
            The campus, on the map.
          </h2>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.6', color: '#94a3b8' }}>
            Positioned in North Bengaluru’s high-growth Aerospace and Innovation corridor, close to corporate parks,
            rapid transit networks, and Kempegowda International Airport.
          </p>
        </div>

        {/* MAP & CARDS GRID */}
        <div
          className="map-layout-grid"
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* MAP CANVAS */}
          <div
            style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              minHeight: '440px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#0b132b',
            }}
          >
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '440px' }} />

            {/* MAP OVERLAY QUICK CHIP */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                zIndex: 1000,
                background: 'rgba(11, 19, 43, 0.88)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12px',
                color: '#e2e8f0',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 8px #06b6d4' }} />
              <span>Verified Coordinates: <strong>13.2611° N, 77.5988° E</strong></span>
            </div>
          </div>

          {/* LANDMARK INTERACTIVE SELECTION LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
            {LANDMARKS.map((item) => {
              const isSelected = activeLandmark.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectLandmark(item)}
                  style={{
                    background: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: isSelected ? '#06b6d4' : '#64748b',
                          boxShadow: isSelected ? '0 0 10px #06b6d4' : 'none',
                        }}
                      />
                      <strong style={{ fontSize: '15px', color: isSelected ? '#ffffff' : '#e2e8f0', fontWeight: 700 }}>
                        {item.name}
                      </strong>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#38bdf8' : '#94a3b8',
                        fontWeight: 600,
                      }}
                    >
                      {item.tag}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 6px 20px', fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                    {item.subtitle}
                  </p>
                  <p style={{ margin: '0 0 0 20px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4', opacity: isSelected ? 1 : 0.7 }}>
                    {item.details}
                  </p>
                </div>
              );
            })}

            {/* DIRECT GOOGLE MAPS NAVIGATION BUTTON */}
            <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Plus Code: <code style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>7H6X+FG Bannimagala</code>
              </div>
              <a
                href="https://www.google.com/maps/place/Deekshaam+Business+School/@13.2611403,77.5988094,17z"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#c2410c',
                  color: '#ffffff',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#ea580c')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#c2410c')}
              >
                Directions in Google Maps <Icon name="arrow" size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
