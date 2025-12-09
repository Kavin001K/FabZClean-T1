import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, MapPin, Lock, Shield, Calendar, LogOut } from 'lucide-react';
import { useLocation } from 'wouter';

export default function ProfilePage() {
    const { employee, signOut } = useAuth();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: employee?.fullName || '',
        email: employee?.email || '',
        phone: employee?.phone || '',
    });

    const handleLogout = async () => {
        try {
            await signOut();
            toast({
                title: 'Logged Out',
                description: 'You have been successfully logged out.',
            });
            setLocation('/login');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to logout. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`/api/employees/${employee?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to update profile');
            }

            toast({
                title: 'Profile Updated',
                description: 'Your profile has been updated successfully.',
            });
            setIsEditing(false);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update profile. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const currentPassword = formData.get('currentPassword') as string;
        const newPassword = formData.get('newPassword') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (newPassword !== confirmPassword) {
            toast({
                title: 'Error',
                description: 'New passwords do not match.',
                variant: 'destructive',
            });
            return;
        }

        if (newPassword.length < 8) {
            toast({
                title: 'Error',
                description: 'Password must be at least 8 characters long.',
                variant: 'destructive',
            });
            return;
        }

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employeeId: employee?.id,
                    currentPassword,
                    newPassword,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to change password');
            }

            toast({
                title: 'Password Changed',
                description: 'Your password has been changed successfully.',
            });
            e.currentTarget.reset();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to change password. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-red-500',
            franchise_manager: 'bg-blue-500',
            factory_manager: 'bg-green-500',
            employee: 'bg-yellow-500',
            driver: 'bg-purple-500',
        };
        return colors[role] || 'bg-gray-500';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <Button variant="destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Your account information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src="" />
                                <AvatarFallback className="text-2xl">
                                    {getInitials(employee?.fullName || employee?.username || 'U')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <h3 className="text-xl font-semibold">{employee?.fullName || employee?.username}</h3>
                                <p className="text-sm text-muted-foreground">@{employee?.username}</p>
                            </div>
                            <Badge className={getRoleBadgeColor(employee?.role || '')}>
                                {employee?.role?.replace('_', ' ').toUpperCase()}
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{employee?.email || 'No email set'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{employee?.phone || 'No phone set'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span>Employee ID: {employee?.employeeId}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Settings Tabs */}
                <Card className="md:col-span-2">
                    <Tabs defaultValue="general" className="w-full">
                        <CardHeader>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="security">Security</TabsTrigger>
                            </TabsList>
                        </CardHeader>

                        <CardContent>
                            <TabsContent value="general" className="space-y-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="fullName"
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        {!isEditing ? (
                                            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                                        ) : (
                                            <>
                                                <Button onClick={handleSave}>Save Changes</Button>
                                                <Button variant="outline" onClick={() => setIsEditing(false)}>
                                                    Cancel
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="security" className="space-y-4">
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Current Password</Label>
                                        <Input
                                            id="currentPassword"
                                            name="currentPassword"
                                            type="password"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <Input
                                            id="newPassword"
                                            name="newPassword"
                                            type="password"
                                            required
                                            minLength={8}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            required
                                            minLength={8}
                                        />
                                    </div>

                                    <Button type="submit">
                                        <Lock className="mr-2 h-4 w-4" />
                                        Change Password
                                    </Button>
                                </form>
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
