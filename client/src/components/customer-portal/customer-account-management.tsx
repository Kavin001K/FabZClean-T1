import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Gift,
  Award,
  Star,
  TrendingUp,
  History,
  Settings,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Shield,
  Bell,
  Lock,
  Key,
  CheckCircle,
  AlertCircle,
  Info,
  Download,
  Upload,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  Zap,
  Crown,
  Heart,
  ShoppingBag,
  Clock,
  DollarSign,
  Percent,
  Tag
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
// import type { Customer } from '@shared/schema';

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

interface CustomerAccountManagementProps {
  customer: Customer;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences: {
    notifications: boolean;
    marketing: boolean;
    sms: boolean;
    email: boolean;
  };
  security: {
    twoFactor: boolean;
    loginAlerts: boolean;
  };
}

interface LoyaltyTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired';
  amount: number;
  description: string;
  date: string;
  orderId?: string;
}

export default function CustomerAccountManagement({ customer }: CustomerAccountManagementProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: customer.name,
    email: customer.email || '',
    phone: customer.phone || '',
    address: {
      street: (customer.address as any)?.street || '',
      city: (customer.address as any)?.city || '',
      state: (customer.address as any)?.state || '',
      zipCode: (customer.address as any)?.zipCode || '',
      country: (customer.address as any)?.country || 'India'
    },
    preferences: {
      notifications: true,
      marketing: true,
      sms: true,
      email: true
    },
    security: {
      twoFactor: false,
      loginAlerts: true
    }
  });
  const { toast } = useToast();

  // Mock loyalty transactions
  const loyaltyTransactions: LoyaltyTransaction[] = [
    {
      id: '1',
      type: 'earned',
      amount: 150,
      description: 'Order completion bonus',
      date: new Date().toISOString(),
      orderId: 'FZC-2024-001'
    },
    {
      id: '2',
      type: 'redeemed',
      amount: -100,
      description: 'Redeemed for discount',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      orderId: 'FZC-2024-002'
    },
    {
      id: '3',
      type: 'earned',
      amount: 75,
      description: 'Referral bonus',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Calculate loyalty points
  const totalLoyaltyPoints = useMemo(() => {
    return loyaltyTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  }, [loyaltyTransactions]);

  // Get membership tier info
  const getMembershipTier = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return { 
          color: 'bg-gradient-to-r from-purple-500 to-pink-500', 
          icon: Crown, 
          benefits: ['Free pickup/delivery', 'Priority service', '20% discount', 'Dedicated support'],
          nextTier: null,
          pointsNeeded: 0
        };
      case 'Gold':
        return { 
          color: 'bg-gradient-to-r from-yellow-400 to-yellow-600', 
          icon: Star, 
          benefits: ['Free pickup/delivery', 'Priority service', '15% discount'],
          nextTier: 'Platinum',
          pointsNeeded: 2000
        };
      case 'Silver':
        return { 
          color: 'bg-gradient-to-r from-gray-300 to-gray-500', 
          icon: TrendingUp, 
          benefits: ['Free pickup/delivery', '10% discount'],
          nextTier: 'Gold',
          pointsNeeded: 1000
        };
      default:
        return { 
          color: 'bg-gradient-to-r from-orange-400 to-orange-600', 
          icon: Heart, 
          benefits: ['5% discount'],
          nextTier: 'Silver',
          pointsNeeded: 500
        };
    }
  };

  const membershipInfo = getMembershipTier((customer as any).membershipTier || 'Bronze');
  const MembershipIcon = membershipInfo.icon;

  // Handle profile updates
  const handleProfileUpdate = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
    setIsEditing(false);
  };

  // Handle preference changes
  const handlePreferenceChange = (key: string, value: boolean) => {
    setProfileData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  // Handle security changes
  const handleSecurityChange = (key: string, value: boolean) => {
    setProfileData(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value
      }
    }));
  };

  // Handle password change
  const handlePasswordChange = () => {
    toast({
      title: "Password Changed",
      description: "Your password has been updated successfully.",
    });
  };

  // Handle data export
  const handleDataExport = () => {
    toast({
      title: "Data Export Started",
      description: "Your data will be sent to your email address.",
    });
  };

  // Handle account deletion
  const handleAccountDeletion = () => {
    toast({
      title: "Account Deletion Requested",
      description: "We'll process your request within 24 hours.",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account Management</h2>
          <p className="text-gray-600">Manage your profile, preferences, and account settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDataExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Membership Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MembershipIcon className="h-5 w-5" />
            Membership Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`${membershipInfo.color} text-white px-4 py-2 rounded-lg flex items-center gap-2`}>
                <MembershipIcon className="h-5 w-5" />
                <span className="font-semibold">{(customer as any).membershipTier || 'Bronze'} Member</span>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Loyalty Points</div>
                <div className="text-2xl font-bold text-purple-600">{totalLoyaltyPoints}</div>
              </div>
            </div>
            {membershipInfo.nextTier && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Next Tier: {membershipInfo.nextTier}</div>
                <div className="text-sm font-medium">
                  {membershipInfo.pointsNeeded - totalLoyaltyPoints} points needed
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Loyalty
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details and contact information</CardDescription>
                </div>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => isEditing ? handleProfileUpdate() : setIsEditing(true)}
                >
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={profileData.address.country}
                    onChange={(e) => setProfileData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, country: e.target.value }
                    }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={profileData.address.street}
                      onChange={(e) => setProfileData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, street: e.target.value }
                      }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profileData.address.city}
                      onChange={(e) => setProfileData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={profileData.address.state}
                      onChange={(e) => setProfileData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, state: e.target.value }
                      }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={profileData.address.zipCode}
                      onChange={(e) => setProfileData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, zipCode: e.target.value }
                      }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loyalty Tab */}
        <TabsContent value="loyalty" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Loyalty Points Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Loyalty Points
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600">{totalLoyaltyPoints}</div>
                    <div className="text-sm text-muted-foreground">Available Points</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Points Value:</span>
                      <span className="font-medium">₹{totalLoyaltyPoints * 0.1}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Next Reward:</span>
                      <span className="font-medium">100 points</span>
                    </div>
                  </div>

                  <Button className="w-full" variant="outline">
                    <Tag className="h-4 w-4 mr-2" />
                    Redeem Points
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Loyalty Transactions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Loyalty History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loyaltyTransactions.map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'earned' ? 'bg-green-100' : 
                            transaction.type === 'redeemed' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            {transaction.type === 'earned' ? (
                              <Plus className="h-4 w-4 text-green-600" />
                            ) : transaction.type === 'redeemed' ? (
                              <Minus className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString()}
                              {transaction.orderId && ` • ${transaction.orderId}`}
                            </div>
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          transaction.type === 'earned' ? 'text-green-600' : 
                          transaction.type === 'redeemed' ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {transaction.type === 'earned' ? '+' : ''}{transaction.amount}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Membership Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Membership Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {membershipInfo.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to be notified about your orders and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <div className="text-sm text-muted-foreground">
                      Receive notifications about order updates and promotions
                    </div>
                  </div>
                  <Switch
                    checked={profileData.preferences.notifications}
                    onCheckedChange={(checked) => handlePreferenceChange('notifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <div className="text-sm text-muted-foreground">
                      Get order updates and receipts via email
                    </div>
                  </div>
                  <Switch
                    checked={profileData.preferences.email}
                    onCheckedChange={(checked) => handlePreferenceChange('email', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <div className="text-sm text-muted-foreground">
                      Receive text messages for urgent updates
                    </div>
                  </div>
                  <Switch
                    checked={profileData.preferences.sms}
                    onCheckedChange={(checked) => handlePreferenceChange('sms', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Communications</Label>
                    <div className="text-sm text-muted-foreground">
                      Receive promotional offers and new service announcements
                    </div>
                  </div>
                  <Switch
                    checked={profileData.preferences.marketing}
                    onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Password Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Password Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                  />
                </div>
                
                <Button onClick={handlePasswordChange} className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <div className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </div>
                  </div>
                  <Switch
                    checked={profileData.security.twoFactor}
                    onCheckedChange={(checked) => handleSecurityChange('twoFactor', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login Alerts</Label>
                    <div className="text-sm text-muted-foreground">
                      Get notified when someone logs into your account
                    </div>
                  </div>
                  <Switch
                    checked={profileData.security.loginAlerts}
                    onCheckedChange={(checked) => handleSecurityChange('loginAlerts', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Account Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Download Account Data</div>
                  <div className="text-sm text-muted-foreground">
                    Get a copy of all your account data
                  </div>
                </div>
                <Button variant="outline" onClick={handleDataExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
                <div>
                  <div className="font-medium text-red-600">Delete Account</div>
                  <div className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </div>
                </div>
                <Button variant="destructive" onClick={handleAccountDeletion}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
