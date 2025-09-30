import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/providers/AuthProvider';
import StripeConnectGuard from '@/components/auth/StripeConnectGuard';
import { CreateEventWizard } from '@/components/forms/CreateEventWizard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  Settings,
  Info,
  ArrowRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  icon: React.ComponentType<any>;
  estimatedTime: string;
  complexity: 'simple' | 'moderate' | 'advanced';
  features: string[];
  color: string;
}

interface CreatorTip {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'success' | 'planning' | 'marketing' | 'technical';
}

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { track } = useAnalytics('create_event', 'Create Event');
  const { user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QuickTemplate | null>(null);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    track('page_view', { page: 'create_event' });
  }, [track]);

  const quickTemplates: QuickTemplate[] = [
    {
      id: 'workshop',
      title: 'Workshop/Training',
      description: 'Educational sessions with hands-on learning',
      category: 'Education',
      type: 'workshop',
      icon: Settings,
      estimatedTime: '15 min',
      complexity: 'simple',
      features: ['Capacity management', 'Material sharing', 'Certificates'],
      color: 'bg-primary',
    },
    {
      id: 'conference',
      title: 'Conference/Summit',
      description: 'Multi-session professional gatherings',
      category: 'Business',
      type: 'conference',
      icon: Users,
      estimatedTime: '25 min',
      complexity: 'advanced',
      features: ['Multi-track agenda', 'Speaker management', 'Networking'],
      color: 'bg-primary',
    },
    {
      id: 'meetup',
      title: 'Community Meetup',
      description: 'Casual networking and social events',
      category: 'Social',
      type: 'meetup',
      icon: Users,
      estimatedTime: '10 min',
      complexity: 'simple',
      features: ['RSVP tracking', 'Location sharing', 'Group chat'],
      color: 'bg-primary',
    },
    {
      id: 'virtual',
      title: 'Virtual Event',
      description: 'Online events with live streaming',
      category: 'Technology',
      type: 'virtual',
      icon: ImageIcon,
      estimatedTime: '20 min',
      complexity: 'moderate',
      features: ['HD streaming', 'Interactive chat', 'Recording'],
      color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    },
    {
      id: 'fundraiser',
      title: 'Fundraising Event',
      description: 'Charity events with donation goals',
      category: 'Nonprofit',
      type: 'fundraiser',
      icon: DollarSign,
      estimatedTime: '30 min',
      complexity: 'advanced',
      features: ['Goal tracking', 'Donor management', 'Tax receipts'],
      color: 'bg-gradient-to-br from-amber-500 to-amber-600',
    },
    {
      id: 'custom',
      title: 'Custom Event',
      description: 'Build from scratch with all features',
      category: 'Custom',
      type: 'custom',
      icon: Sparkles,
      estimatedTime: '35 min',
      complexity: 'advanced',
      features: ['Full customization', 'All integrations', 'Advanced settings'],
      color: 'bg-gradient-to-br from-rose-500 to-rose-600',
    },
  ];

  const creatorTips: CreatorTip[] = [
    {
      id: 'early-bird',
      title: 'Launch with Early Bird Pricing',
      description: 'Offer 15-20% discounts for early registrations to build momentum and validate demand.',
      icon: Clock,
      category: 'marketing',
    },
    {
      id: 'social-proof',
      title: 'Build Social Proof',
      description: 'Share behind-the-scenes content and speaker announcements to create excitement.',
      icon: Users,
      category: 'marketing',
    },
    {
      id: 'capacity-planning',
      title: 'Plan Your Capacity Wisely',
      description: 'Start with 70% of your ideal capacity - you can always increase it as demand grows.',
      icon: MapPin,
      category: 'planning',
    },
    {
      id: 'funding-goal',
      title: 'Set Realistic Funding Goals',
      description: 'Calculate all costs including platform fees, and add 20% buffer for unexpected expenses.',
      icon: DollarSign,
      category: 'planning',
    },
    {
      id: 'engagement',
      title: 'Plan for Engagement',
      description: 'Interactive elements like Q&A, polls, and networking time increase attendee satisfaction.',
      icon: Sparkles,
      category: 'success',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % creatorTips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [creatorTips.length]);

  const handleTemplateSelect = (template: QuickTemplate) => {
    setSelectedTemplate(template);
    track('template_selected', {
      templateId: template.id,
      templateType: template.type,
      complexity: template.complexity,
    });
    setShowWizard(true);
  };

  const handleCustomCreate = () => {
    setSelectedTemplate(null);
    track('custom_event_started');
    setShowWizard(true);
  };

  const currentTipData = creatorTips[currentTip];
  const getTipColor = (category: string) => {
    switch (category) {
      case 'success': return 'border-border bg-secondary';
      case 'planning': return 'border-border bg-secondary';
      case 'marketing': return 'border-border bg-secondary';
      case 'technical': return 'border-border bg-secondary';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (showWizard) {
    return (

      <StripeConnectGuard type="event" returnPath="/create-event">
        <CreateEventWizard
          template={selectedTemplate}
          onComplete={(eventId: string) => {
            track('event_created_via_wizard', {
              eventId,
              templateUsed: selectedTemplate?.id || 'custom',
            });

            navigate(`/events/${eventId}`);
          }}
          onCancel={() => {
            setShowWizard(false);
            setSelectedTemplate(null);
          }}
        />
      </StripeConnectGuard>
    );
  }

  return (
    <StripeConnectGuard type="event" returnPath="/create-event">
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Hero Section */}
        <section className="relative py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Create Your Event
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose a template to get started quickly, or build from scratch with full customization
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Templates Section */}
              <div className="lg:col-span-3">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-2">Quick Start Templates</h2>
                  <p className="text-muted-foreground">
                    Pre-configured templates to help you create events faster
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {quickTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/20 h-full"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="p-6 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-4">

                          <div className={`p-3 rounded-lg ${template.color} text-white`}>
                            <template.icon className="h-6 w-6" />
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge
                              variant={template.complexity === 'simple' ? 'default' :
                                      template.complexity === 'moderate' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {template.complexity}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {template.estimatedTime}
                            </div>
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                            {template.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                            {template.description}
                          </p>

                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Key Features:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {template.features.slice(0, 3).map((feature, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                        >
                          <span className="flex items-center justify-between w-full">
                            Use Template
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Custom Option */}
                <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-8 text-center">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Need Something Different?</h3>
                    <p className="text-muted-foreground mb-6">
                      Build a completely custom event with access to all features and settings
                    </p>
                    <Button onClick={handleCustomCreate} size="lg" className="px-8">
                      Start from Scratch
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Tips & Guidance Sidebar */}
              <div className="space-y-6">
                {/* Creator Tip of the Day */}
                <Card className={cn('transition-all duration-500', getTipColor(currentTipData.category))}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <currentTipData.icon className="h-5 w-5" />
                      <CardTitle className="text-sm font-medium">
                        Creator Tip
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-2 text-sm">{currentTipData.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {currentTipData.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Success Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Platform Success
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Events Created</span>
                      <span className="text-sm font-semibold">25,000+</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Avg. Funding Rate</span>
                      <span className="text-sm font-semibold text-primary">87%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Total Raised</span>
                      <span className="text-sm font-semibold">$12.5M+</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Links */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Need Help?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs">
                      Event Planning Guide
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs">
                      Pricing Strategies
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs">
                      Marketing Checklist
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs">
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>

                {/* Platform Benefits */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>All-or-Nothing Funding:</strong> Your attendees only get charged if you reach your funding goal. This reduces risk and builds confidence in your event.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </section>
      </div>
    </StripeConnectGuard>
  );
};

export default CreateEvent;

