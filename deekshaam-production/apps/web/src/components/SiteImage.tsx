import React, { useEffect, useState } from 'react';
const bundledImages = new Set(["2.png", "arts-1-qlt7sxguf5drb2bhqpcmn8bgp7vsuhsk0s0x3a09zc.jpg", "BCA.png", "Deekshaam-Buisness-School-Img-1.png", "DSC_4910-1-233x300.jpg", "DSC_4912-qqsttij3ttx45tgp6ad1j0wzronhumosx27gwai7fg.jpg", "Hcl.jpg", "hdfc-bank.webp", "Hector.webp", "ITC.jpg", "Johnsons-Control.webp", "Kellogs.webp", "MTR.webp", "Sales-Force.jpg", "Screenshot-2025-07-25-102127.jpg"]);
function localSource(src?: string) {
  if (!src) return '';
  try {
    const url = new URL(src, window.location.origin);
    const filename = url.pathname.split('/').pop() || '';
    if (url.hostname === 'deekshaedu.in' && bundledImages.has(filename)) return `/images/${filename}`;
  } catch { /* Preserve CMS paths that are not absolute URLs. */ }
  return src;
}
export const SiteImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ src, alt = '', onError, ...props }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (failed || !src) return <span className={`image-unavailable ${props.className || ''}`} role="img" aria-label={alt}><span>{alt || 'Deekshaam Business School'}</span></span>;
  return <img {...props} src={localSource(src)} alt={alt} onError={event => { setFailed(true); onError?.(event); }} />;
};
