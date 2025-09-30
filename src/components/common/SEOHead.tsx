import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string | undefined;
  description?: string | undefined;
  keywords?: string[] | undefined;
  image?: string | undefined;
  url?: string | undefined;
  type?: 'website' | undefined| 'article' | 'profile' | 'music.song' | 'video.other';
  author?: string | undefined;
  publishedTime?: string | undefined;
  modifiedTime?: string | undefined;
  section?: string | undefined;
  tags?: string[] | undefined;
  noIndex?: boolean | undefined;
  canonical?: string | undefined;
  alternateLanguages?: Array<{ lang: string | undefined; url: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
  organization?: {
    name: string;
    logo: string;
    url: string;
  };
  event?: {
    name: string;
    startDate: string;
    endDate?: string;
    location: string;
    description: string;
    image?: string;
    price?: string;
    currency?: string;
  };
  product?: {
    name: string;
    description: string;
    image: string;
    price: string;
    currency: string;
    availability: 'InStock' | 'OutOfStock' | 'PreOrder';
    brand?: string;
    sku?: string;
  };
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Commonly - Events, Music, and Community Platform',
  description = 'Discover and create amazing events, connect with artists, and build communities on Commonly. The platform where creators and communities thrive.',
  keywords = ['events', 'music', 'community', 'creators', 'platform', 'concerts', 'workshops'],
  image = 'https://commonlyapp.com/og-image.jpg',
  url = 'https://commonlyapp.com',
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  section,
  tags,
  noIndex = false,
  canonical,
  alternateLanguages = [],
  breadcrumbs = [],
  organization = {
    name: 'Commonly',
    logo: 'https://commonlyapp.com/logo.png',
    url: 'https://commonlyapp.com',
  },
  event,
  product,
}) => {
  const location = useLocation();
  const siteTitle = 'Commonly';
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;
  const currentUrl = canonical || url;

  // Force noIndex for admin routes and sensitive areas
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSensitiveRoute = ['/admin', '/debug', '/config', '/.env'].some(path =>
    location.pathname.startsWith(path)
  );
  const forceNoIndex = noIndex || isAdminRoute || isSensitiveRoute;

  // Generate structured data for organization
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organization.name,
    url: organization.url,
    logo: organization.logo,
    sameAs: [
      'https://twitter.com/commonlyapp',
      'https://instagram.com/commonlyapp',
      'https://linkedin.com/company/commonlyapp',
    ],
  };

  // Generate structured data for breadcrumbs
  const breadcrumbSchema =
    breadcrumbs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            item: crumb.url,
          })),
        }
      : null;

  // Generate structured data for events
  const eventSchema = event
    ? {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: {
          '@type': 'Place',
          name: event.location,
        },
        image: event.image || image,
        organizer: {
          '@type': 'Organization',
          name: organization.name,
          url: organization.url,
        },
        offers: event.price
          ? {
              '@type': 'Offer',
              price: event.price,
              priceCurrency: event.currency || 'USD',
              availability: 'https://schema.org/InStock',
            }
          : undefined,
      }
    : null;

  // Generate structured data for products
  const productSchema = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.image,
        brand: product.brand
          ? {
              '@type': 'Brand',
              name: product.brand,
            }
          : undefined,
        sku: product.sku,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: product.currency,
          availability: `https://schema.org/${product.availability}`,
        },
      }
    : null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={description} />
      <meta name='keywords' content={keywords.join(', ')} />
      {author && <meta name='author' content={author} />}

      {/* Canonical URL */}
      <link rel='canonical' href={currentUrl} />

      {/* Alternate Languages */}
      {alternateLanguages.map(({ lang, url }) => (
        <link key={lang} rel='alternate' hrefLang={lang} href={url} />
      ))}

      {/* Robots */}
      <meta name='robots' content={forceNoIndex ? 'noindex,nofollow' : 'index,follow'} />

      {/* Additional security for admin routes */}
      {isAdminRoute && (
        <>
          <meta name='robots' content='noindex,nofollow,noarchive,nosnippet,noimageindex' />
          <meta httpEquiv='Cache-Control' content='no-cache, no-store, must-revalidate' />
          <meta httpEquiv='Pragma' content='no-cache' />
          <meta httpEquiv='Expires' content='0' />
          <meta
            httpEquiv='X-Robots-Tag'
            content='noindex,nofollow,noarchive,nosnippet,noimageindex'
          />
          <meta name='referrer' content='no-referrer' />
        </>
      )}

      {/* Open Graph */}
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={description} />
      <meta property='og:image' content={image} />
      <meta property='og:url' content={currentUrl} />
      <meta property='og:type' content={type} />
      <meta property='og:site_name' content={siteTitle} />

      {/* Article specific OG tags */}
      {type === 'article' && (
        <>
          {author && <meta property='article:author' content={author} />}
          {publishedTime && <meta property='article:published_time' content={publishedTime} />}
          {modifiedTime && <meta property='article:modified_time' content={modifiedTime} />}
          {section && <meta property='article:section' content={section} />}
          {tags && tags.map(tag => <meta key={tag} property='article:tag' content={tag} />)}
        </>
      )}

      {/* Twitter Card */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:site' content='@commonlyapp' />
      <meta name='twitter:creator' content={author ? `@${author}` : '@commonlyapp'} />
      <meta name='twitter:title' content={fullTitle} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={image} />

      {/* Additional Meta Tags */}
      <meta name='theme-color' content='#2B2B2B' />
      <meta name='msapplication-TileColor' content='#2B2B2B' />
      <meta name='viewport' content='width=device-width, initial-scale=1, shrink-to-fit=no' />

      {/* Structured Data */}
      <script type='application/ld+json'>{JSON.stringify(organizationSchema)}</script>

      {breadcrumbSchema && (
        <script type='application/ld+json'>{JSON.stringify(breadcrumbSchema)}</script>
      )}

      {eventSchema && <script type='application/ld+json'>{JSON.stringify(eventSchema)}</script>}

      {productSchema && <script type='application/ld+json'>{JSON.stringify(productSchema)}</script>}

      {/* Preconnect to external domains */}
      <link rel='preconnect' href='https://fonts.googleapis.com' />
      <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
      <link rel='preconnect' href='https://images.unsplash.com' />

      {/* DNS Prefetch */}
      <link rel='dns-prefetch' href='//www.google-analytics.com' />
      <link rel='dns-prefetch' href='//connect.facebook.net' />
      <link rel='dns-prefetch' href='//platform.twitter.com' />
    </Helmet>
  );
};

export default SEOHead;
