import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Lock, Shield, LogOut, Camera, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { ImageCropperDialog } from '@/components/image-cropper-dialog';

export default function ProfilePage() {
    const { employee, signOut, refreshEmployee } = useAuth();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            const token = localStorage.getItem('employee_token');
            const res = await fetch(`/api/auth/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || error.message || 'Failed to update profile');
            }

            toast({
                title: 'Profile Updated',
                description: 'Your profile has been updated successfully.',
            });
            setIsEditing(false);

            // Refresh employee data
            if (refreshEmployee) {
                await refreshEmployee();
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update profile',
                variant: 'destructive',
            });
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Invalid File',
                description: 'Please select an image file (JPG, PNG, etc.)',
                variant: 'destructive',
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'File Too Large',
                description: 'Please select an image smaller than 5MB',
                variant: 'destructive',
            });
            return;
        }

        // Read file and open cropper
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
            setIsCropperOpen(true);
        };
        reader.onerror = () => {
            toast({
                title: 'Error',
                description: 'Failed to read image file',
                variant: 'destructive',
            });
        };
        reader.readAsDataURL(file);

        // Reset file input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCroppedImageUpload = async (croppedImageBase64: string) => {
        setIsUploading(true);

        try {
            const token = localStorage.getItem('employee_token');
            const res = await fetch('/api/auth/upload-profile-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ imageData: croppedImageBase64 }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to upload image');
            }

            toast({
                title: 'Photo Updated',
                description: 'Your profile photo has been updated successfully.',
            });

            // Refresh employee data to get the new image
            if (refreshEmployee) {
                await refreshEmployee();
            }

            setSelectedImage(null);
        } catch (error: any) {
            toast({
                title: 'Upload Failed',
                description: error.message || 'Failed to upload profile photo',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formDataObj = new FormData(e.currentTarget);
        const currentPassword = formDataObj.get('currentPassword') as string;
        const newPassword = formDataObj.get('newPassword') as string;
        const confirmPassword = formDataObj.get('confirmPassword') as string;

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

        setIsChangingPassword(true);

        try {
            const token = localStorage.getItem('employee_token');
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.message || 'Failed to change password');
            }

            toast({
                title: 'Password Changed',
                description: 'Your password has been changed successfully.',
            });
            e.currentTarget.reset();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to change password. Please check your current password.',
                variant: 'destructive',
            });
        } finally {
            setIsChangingPassword(false);
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

    const getRoleDisplayName = (role: string) => {
        const names: Record<string, string> = {
            admin: 'Administrator',
            franchise_manager: 'Franchise Manager',
            factory_manager: 'Factory Manager',
            employee: 'Staff',
            driver: 'Driver',
            staff: 'Staff',
        };
        return names[role] || role?.replace('_', ' ').toUpperCase();
    };

    // Get profile image from employee data
    const profileImage = (employee as any)?.profileImage;

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
                            {/* Profile Image with Upload */}
                            <div className="relative group">
                                <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
                                    <AvatarImage src={profileImage || ''} alt={employee?.fullName} />
                                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                        {getInitials(employee?.fullName || employee?.username || 'U')}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Upload overlay */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                                    ) : (
                                        <Camera className="h-6 w-6 text-white" />
                                    )}
                                </button>

                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Click to upload photo (max 5MB)
                            </p>

                            <div className="text-center">
                                <h3 className="text-xl font-semibold">{employee?.fullName || employee?.username}</h3>
                                <p className="text-sm text-muted-foreground">@{employee?.username || employee?.employeeId}</p>
                            </div>
                            <Badge className={`${getRoleBadgeColor(employee?.role || '')} text-white`}>
                                {getRoleDisplayName(employee?.role || '')}
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate">{employee?.email || 'No email set'}</span>
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
                                            <Button onClick={() => setIsEditing(true)}>
                                                <User className="mr-2 h-4 w-4" />
                                                Edit Profile
                                            </Button>
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
                                            placeholder="Enter current password"
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
                                            placeholder="Enter new password (min 8 characters)"
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
                                            placeholder="Confirm new password"
                                        />
                                    </div>

                                    <Button type="submit" disabled={isChangingPassword}>
                                        {isChangingPassword ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Lock className="mr-2 h-4 w-4" />
                                        )}
                                        Change Password
                                    </Button>
                                </form>
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                </Card>
            </div>
            {/* Image Cropper Dialog */}
            {selectedImage && (
                <ImageCropperDialog
                    open={isCropperOpen}
                    onOpenChange={(open) => {
                        setIsCropperOpen(open);
                        if (!open) setSelectedImage(null);
                    }}
                    imageSrc={selectedImage}
                    onCropComplete={handleCroppedImageUpload}
                    aspectRatio={1}
                    circularCrop={true}
                    title="Crop Profile Photo"
                    description="Drag to adjust and crop your profile photo"
                />
            )}
        </div>
    );
}
