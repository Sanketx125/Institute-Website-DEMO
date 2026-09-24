import React, { useEffect } from 'react';

const SITE_NAME = 'Deekshaam Business School';
const DEFAULT_OG_IMAGE = '/logo.svg';

interface SEOHeadProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  structuredData?: Record<string, any>;
  /** When true, marks the page noindex,follow (thin/duplicate filter combos). */
  noindex?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = 'Deekshaam Business School offers BBA, BCA, and B.Com undergraduate degrees in Bangalore with AICTE approval and Bengaluru North University affiliation.',
  canonicalPath = '',
  structuredData,
  noindex = false,
}) => {
  useEffect(() => {
    const fullTitle = `${title} | ${SITE_NAME}`;
    const canonicalUrl = `${window.location.origin}${canonicalPath}`;
    const ogImageUrl = `${window.location.origin}${DEFAULT_OG_IMAGE}`;
    document.title = fullTitle;

    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', description);

    // Faceted-navigation guard: thin filter combinations stay out of the index
    // but keep their links followed so equity still flows to detail pages.
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    robots.setAttribute('content', noindex ? 'noindex,follow' : 'index,follow');

    // Open Graph
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:image', ogImageUrl);

    // Twitter cards
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImageUrl);

    // Canonical URL (uses href, not content)
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // JSON-LD Structured Data
    const defaultSchema = {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'Deekshaam Business School',
      alternateName: 'DBS',
      url: window.location.origin,
      logo: ogImageUrl,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Venkatpura, Kundana, Devanhalli Taluk',
        addressLocality: 'Bangalore',
        postalCode: '562110',
        addressRegion: 'Karnataka',
        addressCountry: 'India',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-8971435297',
        contactType: 'Admissions',
        email: 'admission@deekshaedu.in',
      },
    };

    let scriptTag = document.querySelector('script#structured-data');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'structured-data';
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(structuredData || defaultSchema);
  }, [title, description, canonicalPath, structuredData, noindex]);

  return null;
};
