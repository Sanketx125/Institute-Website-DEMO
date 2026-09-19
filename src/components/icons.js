const p = (d,extra='') => `<path d="${d}" ${extra}/>`;
export function icon(name, size=20){
  const base = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  const map = {
    arrow:`${p('M5 12h14')}${p('m13 6 6 6-6 6')}`,
    search:`<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`,
    phone:`${p('M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92z')}`,
    map:`${p('M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z')}<circle cx="12" cy="10" r="2.4"/>`,
    menu:`${p('M4 6h16')}${p('M4 12h16')}${p('M4 18h16')}`,
    close:`${p('M6 6l12 12')}${p('M18 6 6 18')}`,
    check:`${p('m5 12 4 4L19 6')}`,
    chevron:`${p('m9 18 6-6-6-6')}`,
    laptop:`<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>`,
    briefcase:`<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>`,
    spark:`${p('M12 3l1.3 4.2L17.5 8.5l-4.2 1.3L12 14l-1.3-4.2-4.2-1.3 4.2-1.3L12 3z')}<path d="M18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/>`,
    document:`<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 13h6M9 17h6"/>`,
    calendar:`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>`,
    user:`<circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/>`,
    shield:`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
    grid:`<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>`,
    message:`<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>`
  };
  return `<svg ${base}>${map[name] || map.arrow}</svg>`;
}
