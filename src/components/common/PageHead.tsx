import React from 'react';
import { SEO } from './SEO';

interface PageHeadProps {
  title: string;
  description: string;
  image?: string | undefined;
  type?: 'website' | undefined| 'product' | 'article' | 'profile';
  schema?: Record<string, unknown> | undefined;
  children?: React.ReactNode | undefined;
}

/**
 * A component for setting page metadata and SEO tags
 */
export const PageHead: React.FC<PageHeadProps> = ({
  title,
  description,
  image,
  type = 'website',
  schema,
  children,
}) => {
  return (
    <>
      <SEO
        title={title}
        description={description}
        {...(image && { image })}
        type={type}
        {...(schema && { schemaData: schema })}
      />
      {children}
    </>
  );
};
