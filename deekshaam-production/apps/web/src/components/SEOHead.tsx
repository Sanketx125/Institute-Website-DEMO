import React, { useEffect } from 'react';
import { PAGE_META, SITE_NAME, DEFAULT_SHARE_IMAGE } from '@deekshaam/types';

// Path the server rendered; its page-level JSON-LD stays valid until the user navigates away.
const SSR_PATH = window.location.pathname;

interface SEOHeadProps {
  /** Defaults to the shared PAGE_META entry for canonicalPath (same text the server renders). */
  title?: string;
  description?: string;
  canonicalPath?: string;
  image?: string;
  /** When true, marks the page noindex,follow (thin/duplicate filter combos, transactional pages). */
  noindex?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ canonicalPath = '', image, ...props }) => {
  const meta = PAGE_META[canonicalPath || '/'];
  const title = props.title || meta?.title || SITE_NAME;
  const description = props.description || meta?.description || PAGE_META['/'].description;
  const noindex = props.noindex ?? meta?.noindex ?? false;
  useEffect(() => {
    const fullTitle = `${title} | ${SITE_NAME}`;
    const canonicalUrl = `${window.location.origin}${canonicalPath || '/'}`;
    const ogImageUrl = new URL(image || DEFAULT_SHARE_IMAGE, window.location.origin).href;
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
    robots.setAttribute('content', noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');

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

    // JSON-LD is server-rendered only (apps/api/src/seo/render.ts): crawlers load each URL
    // fresh, so a client copy would only drift. Drop page blocks once the user navigates away.
    if (canonicalPath !== SSR_PATH) document.querySelectorAll('script[data-ssr]').forEach((el) => el.remove());
  }, [title, description, canonicalPath, image, noindex]);

  return null;
};
