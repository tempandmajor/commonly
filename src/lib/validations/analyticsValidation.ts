import { z } from 'zod';

// Date range presets
export const dateRangePresets = [
  'today',
  'yesterday',
  'last-7-days',
  'last-30-days',
  'last-90-days',
  'this-month',
  'last-month',
  'this-quarter',
  'last-quarter',
  'this-year',
  'last-year',
  'custom',
] as const;

// Metric types
export const metricTypes = [
  'events',
  'attendees',
  'revenue',
  'tickets',
  'engagement',
  'conversions',
  'growth',
  'retention',
] as const;

// Chart types
export const chartTypes = [
  'line',
  'bar',
  'area',
  'pie',
  'donut',
  'scatter',
  'heatmap',
  'funnel',
] as const;

// Report frequencies
export const reportFrequencies = [
  'daily',
  'weekly',
  'bi-weekly',
  'monthly',
  'quarterly',
  'yearly',
] as const;

// Date range schema
export const dateRangeSchema = z.object({
  preset: z.enum(dateRangePresets).default('last-30-days'),

  customRange: z
    .object({
      startDate: z.date(),
      endDate: z.date(),
    })
    .optional(),

  compareWith: z
    .object({
      enabled: z.boolean().default(false),
      period: z.enum(['previous-period', 'same-period-last-year', 'custom']).optional(),
      customRange: z
        .object({
          startDate: z.date(),
          endDate: z.date(),
        })
        .optional(),
    })
    .optional(),
});

// Metrics configuration schema
export const metricsConfigSchema = z.object({
  selectedMetrics: z
    .array(z.enum(metricTypes))
    .min(1, 'Select at least one metric')
    .max(6, 'Maximum 6 metrics allowed'),

  groupBy: z
    .enum([
      'none',
      'day',
      'week',
      'month',
      'quarter',
      'event-type',
      'location',
      'category',
      'source',
    ])
    .default('none'),

  filters: z
    .object({
      eventTypes: z.array(z.string()).optional(),
      locations: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      priceRange: z
        .object({
          min: z.number().min(0).optional(),
          max: z.number().min(0).optional(),
        })
        .optional(),
    })
    .optional(),

  sortBy: z
    .object({
      field: z.string(),
      order: z.enum(['asc', 'desc']).default('desc'),
    })
    .optional(),
});

// Chart configuration schema
export const chartConfigSchema = z.object({
  type: z.enum(chartTypes).default('line'),

  title: z.string().max(100).optional(),

  axes: z
    .object({
      xAxis: z.object({
        label: z.string().optional(),
        type: z.enum(['time', 'category', 'value']).default('time'),
        format: z.string().optional(),
      }),
      yAxis: z.object({
        label: z.string().optional(),
        format: z.enum(['number', 'currency', 'percentage']).default('number'),
        scale: z.enum(['linear', 'logarithmic']).default('linear'),
      }),
    })
    .optional(),

  appearance: z.object({
    colorScheme: z.enum(['default', 'monochrome', 'gradient', 'custom']).default('default'),
    showLegend: z.boolean().default(true),
    showTooltips: z.boolean().default(true),
    showDataLabels: z.boolean().default(false),
    stacked: z.boolean().default(false),
  }),

  dimensions: z.object({
    width: z.number().min(200).max(2000).optional(),
    height: z.number().min(200).max(1000).optional(),
    responsive: z.boolean().default(true),
  }),
});

// Dashboard layout schema
export const dashboardLayoutSchema = z.object({
  name: z
    .string()
    .min(3, 'Dashboard name must be at least 3 characters')
    .max(50, 'Dashboard name must be less than 50 characters'),

  description: z.string().max(200).optional(),

  widgets: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(['metric-card', 'chart', 'table', 'map', 'list']),
        position: z.object({
          x: z.number(),
          y: z.number(),
          w: z.number().min(1).max(12),
          h: z.number().min(1).max(8),
        }),
        config: z.any(), // Widget-specific config
      })
    )
    .max(20, 'Maximum 20 widgets per dashboard'),

  refreshInterval: z.number().min(0).max(3600).default(300), // seconds

  isPublic: z.boolean().default(false),

  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
});

// Report configuration schema
export const reportConfigSchema = z.object({
  name: z
    .string()
    .min(3, 'Report name must be at least 3 characters')
    .max(100, 'Report name must be less than 100 characters'),

  type: z.enum(['summary', 'detailed', 'comparison', 'trend', 'custom']),

  sections: z
    .array(
      z.object({
        title: z.string(),
        type: z.enum(['metrics', 'chart', 'table', 'text']),
        content: z.any(), // Section-specific content
      })
    )
    .min(1, 'At least one section required'),

  dateRange: dateRangeSchema,

  format: z.enum(['pdf', 'excel', 'csv', 'html']).default('pdf'),

  branding: z.object({
    includeLogo: z.boolean().default(true),
    includeFooter: z.boolean().default(true),
    customColors: z.boolean().default(false),
  }),
});

// Scheduled report schema
export const scheduledReportSchema = z.object({
  reportConfig: reportConfigSchema,

  schedule: z.object({
    frequency: z.enum(reportFrequencies),

    dayOfWeek: z.number().min(0).max(6).optional(), // 0 = Sunday
    dayOfMonth: z.number().min(1).max(31).optional(),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    timezone: z.string().default('UTC'),
  }),

  recipients: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .min(1, 'At least one recipient required')
    .max(50),

  emailSettings: z.object({
    subject: z
      .string()
      .min(5, 'Subject must be at least 5 characters')
      .max(100, 'Subject must be less than 100 characters'),

    message: z.string().max(500).optional(),

    attachReport: z.boolean().default(true),
    includeInBody: z.boolean().default(false),
  }),

  active: z.boolean().default(true),

  expiryDate: z.date().optional(),
});

// Export configuration schema
export const exportConfigSchema = z.object({
  dataType: z.enum(['events', 'attendees', 'transactions', 'analytics', 'all']),

  dateRange: dateRangeSchema,

  format: z.enum(['csv', 'excel', 'json', 'xml']).default('csv'),

  fields: z.array(z.string()).min(1, 'Select at least one field'),

  filters: z.any().optional(), // Type-specific filters

  options: z.object({
    includeHeaders: z.boolean().default(true),
    includeMetadata: z.boolean().default(false),
    compressed: z.boolean().default(false),
    splitFiles: z.boolean().default(false),
    maxRowsPerFile: z.number().min(1000).max(1000000).optional(),
  }),
});

// Alert configuration schema
export const alertConfigSchema = z.object({
  name: z
    .string()
    .min(3, 'Alert name must be at least 3 characters')
    .max(50, 'Alert name must be less than 50 characters'),

  type: z.enum(['threshold', 'anomaly', 'trend', 'custom']),

  metric: z.enum(metricTypes),

  conditions: z.object({
    operator: z.enum(['>', '<', '>=', '<=', '==', '!=']),
    value: z.number(),
    duration: z.number().min(1).max(1440).optional(), // minutes
    aggregation: z.enum(['sum', 'avg', 'min', 'max', 'count']).optional(),
  }),

  notifications: z.object({
    channels: z
      .array(z.enum(['email', 'sms', 'push', 'webhook']))
      .min(1, 'Select at least one notification channel'),

    recipients: z.array(z.string()).min(1),

    frequency: z.enum(['immediate', 'hourly', 'daily']).default('immediate'),

    quietHours: z.object({
      enabled: z.boolean().default(false),
      start: z.string().optional(),
      end: z.string().optional(),
    }),
  }),

  active: z.boolean().default(true),
});

// Default values
export const dateRangeDefaults = {
  preset: 'last-30-days' as const,
  compareWith: {
    enabled: false,
  },
};

export const metricsConfigDefaults = {
  selectedMetrics: ['events', 'attendees', 'revenue'] as const,
  groupBy: 'none' as const,
};

export const chartConfigDefaults = {
  type: 'line' as const,
  appearance: {
    colorScheme: 'default' as const,
    showLegend: true,
    showTooltips: true,
    showDataLabels: false,
    stacked: false,
  },
  dimensions: {
    responsive: true,
  },
};

export const dashboardLayoutDefaults = {
  widgets: [],
  refreshInterval: 300,
  isPublic: false,
  theme: 'auto' as const,
};

export const reportConfigDefaults = {
  format: 'pdf' as const,
  branding: {
    includeLogo: true,
    includeFooter: true,
    customColors: false,
  },
};

export const exportConfigDefaults = {
  format: 'csv' as const,
  options: {
    includeHeaders: true,
    includeMetadata: false,
    compressed: false,
    splitFiles: false,
  },
};

export const alertConfigDefaults = {
  active: true,
  notifications: {
    frequency: 'immediate' as const,
    quietHours: {
      enabled: false,
    },
  },
};

// Type exports
export type DateRangeFormValues = z.infer<typeof dateRangeSchema>;
export type MetricsConfigFormValues = z.infer<typeof metricsConfigSchema>;
export type ChartConfigFormValues = z.infer<typeof chartConfigSchema>;
export type DashboardLayoutFormValues = z.infer<typeof dashboardLayoutSchema>;
export type ReportConfigFormValues = z.infer<typeof reportConfigSchema>;
export type ScheduledReportFormValues = z.infer<typeof scheduledReportSchema>;
export type ExportConfigFormValues = z.infer<typeof exportConfigSchema>;
export type AlertConfigFormValues = z.infer<typeof alertConfigSchema>;

// Helper functions
export const getDateRangeFromPreset = (preset: string): { start: Date; end: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { start: today, end: now };
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };
    case 'last-7-days':
      const week = new Date(today);
      week.setDate(week.getDate() - 7);
      return { start: week, end: now };
    case 'last-30-days':
      const month = new Date(today);
      month.setDate(month.getDate() - 30);
      return { start: month, end: now };
    case 'this-month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now,
      };
    // Add more cases as needed
    default:
      return { start: today, end: now };
  }
};

export const formatMetricValue = (
  value: number,
  type: string,
  format: 'number' | 'currency' | 'percentage' = 'number'
): string => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    case 'percentage':
      return `${value * 100}.toFixed(1)}%`;
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
};

export const getMetricIcon = (metric: string) => {
  const icons: Record<string, string> = {
    events: '📅',
    attendees: '👥',
    revenue: '💰',
    tickets: '🎫',
    engagement: '📊',
    conversions: '🎯',
    growth: '📈',
    retention: '🔄',
  };
  return icons[metric] || '📊';
};
