import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Settings,
  BarChart3,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Database,
  Mail,
  Bell,
  Globe,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
} from 'lucide-react';

export default function AdminSystem() {
  const [activeTab, setActiveTab] = useState('settings');

  // Mock data for reports
  const reports = [
    {
      id: 1,
      name: 'User Activity Report',
      type: 'Users',
      period: 'Last 30 days',
      generated: '2024-03-15',
      size: '2.4 MB',
      status: 'ready',
    },
    {
      id: 2,
      name: 'Revenue Analysis',
      type: 'Financial',
      period: 'Q1 2024',
      generated: '2024-03-14',
      size: '1.8 MB',
      status: 'ready',
    },
    {
      id: 3,
      name: 'Event Performance',
      type: 'Events',
      period: 'Last 7 days',
      generated: '2024-03-13',
      size: '956 KB',
      status: 'generating',
    },
  ];

  // Mock security logs
  const securityLogs = [
    {
      id: 1,
      type: 'login',
      user: 'admin@commonly.com',
      action: 'Successful admin login',
      ip: '192.168.1.100',
      timestamp: '2024-03-15 14:30:22',
      severity: 'info',
    },
    {
      id: 2,
      type: 'failed_login',
      user: 'unknown@test.com',
      action: 'Failed login attempt',
      ip: '192.168.1.200',
      timestamp: '2024-03-15 14:25:15',
      severity: 'warning',
    },
    {
      id: 3,
      type: 'permission',
      user: 'moderator@commonly.com',
      action: 'Permission elevation requested',
      ip: '192.168.1.150',
      timestamp: '2024-03-15 13:45:30',
      severity: 'high',
    },
  ];

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      info: { color: 'bg-blue-100 text-blue-800', label: 'Info' },
      warning: { color: 'bg-yellow-100 text-yellow-800', label: 'Warning' },
      high: { color: 'bg-red-100 text-red-800', label: 'High' },
      critical: { color: 'bg-red-100 text-red-800', label: 'Critical' },
    };

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.info;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ready: { color: 'bg-green-100 text-green-800', label: 'Ready' },
      generating: { color: 'bg-yellow-100 text-yellow-800', label: 'Generating' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ready;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure platform settings, generate reports, and monitor security.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Configure basic platform settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input id="site-name" defaultValue="Commonly" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-description">Site Description</Label>
                  <Textarea
                    id="site-description"
                    defaultValue="The Pre Sale Event Ticketing Platform"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input id="support-email" defaultValue="support@commonly.com" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">
                      Temporarily disable public access
                    </p>
                  </div>
                  <Switch />
                </div>
                <Button className="w-full">Save Changes</Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Configure notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Send email alerts for important events
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Send SMS for critical alerts
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input id="admin-email" defaultValue="admin@commonly.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-frequency">Alert Frequency</Label>
                  <Select defaultValue="immediate">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">Update Notifications</Button>
              </CardContent>
            </Card>

            {/* Email Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Configure SMTP settings for email delivery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input id="smtp-host" defaultValue="smtp.commonly.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">Port</Label>
                    <Input id="smtp-port" defaultValue="587" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-security">Security</Label>
                    <Select defaultValue="tls">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Username</Label>
                  <Input id="smtp-username" defaultValue="noreply@commonly.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Password</Label>
                  <Input id="smtp-password" type="password" defaultValue="••••••••" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    Test Connection
                  </Button>
                  <Button className="flex-1">Save Settings</Button>
                </div>
              </CardContent>
            </Card>

            {/* Database Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Management
                </CardTitle>
                <CardDescription>
                  Database maintenance and backup options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">99.9%</div>
                    <div className="text-sm text-gray-500">Uptime</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">2.4GB</div>
                    <div className="text-sm text-gray-500">Database Size</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Backup Schedule</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Backup Now
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Optimize
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Reports</CardTitle>
                  <CardDescription>
                    Generate and download platform analytics reports
                  </CardDescription>
                </div>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Generate New Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>{report.type}</TableCell>
                        <TableCell>{report.period}</TableCell>
                        <TableCell>{report.generated}</TableCell>
                        <TableCell>{report.size}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          {report.status === 'ready' && (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {report.status === 'generating' && (
                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Quick Reports */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">User Activity</h3>
                    <p className="text-sm text-gray-500">Last 30 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Revenue</h3>
                    <p className="text-sm text-gray-500">Monthly summary</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Database className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">System Health</h3>
                    <p className="text-sm text-gray-500">Performance metrics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Shield className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Security</h3>
                    <p className="text-sm text-gray-500">Audit trail</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security Configuration
                </CardTitle>
                <CardDescription>
                  Configure security policies and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">
                      Require 2FA for admin accounts
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>IP Restrictions</Label>
                    <p className="text-sm text-gray-500">
                      Limit admin access to specific IPs
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input id="session-timeout" defaultValue="30" type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input id="max-login-attempts" defaultValue="5" type="number" />
                </div>
                <Button className="w-full">Update Security Settings</Button>
              </CardContent>
            </Card>

            {/* API Keys */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Management
                </CardTitle>
                <CardDescription>
                  Manage API keys and access tokens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Production API Key</Label>
                  <div className="flex gap-2">
                    <Input readOnly value="sk_live_••••••••••••••••" />
                    <Button variant="outline" size="sm">
                      Regenerate
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Test API Key</Label>
                  <div className="flex gap-2">
                    <Input readOnly value="sk_test_••••••••••••••••" />
                    <Button variant="outline" size="sm">
                      Regenerate
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <div className="flex gap-2">
                    <Input readOnly value="whsec_••••••••••••••••" />
                    <Button variant="outline" size="sm">
                      Regenerate
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label>API Rate Limiting</Label>
                    <p className="text-sm text-gray-500">
                      1000 requests per hour
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Security Audit Log</CardTitle>
              <CardDescription>
                Monitor security events and access attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Severity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {securityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="capitalize">{log.type.replace('_', ' ')}</TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.ip}</TableCell>
                        <TableCell>{log.timestamp}</TableCell>
                        <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}