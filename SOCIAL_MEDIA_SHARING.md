# Social Media Sharing Implementation

## Overview

This document explains how social media sharing has been implemented for events, products, and podcasts on the Commonly platform. When users share links to these content types on social media platforms like Facebook, Twitter, LinkedIn, and WhatsApp, the links will display rich previews with custom images, titles, and descriptions.

## ✨ Features Implemented

### 🎯 **Dynamic Meta Tags**
- **Open Graph tags** for Facebook, LinkedIn, WhatsApp
- **Twitter Card tags** for Twitter
- **Schema.org structured data** for search engines
- **Canonical URLs** for SEO

### 📱 **Enhanced Share Component**
- Multiple sharing platforms (Facebook, Twitter, LinkedIn, WhatsApp, Email)
- Copy link functionality
- Native mobile sharing API support
- Social media preview within the app
- Improved visual design with platform icons

### 🔍 **Content Types Supported**

#### **Events** (`/events/{id}`)
- Event title, description, and banner image
- Event date, location, and pricing information
- Schema.org Event structured data
- Organizer information

#### **Products** (`/products/{id}`)
- Product name, description, and images
- Pricing and availability information
- Schema.org Product structured data
- Vendor and rating information

#### **Podcasts** (`/podcasts/{id}`)
- Episode title, description, and thumbnail
- Author and duration information
- Schema.org PodcastEpisode structured data
- Series information

## 🛠 Technical Implementation

### Meta Tag Structure

Each content type generates the following meta tags:

```html
<!-- Basic SEO -->
<title>Content Title</title>
<meta name="description" content="Content description..." />
<link rel="canonical" href="https://commonly.app/content/123" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="event|product|article" />
<meta property="og:url" content="https://commonly.app/content/123" />
<meta property="og:title" content="Content Title" />
<meta property="og:description" content="Content description..." />
<meta property="og:image" content="https://commonly.app/image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="Commonly" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="https://commonly.app/content/123" />
<meta name="twitter:title" content="Content Title" />
<meta name="twitter:description" content="Content description..." />
<meta name="twitter:image" content="https://commonly.app/image.jpg" />
<meta name="twitter:site" content="@commonlyapp" />

<!-- Schema.org Structured Data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Event|Product|PodcastEpisode",
  "name": "Content Title",
  "description": "Content description...",
  // ... additional structured data
}
</script>
```

### Components Used

#### **SEO Component** (`src/components/common/SEO.tsx`)
- Handles all meta tag generation
- Uses React Helmet for dynamic head management
- Supports all content types: `website`, `article`, `product`, `profile`, `event`

#### **Enhanced SocialSharePopover** (`src/components/share/SocialSharePopover.tsx`)
- Multi-platform sharing with proper URLs
- Visual preview of shared content
- Native mobile sharing API integration
- Copy link functionality with feedback

#### **Meta Tag Validator** (`src/utils/metaTagValidator.ts`)
- Validates meta tag compliance
- Provides optimization suggestions
- Generates test URLs for social platforms
- Debugging utilities

## 📋 Content-Specific Implementation

### Events (`src/pages/EventDetails.tsx`)

```typescript
const generateSEOData = (event: any) => {
  const title = `${event.title} - Event on Commonly`;
  const description = event.description 
    ? `${event.description.substring(0, 150)}...`
    : `Join us for ${event.title}. Get your tickets now on Commonly.`;
  
  const eventImage = event.image_url || event.bannerImage || '/default-image.png';
  
  const schemaData = {
    '@type': 'Event',
    name: event.title,
    startDate: event.start_date,
    location: { '@type': 'Place', name: event.location },
    offers: { '@type': 'Offer', price: event.price, priceCurrency: 'USD' }
  };

  return { title, description, image: eventImage, schemaData };
};
```

### Products (`src/pages/ProductDetail.tsx`)

```typescript
const generateProductSEO = (product: Product) => {
  const title = `${product.name} - $${product.price} | Commonly Store`;
  const description = `${product.description.substring(0, 150)}... | ${product.inStock ? 'In Stock' : 'Out of Stock'}`;
  
  const schemaData = {
    '@type': 'Product',
    name: product.name,
    offers: { '@type': 'Offer', price: product.price },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating }
  };

  return { title, description, image: product.images[0], schemaData };
};
```

### Podcasts (`src/pages/PodcastDetail.tsx`)

```typescript
const generatePodcastSEO = (episode: PodcastEpisode) => {
  const title = `${episode.title} | ${episode.author} - Commonly Podcasts`;
  const description = `${episode.description.substring(0, 150)}... | Duration: ${formatDuration(episode.duration)}`;
  
  const schemaData = {
    '@type': 'PodcastEpisode',
    name: episode.title,
    duration: `PT${Math.floor(episode.duration / 60)}M${episode.duration % 60}S`,
    author: { '@type': 'Person', name: episode.author }
  };

  return { title, description, image: episode.thumbnail, schemaData };
};
```

## 🧪 Testing Social Media Sharing

### Platform Testing Tools

Use these tools to test how your content appears on different platforms:

- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: https://www.linkedin.com/post-inspector/
- **Pinterest**: https://developers.pinterest.com/tools/url-debugger/

### Meta Tag Validation

Use the built-in validator:

```typescript
import { MetaTagValidator } from '@/utils/metaTagValidator';

const validation = MetaTagValidator.validate({
  title: 'Your content title',
  description: 'Your content description',
  image: 'https://your-domain.com/image.jpg',
  url: 'https://your-domain.com/content/123',
  type: 'event'
});

console.log(validation.errors);
console.log(validation.warnings);
console.log(validation.suggestions);
```

## 📱 Social Media Preview Examples

### Facebook/LinkedIn Preview
```
[IMAGE: 1200x630px]
Content Title
Brief description of the content that will appear below the title...
commonly.app
```

### Twitter Preview
```
[IMAGE: 1200x675px]
Content Title
Brief description that fits Twitter's character limits...
commonly.app
```

### WhatsApp Preview
```
[IMAGE: thumbnail]
Content Title
Description preview with link
commonly.app/content/123
```

## 🎨 Best Practices

### Image Requirements
- **Recommended size**: 1200x630px (1.91:1 ratio)
- **Minimum size**: 600x315px
- **Format**: JPG, PNG, or WebP
- **File size**: Under 1MB for best performance
- **HTTPS**: Always use secure URLs

### Title Guidelines
- **Length**: 30-70 characters optimal
- **Facebook**: Max 95 characters before truncation
- **Twitter**: Max 70 characters recommended
- **Include brand**: "Content Title | Commonly"

### Description Guidelines
- **Length**: 50-160 characters optimal
- **Facebook**: Max 300 characters
- **Twitter**: Max 200 characters
- **Include call-to-action**: "Get tickets now", "Shop now", "Listen now"

### URL Structure
- Use canonical URLs
- Include UTM parameters for tracking
- Keep URLs clean and descriptive

## 🔧 Maintenance

### Regular Testing
1. Test meta tags after content updates
2. Validate image URLs are accessible
3. Check social platform debuggers monthly
4. Monitor social sharing analytics

### Performance Optimization
1. Optimize images for web delivery
2. Use CDN for image hosting
3. Implement image lazy loading
4. Monitor page load speeds

### SEO Monitoring
1. Track social sharing metrics
2. Monitor search engine indexing
3. Update structured data as needed
4. Keep meta tag content fresh

## 🚀 Future Enhancements

### Planned Features
- **Dynamic image generation** for content without images
- **A/B testing** for meta tag variations
- **Analytics integration** for social sharing tracking
- **Automatic image optimization** and resizing
- **Multi-language support** for international sharing

### Integration Opportunities
- **Pinterest Rich Pins** for product sharing
- **Instagram Stories** sharing integration
- **TikTok** sharing capabilities
- **Reddit** optimized previews
- **Discord** embed optimization

## 📊 Analytics and Tracking

### Metrics to Monitor
- Social sharing click-through rates
- Platform-specific engagement
- Conversion rates from social traffic
- Image performance across platforms

### Implementation
```typescript
// Track social shares
const trackSocialShare = (platform: string, contentType: string, contentId: string) => {
  analytics.track('social_share', {
    platform,
    content_type: contentType,
    content_id: contentId,
    url: window.location.href
  });
};
```

This implementation ensures that when users share events, products, or podcasts from the Commonly platform on social media, the links will display beautiful, informative previews that encourage engagement and drive traffic back to the platform. 