import React from 'react';
import { Helmet } from 'react-helmet';

interface SeoProps {
  title: string;
  description: string;
  image?: string | undefined;
  type?: 'website' | undefined| 'product' | 'article' | 'profile' | 'event';
  canonicalUrl?: string | undefined;
  schemaData?: Record<string, unknown> | undefined;
}

export const SEO: React.FC<SeoProps> = ({
  title,
  description,
  image,
  type = 'website',
  canonicalUrl,
  schemaData,
}) => {
  const siteUrl = window.location.origin;
  const url = canonicalUrl || window.location.href;
  const defaultImage = `${siteUrl}/lovable-uploads/542900f1-cca8-40b9-bdb9-dafcfe4a592e.png`;

  // Format schema.org JSON-LD data if provided
  const schemaJson = schemaData
    ? JSON.stringify({
        '@context': 'https://schema.org',
          ...schemaData,
      })
    : null;

  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{title}</title>
      <meta name='description' content={description} />

      {/* Canonical link */}
      <link rel='canonical' href={url} />

      {/* Open Graph data */}
      <meta property='og:title' content={title} />
      <meta property='og:description' content={description} />
      <meta property='og:url' content={url} />
      <meta property='og:type' content={type} />
      <meta property='og:image' content={image || defaultImage} />
      <meta property='og:image:width' content='1200' />
      <meta property='og:image:height' content='630' />
      <meta property='og:site_name' content='Commonly' />

      {/* Twitter Card data */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={title} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={image || defaultImage} />
      <meta name='twitter:site' content='@commonlyapp' />

      {/* JSON-LD structured data */}
      {schemaJson && <script type='application/ld+json'>{schemaJson}</script>}
    </Helmet>
  );
};
