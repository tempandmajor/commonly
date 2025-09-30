import { Helmet } from 'react-helmet-async';

const SecurityHeaders = () => {
  return (
    <Helmet>
      {/* Content Security Policy - Prevents XSS attacks */}
      <meta
        httpEquiv='Content-Security-Policy'
        content="default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://api.openai.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.openai.com; frame-src https://js.stripe.com;"
      />

      {/* Prevent MIME type sniffing */}
      <meta httpEquiv='X-Content-Type-Options' content='nosniff' />

      {/* Prevent clickjacking */}
      <meta httpEquiv='X-Frame-Options' content='DENY' />

      {/* XSS Protection */}
      <meta httpEquiv='X-XSS-Protection' content='1; mode=block' />

      {/* Referrer Policy - Control information sent in referrer header */}
      <meta name='referrer' content='strict-origin-when-cross-origin' />

      {/* Permissions Policy - Control browser features */}
      <meta httpEquiv='Permissions-Policy' content='geolocation=(), microphone=(), camera=()' />
    </Helmet>
  );
};

export default SecurityHeaders;
