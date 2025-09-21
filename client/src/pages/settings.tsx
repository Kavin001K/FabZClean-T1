import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Database,
  Globe,
  Smartphone,
  Mail,
  Phone,
  MapPin,
  Building,
  DollarSign,
  Clock,
  Calendar,
  Save,
  Eye,
  EyeOff,
  Upload,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { addNotification } = useNotifications();

  // Settings state
  const [settings, setSettings] = useState({
    // General Settings
    businessName: 'FabZClean Franchise',
    businessEmail: 'info@fabzclean.com',
    businessPhone: '+91 98765 43210',
    businessAddress: '123 Business Park, Bangalore, KA 560001',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderNotifications: true,
    paymentNotifications: true,
    attendanceNotifications: true,
    deliveryNotifications: true,
    maintenanceNotifications: true,
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    auditLog: true,
    
    // Appearance Settings
    theme: 'system',
    primaryColor: '#3b82f6',
    sidebarCollapsed: false,
    compactMode: false,
    
    // Business Settings
    operatingHours: {
      start: '08:00',
      end: '20:00',
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    serviceSettings: {
      advancePaymentRequired: false,
      advancePaymentPercentage: 20,
      deliveryFee: 50,
      minimumOrderAmount: 100,
      autoAcceptOrders: false
    },
    
    // Data Settings
    backupFrequency: 'weekly',
    dataRetention: 365,
    exportFormat: 'csv',
    autoBackup: true
  });

  // Profile state
  const [profile, setProfile] = useState({
    name: 'Franchise Owner',
    email: 'owner@fabzclean.com',
    phone: '+91 98765 43210',
    address: '123 Owner Street, Bangalore, KA 560001',
    position: 'Franchise Owner',
    department: 'Management',
    hireDate: '2024-01-01',
    avatar: ''
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleSettingChange = (key: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNestedSettingChange = (parentKey: string, childKey: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey as keyof typeof prev],
        [childKey]: value
      }
    }));
  };

  const handleProfileUpdate = () => {
    addNotification({
      type: 'success',
      title: 'Profile Updated!',
      message: 'Your profile information has been updated successfully.',
    });
    
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    addNotification({
      type: 'success',
      title: 'Password Changed!',
      message: 'Your password has been changed successfully.',
    });
    
    toast({
      title: "Password Changed",
      description: "Your password has been updated successfully.",
    });

    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleSettingsSave = () => {
    addNotification({
      type: 'success',
      title: 'Settings Saved!',
      message: 'All settings have been saved successfully.',
    });
    
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully.",
    });
  };

  const exportSettings = () => {
    const settingsData = {
      settings,
      profile,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fabzclean_settings_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Settings Exported",
      description: "Your settings have been exported successfully.",
    });
  };

  const workingDays = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings & Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings, preferences, and business configuration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSettings}>
            <Download className="w-4 h-4 mr-2" />
            Export Settings
          </Button>
          <Button onClick={handleSettingsSave}>
            <Save className="w-4 h-4 mr-2" />
            Save All Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-foreground">
                      {profile.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{profile.name}</h3>
                    <p className="text-muted-foreground">{profile.position}</p>
                    <Badge variant="outline" className="mt-1">
                      {profile.department}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Full Name</Label>
                    <Input
                      id="profile-name"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone">Phone</Label>
                    <Input
                      id="profile-phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-position">Position</Label>
                    <Input
                      id="profile-position"
                      value={profile.position}
                      onChange={(e) => setProfile({...profile, position: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-address">Address</Label>
                  <Textarea
                    id="profile-address"
                    value={profile.address}
                    onChange={(e) => setProfile({...profile, address: e.target.value})}
                  />
                </div>

                <Button onClick={handleProfileUpdate}>
                  <Save className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button onClick={handlePasswordChange} className="w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Change Password
                </Button>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 text-blue-800 dark:text-blue-400">Password Requirements</h4>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Include uppercase and lowercase letters</li>
                    <li>• Include at least one number</li>
                    <li>• Include at least one special character</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    value={settings.businessName}
                    onChange={(e) => handleSettingChange('businessName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-email">Business Email</Label>
                  <Input
                    id="business-email"
                    type="email"
                    value={settings.businessEmail}
                    onChange={(e) => handleSettingChange('businessEmail', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-phone">Business Phone</Label>
                  <Input
                    id="business-phone"
                    value={settings.businessPhone}
                    onChange={(e) => handleSettingChange('businessPhone', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-address">Business Address</Label>
                  <Textarea
                    id="business-address"
                    value={settings.businessAddress}
                    onChange={(e) => handleSettingChange('businessAddress', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Regional Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={settings.currency} onValueChange={(value) => handleSettingChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="AED">UAE Dirham (د.إ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="ta">Tamil</SelectItem>
                      <SelectItem value="te">Telugu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select value={settings.dateFormat} onValueChange={(value) => handleSettingChange('dateFormat', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Notification Channels</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Notifications</span>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      <span>SMS Notifications</span>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      <span>Push Notifications</span>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Notification Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>New Orders</span>
                    <Switch
                      checked={settings.orderNotifications}
                      onCheckedChange={(checked) => handleSettingChange('orderNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Payment Updates</span>
                    <Switch
                      checked={settings.paymentNotifications}
                      onCheckedChange={(checked) => handleSettingChange('paymentNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Attendance Alerts</span>
                    <Switch
                      checked={settings.attendanceNotifications}
                      onCheckedChange={(checked) => handleSettingChange('attendanceNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivery Updates</span>
                    <Switch
                      checked={settings.deliveryNotifications}
                      onCheckedChange={(checked) => handleSettingChange('deliveryNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Maintenance Reminders</span>
                    <Switch
                      checked={settings.maintenanceNotifications}
                      onCheckedChange={(checked) => handleSettingChange('maintenanceNotifications', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Two-Factor Authentication</span>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-expiry">Password Expiry (days)</Label>
                  <Input
                    id="password-expiry"
                    type="number"
                    value={settings.passwordExpiry}
                    onChange={(e) => handleSettingChange('passwordExpiry', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-attempts">Max Login Attempts</Label>
                  <Input
                    id="login-attempts"
                    type="number"
                    value={settings.loginAttempts}
                    onChange={(e) => handleSettingChange('loginAttempts', parseInt(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span>Audit Logging</span>
                  <Switch
                    checked={settings.auditLog}
                    onCheckedChange={(checked) => handleSettingChange('auditLog', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <Select value={settings.backupFrequency} onValueChange={(value) => handleSettingChange('backupFrequency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-retention">Data Retention (days)</Label>
                  <Input
                    id="data-retention"
                    type="number"
                    value={settings.dataRetention}
                    onChange={(e) => handleSettingChange('dataRetention', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="export-format">Export Format</Label>
                  <Select value={settings.exportFormat} onValueChange={(value) => handleSettingChange('exportFormat', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <span>Auto Backup</span>
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Business Settings Tab */}
        <TabsContent value="business" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Operating Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Opening Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={settings.operatingHours.start}
                      onChange={(e) => handleNestedSettingChange('operatingHours', 'start', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">Closing Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={settings.operatingHours.end}
                      onChange={(e) => handleNestedSettingChange('operatingHours', 'end', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Working Days</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {workingDays.map((day) => (
                      <div key={day.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={day.key}
                          checked={settings.operatingHours.workingDays.includes(day.key)}
                          onChange={(e) => {
                            const days = settings.operatingHours.workingDays;
                            const newDays = e.target.checked
                              ? [...days, day.key]
                              : days.filter(d => d !== day.key);
                            handleNestedSettingChange('operatingHours', 'workingDays', newDays);
                          }}
                        />
                        <Label htmlFor={day.key} className="text-sm">{day.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Service Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Require Advance Payment</span>
                  <Switch
                    checked={settings.serviceSettings.advancePaymentRequired}
                    onCheckedChange={(checked) => handleNestedSettingChange('serviceSettings', 'advancePaymentRequired', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advance-percentage">Advance Payment %</Label>
                  <Input
                    id="advance-percentage"
                    type="number"
                    value={settings.serviceSettings.advancePaymentPercentage}
                    onChange={(e) => handleNestedSettingChange('serviceSettings', 'advancePaymentPercentage', parseInt(e.target.value))}
                    disabled={!settings.serviceSettings.advancePaymentRequired}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery-fee">Delivery Fee (₹)</Label>
                  <Input
                    id="delivery-fee"
                    type="number"
                    value={settings.serviceSettings.deliveryFee}
                    onChange={(e) => handleNestedSettingChange('serviceSettings', 'deliveryFee', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-order">Minimum Order Amount (₹)</Label>
                  <Input
                    id="min-order"
                    type="number"
                    value={settings.serviceSettings.minimumOrderAmount}
                    onChange={(e) => handleNestedSettingChange('serviceSettings', 'minimumOrderAmount', parseInt(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span>Auto Accept Orders</span>
                  <Switch
                    checked={settings.serviceSettings.autoAcceptOrders}
                    onCheckedChange={(checked) => handleNestedSettingChange('serviceSettings', 'autoAcceptOrders', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <span className="text-sm text-muted-foreground">{settings.primaryColor}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span>Collapse Sidebar by Default</span>
                  <Switch
                    checked={settings.sidebarCollapsed}
                    onCheckedChange={(checked) => handleSettingChange('sidebarCollapsed', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span>Compact Mode</span>
                  <Switch
                    checked={settings.compactMode}
                    onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Preview</h4>
                <p className="text-sm text-muted-foreground">
                  Theme changes will be applied immediately. Other appearance settings may require a page refresh.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
