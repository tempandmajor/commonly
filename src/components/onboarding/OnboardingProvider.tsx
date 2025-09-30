import React from 'react';

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Simple passthrough component that just renders children
  return <>{children}</>;
};

export default OnboardingProvider;
