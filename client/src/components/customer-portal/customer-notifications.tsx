import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  Gift,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  CreditCard,
  X,
  Eye,
  EyeOff,
  Filter,
  Search,
  MoreVertical,
  Archive,
  Trash2,
  CheckCircle2 as MarkAsRead,
  Settings,
  Zap,
  Award,
  Heart,
  TrendingUp,
  ShoppingBag,
  FileText,
  MessageCircle,
  Shield,
  Lock,
  Key,
  Download,
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
// import type { Customer } from '../../../shared/schema';

// Temporary type definition
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: any;
  totalOrders?: number;
  totalSpent?: string;
  lastOrder?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Notification {
  id: string;
  type: 'order' | 'promotion' | 'system' | 'loyalty' | 'security';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionText?: string;
  icon: string;
  metadata?: {
    orderId?: string;
    amount?: number;
    points?: number;
    expiryDate?: string;
  };
}

interface CustomerNotificationsProps {
  customer: Customer;
}

export default function CustomerNotifications({ customer }: CustomerNotificationsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  // Mock notifications data
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'order',
      title: 'Order Status Update',
      message: 'Your order FZC-2024-001 has been picked up and is now being processed.',
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'high',
      actionUrl: '/orders/FZC-2024-001',
      actionText: 'Track Order',
      icon: '📦',
      metadata: {
        orderId: 'FZC-2024-001'
      }
    },
    {
      id: '2',
      type: 'loyalty',
      title: 'Loyalty Points Earned',
      message: 'You earned 150 loyalty points for completing your order. Keep it up!',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      priority: 'medium',
      actionText: 'View Points',
      icon: '🎁',
      metadata: {
        points: 150
      }
    },
    {
      id: '3',
      type: 'promotion',
      title: 'Special Offer Available',
      message: 'Get 20% off on your next dry cleaning service. Offer expires in 3 days.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      priority: 'medium',
      actionText: 'Claim Offer',
      icon: '⭐',
      metadata: {
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      id: '4',
      type: 'system',
      title: 'Service Maintenance',
      message: 'Scheduled maintenance will occur on Sunday from 2-4 AM. Some features may be unavailable.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      priority: 'low',
      icon: '🔧'
    },
    {
      id: '5',
      type: 'order',
      title: 'Delivery Confirmed',
      message: 'Your order FZC-2024-002 has been delivered successfully. Thank you for choosing FabZClean!',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      priority: 'high',
      actionUrl: '/orders/FZC-2024-002',
      actionText: 'View Order',
      icon: '✅',
      metadata: {
        orderId: 'FZC-2024-002'
      }
    },
    {
      id: '6',
      type: 'security',
      title: 'Login Alert',
      message: 'Your account was accessed from a new device. If this wasn\'t you, please secure your account.',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      priority: 'high',
      actionText: 'Secure Account',
      icon: '🔒'
    }
  ];

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications.filter(notification => {
      const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
      if (statusFilter !== 'all') {
        if (statusFilter === 'read' && !notification.read) return false;
        if (statusFilter === 'unread' && notification.read) return false;
      }

      return true;
    });

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return filtered;
  }, [notifications, searchQuery, typeFilter, statusFilter]);

  // Get notification type info
  const getNotificationTypeInfo = (type: string) => {
    switch (type) {
      case 'order':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Order Updates' };
      case 'promotion':
        return { color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Promotions' };
      case 'system':
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'System' };
      case 'loyalty':
        return { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Loyalty' };
      case 'security':
        return { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Security' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Other' };
    }
  };

  // Get priority info
  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'high':
        return { color: 'text-red-600', bgColor: 'bg-red-100', label: 'High' };
      case 'medium':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Medium' };
      case 'low':
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Low' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Normal' };
    }
  };

  // Handle notification actions
  const handleNotificationAction = (notification: Notification) => {
    if (notification.actionText) {
      toast({
        title: "Action Triggered",
        description: `Executing: ${notification.actionText}`,
      });
    }
  };

  // Handle mark as read
  const handleMarkAsRead = (notificationId: string) => {
    toast({
      title: "Notification Marked as Read",
      description: "The notification has been marked as read.",
    });
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    toast({
      title: "All Notifications Marked as Read",
      description: "All notifications have been marked as read.",
    });
  };

  // Handle delete notification
  const handleDeleteNotification = (notificationId: string) => {
    toast({
      title: "Notification Deleted",
      description: "The notification has been deleted.",
    });
  };

  // Handle clear all notifications
  const handleClearAllNotifications = () => {
    toast({
      title: "All Notifications Cleared",
      description: "All notifications have been cleared.",
    });
  };

  // Get notification count by type
  const getNotificationCounts = () => {
    const counts = {
      all: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      order: notifications.filter(n => n.type === 'order').length,
      promotion: notifications.filter(n => n.type === 'promotion').length,
      loyalty: notifications.filter(n => n.type === 'loyalty').length,
      system: notifications.filter(n => n.type === 'system').length,
      security: notifications.filter(n => n.type === 'security').length
    };
    return counts;
  };

  const notificationCounts = getNotificationCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-600">Stay updated with your orders, promotions, and account activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <MarkAsRead className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAllNotifications}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Notification Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{notificationCounts.all}</div>
                <div className="text-sm text-muted-foreground">Total Notifications</div>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{notificationCounts.unread}</div>
                <div className="text-sm text-muted-foreground">Unread</div>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{notificationCounts.order}</div>
                <div className="text-sm text-muted-foreground">Order Updates</div>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{notificationCounts.promotion}</div>
                <div className="text-sm text-muted-foreground">Promotions</div>
              </div>
              <Star className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="order">Order Updates</SelectItem>
                <SelectItem value="promotion">Promotions</SelectItem>
                <SelectItem value="loyalty">Loyalty</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.map((notification, index) => {
            const typeInfo = getNotificationTypeInfo(notification.type);
            const priorityInfo = getPriorityInfo(notification.priority);

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Card className={`hover:shadow-md transition-all duration-200 ${
                  !notification.read ? 'ring-2 ring-blue-200 bg-blue-50/50' : ''
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Notification Icon */}
                      <div className={`p-3 rounded-full ${typeInfo.bgColor}`}>
                        <span className="text-2xl">{notification.icon}</span>
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{notification.title}</h3>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-muted-foreground mb-3">{notification.message}</p>
                            
                            {/* Notification Metadata */}
                            {notification.metadata && (
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                {notification.metadata.orderId && (
                                  <div className="flex items-center gap-1">
                                    <Package className="h-4 w-4" />
                                    <span>{notification.metadata.orderId}</span>
                                  </div>
                                )}
                                {notification.metadata.points && (
                                  <div className="flex items-center gap-1">
                                    <Gift className="h-4 w-4" />
                                    <span>{notification.metadata.points} points</span>
                                  </div>
                                )}
                                {notification.metadata.amount && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    <span>₹{notification.metadata.amount}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Notification Footer */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(notification.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <Badge variant="outline" className={typeInfo.color}>
                                  {typeInfo.label}
                                </Badge>
                                <Badge variant="outline" className={priorityInfo.color}>
                                  {priorityInfo.label}
                                </Badge>
                              </div>

                              {/* Notification Actions */}
                              <div className="flex items-center gap-2">
                                {notification.actionText && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleNotificationAction(notification)}
                                  >
                                    {notification.actionText}
                                  </Button>
                                )}
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {!notification.read && (
                                      <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                                        <MarkAsRead className="mr-2 h-4 w-4" />
                                        Mark as Read
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleDeleteNotification(notification.id)}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <div className="rounded-full bg-muted p-6 w-20 h-20 mx-auto flex items-center justify-center">
                <Bell className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No notifications found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'You\'re all caught up! No new notifications.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Order Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Order Status Updates</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Delivery Notifications</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Pickup Reminders</Label>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Marketing & Promotions</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Special Offers</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>New Service Announcements</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Loyalty Program Updates</Label>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
