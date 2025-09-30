import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  ChefHat,
  CalendarCheck,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  MapPin,
  Star,
  DollarSign,
} from 'lucide-react';

export default function AdminBusiness() {
  const [activeTab, setActiveTab] = useState('venues');

  // Mock data
  const venues = [
    {
      id: 1,
      name: 'Grand Central Hall',
      owner: 'Sarah Johnson',
      location: 'New York, NY',
      capacity: 500,
      rating: 4.8,
      bookings: 28,
      revenue: '$45,600',
      status: 'active',
    },
    {
      id: 2,
      name: 'Sunset Garden',
      owner: 'Mike Chen',
      location: 'Los Angeles, CA',
      capacity: 200,
      rating: 4.6,
      bookings: 15,
      revenue: '$22,800',
      status: 'pending',
    },
    {
      id: 3,
      name: 'Downtown Convention Center',
      owner: 'Lisa Davis',
      location: 'Chicago, IL',
      capacity: 1000,
      rating: 4.9,
      bookings: 42,
      revenue: '$89,200',
      status: 'active',
    },
  ];

  const caterers = [
    {
      id: 1,
      name: 'Gourmet Delights Catering',
      owner: 'Chef Antonio',
      specialty: 'Italian Cuisine',
      location: 'Boston, MA',
      rating: 4.7,
      orders: 156,
      revenue: '$78,400',
      status: 'active',
    },
    {
      id: 2,
      name: 'Fresh & Local',
      owner: 'Maria Rodriguez',
      specialty: 'Farm-to-Table',
      location: 'Portland, OR',
      rating: 4.5,
      orders: 89,
      revenue: '$42,300',
      status: 'active',
    },
    {
      id: 3,
      name: 'Royal Events Catering',
      owner: 'James Wilson',
      specialty: 'Fine Dining',
      location: 'Miami, FL',
      rating: 4.9,
      orders: 203,
      revenue: '$125,600',
      status: 'pending',
    },
  ];

  const bookings = [
    {
      id: 1,
      event: 'Summer Music Festival',
      venue: 'Grand Central Hall',
      caterer: 'Gourmet Delights',
      date: '2024-07-15',
      attendees: 450,
      total: '$8,750',
      status: 'confirmed',
    },
    {
      id: 2,
      event: 'Tech Conference 2024',
      venue: 'Downtown Convention Center',
      caterer: 'Fresh & Local',
      date: '2024-08-20',
      attendees: 800,
      total: '$15,200',
      status: 'pending',
    },
    {
      id: 3,
      event: 'Wedding Reception',
      venue: 'Sunset Garden',
      caterer: 'Royal Events',
      date: '2024-09-05',
      attendees: 150,
      total: '$4,500',
      status: 'confirmed',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
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
          <h1 className="text-3xl font-bold tracking-tight">Business Services</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage venues, caterers, and booking operations.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="venues" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Venues
          </TabsTrigger>
          <TabsTrigger value="caterers" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Caterers
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Bookings
          </TabsTrigger>
        </TabsList>

        {/* Venues Tab */}
        <TabsContent value="venues" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Venue Management</CardTitle>
                  <CardDescription>
                    Review and manage venue listings and applications
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Venue
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search venues..."
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>

              {/* Venues Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Venue</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {venues.map((venue) => (
                      <TableRow key={venue.id}>
                        <TableCell className="font-medium">{venue.name}</TableCell>
                        <TableCell>{venue.owner}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {venue.location}
                          </div>
                        </TableCell>
                        <TableCell>{venue.capacity}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            {venue.rating}
                          </div>
                        </TableCell>
                        <TableCell>{venue.bookings}</TableCell>
                        <TableCell>{venue.revenue}</TableCell>
                        <TableCell>{getStatusBadge(venue.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <XCircle className="mr-2 h-4 w-4" />
                                Suspend
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Caterers Tab */}
        <TabsContent value="caterers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Caterer Management</CardTitle>
                  <CardDescription>
                    Manage catering services and applications
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Caterer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search caterers..."
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>

              {/* Caterers Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caterers.map((caterer) => (
                      <TableRow key={caterer.id}>
                        <TableCell className="font-medium">{caterer.name}</TableCell>
                        <TableCell>{caterer.owner}</TableCell>
                        <TableCell>{caterer.specialty}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {caterer.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            {caterer.rating}
                          </div>
                        </TableCell>
                        <TableCell>{caterer.orders}</TableCell>
                        <TableCell>{caterer.revenue}</TableCell>
                        <TableCell>{getStatusBadge(caterer.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <XCircle className="mr-2 h-4 w-4" />
                                Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Booking Management</CardTitle>
                  <CardDescription>
                    Monitor and manage all venue and catering bookings
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Revenue Report
                  </Button>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Booking
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search bookings..."
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>

              {/* Bookings Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Caterer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Attendees</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.event}</TableCell>
                        <TableCell>{booking.venue}</TableCell>
                        <TableCell>{booking.caterer}</TableCell>
                        <TableCell>{booking.date}</TableCell>
                        <TableCell>{booking.attendees}</TableCell>
                        <TableCell>{booking.total}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Booking
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirm
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
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