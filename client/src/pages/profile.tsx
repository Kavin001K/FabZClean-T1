import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
  User, Mail, Phone, Lock, LogOut, 
  Camera, Loader2, MapPin, ShieldCheck,
  Save, X
} from 'lucide-react';
import { useLocation } from 'wouter';
import { ImageCropperDialog } from '@/components/image-cropper-dialog';
import { handleFormEnterNavigation } from '@/lib/enter-navigation';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
    useEffect(() => {
        document.title = "Profile | FabzClean";
    }, []);

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
        address: employee?.address || '',
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
                body: JSON.stringify(formData),
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

            if (refreshEmployee) {
                await refreshEmployee();
            }
        } catch (error: any) {
            toast({
                title: 'Update Failed',
                description: error.message || 'Failed to update profile',
                variant: 'destructive',
            });
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Invalid File',
                description: 'Please select an image file.',
                variant: 'destructive',
            });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
            setIsCropperOpen(true);
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCroppedImageUpload = async (croppedImageBase64: string) => {
        setIsUploading(true);
        try {
            const token = localStorage.getItem('employee_token');
            const response = await fetch(croppedImageBase64);
            const blob = await response.blob();
            const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

            const uploadFormData = new FormData();
            uploadFormData.append('image', file);

            const res = await fetch('/api/auth/upload-profile-image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: uploadFormData,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                const msg = data?.error || data?.message || 'Image upload not available';
                throw new Error(msg);
            }

            toast({
                title: 'Photo Updated',
                description: 'Your profile photo has been updated.',
            });

            if (refreshEmployee) await refreshEmployee();
        } catch (error: any) {
            toast({
                title: 'Image upload unavailable',
                description: 'Image upload is not available right now — please contact support.',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
            setIsCropperOpen(false);
            setSelectedImage(null);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const currentPassword = fd.get('currentPassword') as string;
        const newPassword = fd.get('newPassword') as string;
        const confirmPassword = fd.get('confirmPassword') as string;

        if (newPassword !== confirmPassword) {
            toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
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
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to change password');
            }

            toast({ title: 'Success', description: 'Password changed successfully.' });
            (e.target as HTMLFormElement).reset();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
    };

    const avatarSource = employee?.avatarUrl || employee?.profileImage;

    return (
        <div className="container-desktop min-h-screen py-8 pb-20 sm:pb-8 gradient-mesh">
            <div className="mx-auto max-w-5xl space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Account Settings
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your personal information and security preferences.
                        </p>
                    </div>
                    <Button variant="ghost" onClick={handleLogout} className="text-destructive hover:bg-destructive/10 rounded-xl">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Left Column: Profile Summary */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="glass border-none shadow-2xl overflow-hidden ring-1 ring-white/10">
                            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                    <Avatar className="h-32 w-32 ring-4 ring-background shadow-2xl relative">
                                        <AvatarImage src={avatarSource} className="object-cover" />
                                        <AvatarFallback className="text-4xl bg-primary/10 text-primary font-bold">
                                            {getInitials(employee?.fullName || employee?.username || '')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="absolute bottom-1 right-1 p-2.5 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95 z-10"
                                    >
                                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                    </button>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold tracking-tight">{employee?.fullName || 'Anonymous'}</h2>
                                    <p className="text-muted-foreground font-medium">@{employee?.username || 'user'}</p>
                                </div>

                                <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-primary/10 text-primary border-primary/20 text-xs font-semibold uppercase tracking-wider">
                                    {employee?.role?.replace('_', ' ')}
                                </Badge>

                                <div className="w-full space-y-4 pt-4 text-left border-t border-white/5">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 rounded-lg bg-white/5 text-muted-foreground">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium truncate">{employee?.email || 'No email set'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 rounded-lg bg-white/5 text-muted-foreground">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium">{employee?.phone || 'No phone set'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 rounded-lg bg-white/5 text-muted-foreground">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium">ID: {employee?.employeeId}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Tabbed Interface */}
                    <div className="lg:col-span-8">
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-2xl glass mb-6">
                                <TabsTrigger value="general" className="rounded-xl py-2.5 data-[state=active]:shadow-lg">Profile Details</TabsTrigger>
                                <TabsTrigger value="security" className="rounded-xl py-2.5 data-[state=active]:shadow-lg">Security</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <Card className="glass border-none shadow-xl ring-1 ring-white/10 overflow-hidden">
                                    <CardHeader className="p-6 border-b border-white/5">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle className="text-xl">General Information</CardTitle>
                                                <CardDescription>Update your personal and contact details.</CardDescription>
                                            </div>
                                            {!isEditing && (
                                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl">
                                                    <User className="mr-2 h-4 w-4" /> Edit
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground">Full Name</Label>
                                                <Input
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                    disabled={!isEditing}
                                                    className="rounded-xl glass border-white/10 focus:ring-primary/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground">Email Address</Label>
                                                <Input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    disabled={!isEditing}
                                                    className="rounded-xl glass border-white/10 focus:ring-primary/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground">Phone Number</Label>
                                                <Input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    disabled={!isEditing}
                                                    className="rounded-xl glass border-white/10 focus:ring-primary/50"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label className="text-muted-foreground flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" /> Residential Address
                                                </Label>
                                                <Input
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    disabled={!isEditing}
                                                    placeholder="Enter your full address"
                                                    className="rounded-xl glass border-white/10 focus:ring-primary/50"
                                                />
                                            </div>
                                        </div>

                                        {isEditing && (
                                            <div className="flex gap-3 pt-4 justify-end">
                                                <Button variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl">
                                                    <X className="mr-2 h-4 w-4" /> Cancel
                                                </Button>
                                                <Button onClick={handleSave} className="rounded-xl shadow-lg shadow-primary/20 px-8">
                                                    <Save className="mr-2 h-4 w-4" /> Save Changes
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="security" className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <Card className="glass border-none shadow-xl ring-1 ring-white/10 overflow-hidden">
                                    <CardHeader className="p-6 border-b border-white/5">
                                        <CardTitle className="text-xl">Security & Password</CardTitle>
                                        <CardDescription>Secure your account with a strong password.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <form onSubmit={handlePasswordChange} onKeyDownCapture={handleFormEnterNavigation} className="space-y-6 max-w-md mx-auto py-4">
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground">Current Password</Label>
                                                <Input
                                                    name="currentPassword"
                                                    type="password"
                                                    required
                                                    className="rounded-xl glass border-white/10 focus:ring-primary/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground">New Password</Label>
                                                <Input
                                                    name="newPassword"
                                                    type="password"
                                                    required
                                                    minLength={8}
                                                    className="rounded-xl glass border-white/10 focus:ring-primary/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground">Confirm New Password</Label>
                                                <Input
                                                    name="confirmPassword"
                                                    type="password"
                                                    required
                                                    minLength={8}
                                                    className="rounded-xl glass border-white/10 focus:ring-primary/50"
                                                />
                                            </div>
                                            <Button type="submit" disabled={isChangingPassword} className="w-full rounded-xl py-6 text-lg font-semibold shadow-xl shadow-primary/10">
                                                {isChangingPassword ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
                                                Update Password
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
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
