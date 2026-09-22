import React, { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  structuredData?: Record<string, any>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = 'Deekshaam Business School offers BBA, BCA, and B.Com undergraduate degrees in Bangalore with AICTE approval and Bengaluru North University affiliation.',
  canonicalPath = '',
  structuredData,
}) => {
  useEffect(() => {
    document.title = `${title} | Deekshaam Business School`;

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('content', `${window.location.origin}${canonicalPath}`);

    // JSON-LD Structured Data
    const defaultSchema = {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'Deekshaam Business School',
      alternateName: 'DBS',
      url: window.location.origin,
      logo: 'https://media.collegedekho.com/media/img/institute/logo/download_4_K3JEM2R.png?width=96',
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
  }, [title, description, canonicalPath, structuredData]);

  return null;
};
