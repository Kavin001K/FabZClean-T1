import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    Plus, Building2, FileText, CreditCard, Settings, Users, Clock, Palette,
    Loader2, Edit, Trash2, AlertTriangle, MapPin, Phone, Mail, Globe
} from "lucide-react";

// Enhanced form schema with all new fields
const franchiseFormSchema = z.object({
    // Basic Info
    name: z.string().min(1, "Franchise name is required"),
    franchiseId: z.string().optional(),
    code: z.string().min(2, "Code must be 2-3 characters").max(3, "Max 3 characters").optional(), // e.g., POL, MUM - for order numbers
    branchCode: z.string().max(5, "Max 5 characters").optional(),
    ownerName: z.string().min(1, "Owner name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(10, "Invalid phone"),
    whatsappNumber: z.string().optional(),

    // Address fields (flattened for easier form handling)
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(5, "Invalid pincode"),

    // Legal & Tax
    legalEntityName: z.string().optional(),
    taxId: z.string().optional(), // PAN
    gstNumber: z.string().optional(),
    gstEnabled: z.boolean().default(true),
    gstRate: z.string().default("18.00"),
    sacCode: z.string().default("9971"),

    // Banking
    bankName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankIfsc: z.string().optional(),
    bankAccountName: z.string().optional(),
    bankBranch: z.string().optional(),

    // UPI
    upiId: z.string().optional(),
    upiDisplayName: z.string().optional(),

    // Manager
    managerName: z.string().optional(),
    managerPhone: z.string().optional(),
    managerEmail: z.string().optional(),

    // Operating Hours
    openingTime: z.string().default("09:00"),
    closingTime: z.string().default("21:00"),

    // Branding
    logoUrl: z.string().optional(),
    primaryColor: z.string().default("#4CAF50"),
    secondaryColor: z.string().default("#2196F3"),

    // Operations
    status: z.enum(["active", "inactive", "pending", "suspended"]).default("active"),
    enableDelivery: z.boolean().default(true),
    defaultDeliveryCharge: z.string().default("0"),
    enableExpressService: z.boolean().default(true),
    expressServiceMultiplier: z.string().default("1.50"),
    autoGenerateOrderNumber: z.boolean().default(true),
    orderNumberPrefix: z.string().optional(),

    // Agreement
    agreementStartDate: z.string().optional(),
    agreementEndDate: z.string().optional(),
    royaltyPercentage: z.string().default("0"),

    // Documents
    documents: z.any().optional(),
});

type FranchiseFormValues = z.infer<typeof franchiseFormSchema>;

export default function FranchiseManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");
    const [editingFranchise, setEditingFranchise] = useState<any>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [franchiseToDelete, setFranchiseToDelete] = useState<string | null>(null);

    const { data: franchises, isLoading } = useQuery({
        queryKey: ["franchises"],
        queryFn: async () => {
            const token = localStorage.getItem('employee_token');
            const res = await fetch("/api/franchises", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch franchises");
            return res.json();
        },
    });

    const form = useForm<FranchiseFormValues>({
        resolver: zodResolver(franchiseFormSchema),
        defaultValues: {
            name: "",
            code: "", // 3-letter code for order numbers
            branchCode: "",
            ownerName: "",
            email: "",
            phone: "",
            whatsappNumber: "",
            street: "",
            city: "",
            state: "Tamil Nadu",
            pincode: "",
            legalEntityName: "",
            taxId: "",
            gstNumber: "",
            gstEnabled: true,
            gstRate: "18.00",
            sacCode: "9971",
            bankName: "",
            bankAccountNumber: "",
            bankIfsc: "",
            bankAccountName: "",
            bankBranch: "",
            upiId: "",
            upiDisplayName: "",
            managerName: "",
            managerPhone: "",
            managerEmail: "",
            openingTime: "09:00",
            closingTime: "21:00",
            primaryColor: "#4CAF50",
            secondaryColor: "#2196F3",
            status: "active",
            enableDelivery: true,
            defaultDeliveryCharge: "0",
            enableExpressService: true,
            expressServiceMultiplier: "1.50",
            autoGenerateOrderNumber: true,
            orderNumberPrefix: "",
            royaltyPercentage: "0",
        },
    });

    const createFranchiseMutation = useMutation({
        mutationFn: async (data: FranchiseFormValues) => {
            // Transform form data to API format
            const payload = {
                ...data,
                address: {
                    street: data.street,
                    city: data.city,
                    state: data.state,
                    pincode: data.pincode,
                },
            };

            const token = localStorage.getItem('employee_token');
            const res = await fetch("/api/franchises", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to create franchise");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["franchises"] });
            setIsDialogOpen(false);
            form.reset();
            toast({ title: "Success", description: "Franchise created successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const updateFranchiseMutation = useMutation({
        mutationFn: async (data: FranchiseFormValues) => {
            const payload = {
                ...data,
                address: {
                    street: data.street,
                    city: data.city,
                    state: data.state,
                    pincode: data.pincode,
                },
            };

            const token = localStorage.getItem('employee_token');
            const res = await fetch(`/api/franchises/${editingFranchise.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to update franchise");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["franchises"] });
            setIsDialogOpen(false);
            setEditingFranchise(null);
            form.reset();
            toast({ title: "Success", description: "Franchise updated successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const deleteFranchiseMutation = useMutation({
        mutationFn: async (id: string) => {
            const token = localStorage.getItem('employee_token');
            const res = await fetch(`/api/franchises/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to delete franchise");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["franchises"] });
            setDeleteConfirmOpen(false);
            setFranchiseToDelete(null);
            toast({ title: "Success", description: "Franchise deleted successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const onSubmit = (data: FranchiseFormValues) => {
        if (editingFranchise) {
            updateFranchiseMutation.mutate(data);
        } else {
            createFranchiseMutation.mutate(data);
        }
    };

    const handleEdit = (franchise: any) => {
        setEditingFranchise(franchise);
        const address = franchise.address || {};
        form.reset({
            name: franchise.name || "",
            code: franchise.code || "", // 3-letter code
            branchCode: franchise.branchCode || "",
            ownerName: franchise.ownerName || "",
            email: franchise.email || "",
            phone: franchise.phone || "",
            whatsappNumber: franchise.whatsappNumber || "",
            street: address.street || "",
            city: address.city || "",
            state: address.state || "Tamil Nadu",
            pincode: address.pincode || address.zip || "",
            legalEntityName: franchise.legalEntityName || "",
            taxId: franchise.taxId || "",
            gstNumber: franchise.gstNumber || "",
            gstEnabled: franchise.gstEnabled ?? true,
            gstRate: franchise.gstRate || "18.00",
            sacCode: franchise.sacCode || "9971",
            bankName: franchise.bankName || "",
            bankAccountNumber: franchise.bankAccountNumber || "",
            bankIfsc: franchise.bankIfsc || "",
            bankAccountName: franchise.bankAccountName || "",
            bankBranch: franchise.bankBranch || "",
            upiId: franchise.upiId || "",
            upiDisplayName: franchise.upiDisplayName || "",
            managerName: franchise.managerName || "",
            managerPhone: franchise.managerPhone || "",
            managerEmail: franchise.managerEmail || "",
            openingTime: franchise.openingTime || "09:00",
            closingTime: franchise.closingTime || "21:00",
            primaryColor: franchise.primaryColor || "#4CAF50",
            secondaryColor: franchise.secondaryColor || "#2196F3",
            status: franchise.status || "active",
            enableDelivery: franchise.enableDelivery ?? true,
            defaultDeliveryCharge: franchise.defaultDeliveryCharge || "0",
            enableExpressService: franchise.enableExpressService ?? true,
            expressServiceMultiplier: franchise.expressServiceMultiplier || "1.50",
            autoGenerateOrderNumber: franchise.autoGenerateOrderNumber ?? true,
            orderNumberPrefix: franchise.orderNumberPrefix || "",
            agreementStartDate: franchise.agreementStartDate ? new Date(franchise.agreementStartDate).toISOString().split('T')[0] : "",
            agreementEndDate: franchise.agreementEndDate ? new Date(franchise.agreementEndDate).toISOString().split('T')[0] : "",
            royaltyPercentage: franchise.royaltyPercentage || "0",
        });
        setActiveTab("basic");
        setIsDialogOpen(true);
    };

    const openCreateDialog = () => {
        setEditingFranchise(null);
        form.reset();
        setActiveTab("basic");
        setIsDialogOpen(true);
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Franchise Management</h1>
                    <p className="text-muted-foreground">
                        Manage franchises, billing details, and operational settings
                    </p>
                </div>
                <Button onClick={openCreateDialog} size="lg">
                    <Plus className="mr-2 h-5 w-5" /> Add Franchise
                </Button>
            </div>

            {/* Enhanced Dialog with Tabs */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {editingFranchise ? "Edit Franchise" : "Add New Franchise"}
                        </DialogTitle>
                        <DialogDescription>
                            Complete all sections to properly set up the franchise for billing and operations.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-6 gap-1">
                                <TabsTrigger value="basic" className="text-xs">
                                    <Building2 className="h-4 w-4 mr-1" /> Basic
                                </TabsTrigger>
                                <TabsTrigger value="address" className="text-xs">
                                    <MapPin className="h-4 w-4 mr-1" /> Address
                                </TabsTrigger>
                                <TabsTrigger value="legal" className="text-xs">
                                    <FileText className="h-4 w-4 mr-1" /> Legal/Tax
                                </TabsTrigger>
                                <TabsTrigger value="banking" className="text-xs">
                                    <CreditCard className="h-4 w-4 mr-1" /> Banking
                                </TabsTrigger>
                                <TabsTrigger value="manager" className="text-xs">
                                    <Users className="h-4 w-4 mr-1" /> Manager
                                </TabsTrigger>
                                <TabsTrigger value="settings" className="text-xs">
                                    <Settings className="h-4 w-4 mr-1" /> Settings
                                </TabsTrigger>
                            </TabsList>

                            {/* Basic Info Tab */}
                            <TabsContent value="basic" className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Franchise Name *</Label>
                                        <Input {...form.register("name")} placeholder="e.g. FabZClean Pollachi" />
                                        {form.formState.errors.name && (
                                            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="code">Location Code (3 letters) *</Label>
                                        <Input
                                            {...form.register("code")}
                                            placeholder="POL"
                                            maxLength={3}
                                            className="uppercase font-mono"
                                            onChange={(e) => form.setValue("code", e.target.value.toUpperCase())}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Used in order numbers: FZC26<strong>POL</strong>A0001
                                        </p>
                                        {form.formState.errors.code && (
                                            <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ownerName">Owner Name *</Label>
                                        <Input {...form.register("ownerName")} placeholder="Full Name" />
                                        {form.formState.errors.ownerName && (
                                            <p className="text-sm text-red-500">{form.formState.errors.ownerName.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input {...form.register("email")} type="email" placeholder="franchise@example.com" />
                                        {form.formState.errors.email && (
                                            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone *</Label>
                                        <Input {...form.register("phone")} placeholder="+91 98765 43210" />
                                        {form.formState.errors.phone && (
                                            <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                                        <Input {...form.register("whatsappNumber")} placeholder="+91 98765 43210" />
                                        <p className="text-xs text-muted-foreground">For customer notifications</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="openingTime">Opening Time</Label>
                                        <Input {...form.register("openingTime")} type="time" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="closingTime">Closing Time</Label>
                                        <Input {...form.register("closingTime")} type="time" />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Address Tab */}
                            <TabsContent value="address" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="street">Street Address *</Label>
                                    <Textarea {...form.register("street")} placeholder="Complete street address" rows={2} />
                                    {form.formState.errors.street && (
                                        <p className="text-sm text-red-500">{form.formState.errors.street.message}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City *</Label>
                                        <Input {...form.register("city")} placeholder="City" />
                                        {form.formState.errors.city && (
                                            <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State *</Label>
                                        <Input {...form.register("state")} placeholder="State" />
                                        {form.formState.errors.state && (
                                            <p className="text-sm text-red-500">{form.formState.errors.state.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pincode">Pincode *</Label>
                                        <Input {...form.register("pincode")} placeholder="642002" />
                                        {form.formState.errors.pincode && (
                                            <p className="text-sm text-red-500">{form.formState.errors.pincode.message}</p>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Legal & Tax Tab */}
                            <TabsContent value="legal" className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="legalEntityName">Legal Entity Name</Label>
                                        <Input {...form.register("legalEntityName")} placeholder="Registered business name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="taxId">PAN Number</Label>
                                        <Input {...form.register("taxId")} placeholder="AAAAA0000A" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gstNumber">GST Number (GSTIN)</Label>
                                        <Input {...form.register("gstNumber")} placeholder="33AAAAA0000A1Z5" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sacCode">SAC Code</Label>
                                        <Input {...form.register("sacCode")} placeholder="9971" />
                                        <p className="text-xs text-muted-foreground">Service Accounting Code for GST</p>
                                    </div>
                                </div>

                                <div className="border rounded-lg p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="gstEnabled">Enable GST on Invoices</Label>
                                            <p className="text-xs text-muted-foreground">GST will be calculated and shown on all bills</p>
                                        </div>
                                        <Switch
                                            checked={form.watch("gstEnabled")}
                                            onCheckedChange={(v) => form.setValue("gstEnabled", v)}
                                        />
                                    </div>
                                    {form.watch("gstEnabled") && (
                                        <div className="space-y-2">
                                            <Label htmlFor="gstRate">GST Rate (%)</Label>
                                            <Input {...form.register("gstRate")} type="number" step="0.01" className="w-32" />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="agreementStartDate">Agreement Start Date</Label>
                                        <DatePicker
                                            date={form.watch("agreementStartDate") ? new Date(form.watch("agreementStartDate") as string) : undefined}
                                            setDate={(date) => form.setValue("agreementStartDate", date ? date.toISOString().split('T')[0] : "")}
                                            placeholder="Select start date"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="agreementEndDate">Agreement End Date</Label>
                                        <DatePicker
                                            date={form.watch("agreementEndDate") ? new Date(form.watch("agreementEndDate") as string) : undefined}
                                            setDate={(date) => form.setValue("agreementEndDate", date ? date.toISOString().split('T')[0] : "")}
                                            placeholder="Select end date"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="royaltyPercentage">Royalty Percentage</Label>
                                        <Input {...form.register("royaltyPercentage")} type="number" step="0.01" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select value={form.watch("status")} onValueChange={(v: any) => form.setValue("status", v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="suspended">Suspended</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Banking Tab */}
                            <TabsContent value="banking" className="space-y-4 pt-4">
                                <div className="border rounded-lg p-4 space-y-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" /> Bank Account Details
                                    </h3>
                                    <p className="text-sm text-muted-foreground">These details will appear on invoices for bank transfers</p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="bankName">Bank Name</Label>
                                            <Input {...form.register("bankName")} placeholder="e.g. State Bank of India" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bankBranch">Branch</Label>
                                            <Input {...form.register("bankBranch")} placeholder="Branch name" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bankAccountName">Account Holder Name</Label>
                                            <Input {...form.register("bankAccountName")} placeholder="Name as per bank" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bankAccountNumber">Account Number</Label>
                                            <Input {...form.register("bankAccountNumber")} placeholder="Account number" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bankIfsc">IFSC Code</Label>
                                            <Input {...form.register("bankIfsc")} placeholder="SBIN0001234" />
                                        </div>
                                    </div>
                                </div>

                                <div className="border rounded-lg p-4 space-y-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <Globe className="h-4 w-4" /> UPI Payment
                                    </h3>
                                    <p className="text-sm text-muted-foreground">UPI details for QR code on invoices</p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="upiId">UPI ID</Label>
                                            <Input {...form.register("upiId")} placeholder="yourname@upi" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="upiDisplayName">Display Name</Label>
                                            <Input {...form.register("upiDisplayName")} placeholder="Name shown in payment apps" />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Manager Tab */}
                            <TabsContent value="manager" className="space-y-4 pt-4">
                                <div className="border rounded-lg p-4 space-y-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <Users className="h-4 w-4" /> Store Manager Details
                                    </h3>
                                    <p className="text-sm text-muted-foreground">Primary contact person for this franchise</p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="managerName">Manager Name</Label>
                                            <Input {...form.register("managerName")} placeholder="Full name" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="managerPhone">Manager Phone</Label>
                                            <Input {...form.register("managerPhone")} placeholder="+91 98765 43210" />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label htmlFor="managerEmail">Manager Email</Label>
                                            <Input {...form.register("managerEmail")} type="email" placeholder="manager@example.com" />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Settings Tab */}
                            <TabsContent value="settings" className="space-y-4 pt-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border rounded-lg p-4">
                                        <div>
                                            <Label>Auto-Generate Order Numbers</Label>
                                            <p className="text-xs text-muted-foreground">Automatically generate unique order numbers</p>
                                        </div>
                                        <Switch
                                            checked={form.watch("autoGenerateOrderNumber")}
                                            onCheckedChange={(v) => form.setValue("autoGenerateOrderNumber", v)}
                                        />
                                    </div>

                                    {form.watch("autoGenerateOrderNumber") && (
                                        <div className="space-y-2 pl-4">
                                            <Label htmlFor="orderNumberPrefix">Order Number Prefix (Optional)</Label>
                                            <Input {...form.register("orderNumberPrefix")} placeholder="Leave empty for default (FZC)" className="w-48" />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between border rounded-lg p-4">
                                        <div>
                                            <Label>Enable Delivery Service</Label>
                                            <p className="text-xs text-muted-foreground">Allow home delivery for orders</p>
                                        </div>
                                        <Switch
                                            checked={form.watch("enableDelivery")}
                                            onCheckedChange={(v) => form.setValue("enableDelivery", v)}
                                        />
                                    </div>

                                    {form.watch("enableDelivery") && (
                                        <div className="space-y-2 pl-4">
                                            <Label htmlFor="defaultDeliveryCharge">Default Delivery Charge (₹)</Label>
                                            <Input {...form.register("defaultDeliveryCharge")} type="number" step="0.01" className="w-32" />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between border rounded-lg p-4">
                                        <div>
                                            <Label>Enable Express Service</Label>
                                            <p className="text-xs text-muted-foreground">Offer faster processing at premium rates</p>
                                        </div>
                                        <Switch
                                            checked={form.watch("enableExpressService")}
                                            onCheckedChange={(v) => form.setValue("enableExpressService", v)}
                                        />
                                    </div>

                                    {form.watch("enableExpressService") && (
                                        <div className="space-y-2 pl-4">
                                            <Label htmlFor="expressServiceMultiplier">Express Price Multiplier</Label>
                                            <Input {...form.register("expressServiceMultiplier")} type="number" step="0.1" className="w-32" />
                                            <p className="text-xs text-muted-foreground">e.g., 1.5 = 50% extra charge</p>
                                        </div>
                                    )}
                                </div>

                                <div className="border rounded-lg p-4 space-y-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <Palette className="h-4 w-4" /> Branding
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="primaryColor">Primary Color</Label>
                                            <div className="flex gap-2">
                                                <Input {...form.register("primaryColor")} type="color" className="w-16 h-10" />
                                                <Input {...form.register("primaryColor")} placeholder="#4CAF50" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="secondaryColor">Secondary Color</Label>
                                            <div className="flex gap-2">
                                                <Input {...form.register("secondaryColor")} type="color" className="w-16 h-10" />
                                                <Input {...form.register("secondaryColor")} placeholder="#2196F3" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createFranchiseMutation.isPending || updateFranchiseMutation.isPending}>
                                {(createFranchiseMutation.isPending || updateFranchiseMutation.isPending) && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {editingFranchise ? "Update Franchise" : "Create Franchise"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Confirm Deletion
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this franchise? This action cannot be undone and will affect all associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => franchiseToDelete && deleteFranchiseMutation.mutate(franchiseToDelete)}
                            disabled={deleteFranchiseMutation.isPending}
                        >
                            {deleteFranchiseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Franchise
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Franchises Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Franchises</CardTitle>
                    <CardDescription>Manage and view all registered franchises</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>GST</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : franchises?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No franchises found. Click "Add Franchise" to create one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                franchises?.map((franchise: any) => (
                                    <TableRow key={franchise.id}>
                                        <TableCell>
                                            <div className="font-mono text-sm bg-primary/10 text-primary px-2 py-1 rounded w-fit font-bold">
                                                {franchise.code || franchise.branchCode || franchise.franchiseId?.slice(0, 3) || "—"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{franchise.name}</div>
                                            <div className="text-xs text-muted-foreground">{franchise.ownerName}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-sm">
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" /> {franchise.phone}
                                                </span>
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <Mail className="h-3 w-3" /> {franchise.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {franchise.address?.city || "N/A"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {franchise.gstNumber ? (
                                                <Badge variant="outline" className="text-green-600">
                                                    {franchise.gstNumber.slice(0, 10)}...
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">Not Set</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={franchise.status === "active" ? "default" : "secondary"}>
                                                {franchise.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(franchise)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600"
                                                    onClick={() => {
                                                        setFranchiseToDelete(franchise.id);
                                                        setDeleteConfirmOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
