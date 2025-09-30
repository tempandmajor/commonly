import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  title: string;
  description?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <Card className={cn("w-full max-w-md shadow-lg border-0 bg-card/80 backdrop-blur-sm", className)}>
      <CardHeader className="space-y-2 text-center pb-6">
        <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
        {description && (
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
      </CardContent>
    </Card>
  );
};