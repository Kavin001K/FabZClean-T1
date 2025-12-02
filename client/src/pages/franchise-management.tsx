import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Plus, Building2, FileText, Info, Loader2, Edit, Trash2, AlertTriangle } from "lucide-react";
import { insertFranchiseSchema } from "@shared/schema";

// Extend schema for file upload handling in form
const franchiseFormSchema = insertFranchiseSchema.extend({
    documents: z.any().optional(), // FileList or array of files
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
            const res = await fetch("/api/franchises");
            if (!res.ok) throw new Error("Failed to fetch franchises");
            return res.json();
        },
    });

    const form = useForm<FranchiseFormValues>({
        resolver: zodResolver(franchiseFormSchema),
        defaultValues: {
            name: "",
            ownerName: "",
            email: "",
            phone: "",
            address: {},
            legalEntityName: "",
            taxId: "",
            status: "active",
            royaltyPercentage: "0",
        },
    });

    const createFranchiseMutation = useMutation({
        mutationFn: async (data: FranchiseFormValues) => {
            const formData = new FormData();
            const { documents, ...rest } = data;
            formData.append("data", JSON.stringify(rest));
            if (documents && documents.length > 0) {
                for (let i = 0; i < documents.length; i++) {
                    formData.append("documents", documents[i]);
                }
            }
            const res = await fetch("/api/franchises", {
                method: "POST",
                body: formData,
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
            const formData = new FormData();
            const { documents, ...rest } = data;
            formData.append("data", JSON.stringify(rest));
            if (documents && documents.length > 0) {
                for (let i = 0; i < documents.length; i++) {
                    formData.append("documents", documents[i]);
                }
            }
            const res = await fetch(`/api/franchises/${editingFranchise.id}`, {
                method: "PUT",
                body: formData,
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
            const res = await fetch(`/api/franchises/${id}`, {
                method: "DELETE",
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
        form.reset({
            name: franchise.name,
            ownerName: franchise.ownerName,
            email: franchise.email,
            phone: franchise.phone,
            address: franchise.address,
            legalEntityName: franchise.legalEntityName || "",
            taxId: franchise.taxId || "",
            status: franchise.status as any,
            royaltyPercentage: franchise.royaltyPercentage?.toString() || "0",
            agreementStartDate: franchise.agreementStartDate ? new Date(franchise.agreementStartDate) : undefined,
            agreementEndDate: franchise.agreementEndDate ? new Date(franchise.agreementEndDate) : undefined,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        setFranchiseToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const openCreateDialog = () => {
        setEditingFranchise(null);
        form.reset({
            name: "",
            ownerName: "",
            email: "",
            phone: "",
            address: {},
            legalEntityName: "",
            taxId: "",
            status: "active",
            royaltyPercentage: "0",
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Franchise Management</h1>
                    <p className="text-muted-foreground">
                        Manage your franchises, legal documents, and configurations.
                    </p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" /> Add Franchise
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingFranchise ? "Edit Franchise" : "Add New Franchise"}</DialogTitle>
                        <DialogDescription>
                            {editingFranchise ? "Update franchise details." : "Enter the details for the new franchise."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">
                                    <Building2 className="mr-2 h-4 w-4" /> Basic Info
                                </TabsTrigger>
                                <TabsTrigger value="legal">
                                    <FileText className="mr-2 h-4 w-4" /> Legal & Docs
                                </TabsTrigger>
                                <TabsTrigger value="details">
                                    <Info className="mr-2 h-4 w-4" /> More Details
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Franchise Name</Label>
                                        <Input id="name" {...form.register("name")} placeholder="e.g. FabZClean Downtown" />
                                        {form.formState.errors.name && (
                                            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ownerName">Owner Name</Label>
                                        <Input id="ownerName" {...form.register("ownerName")} placeholder="Full Name" />
                                        {form.formState.errors.ownerName && (
                                            <p className="text-sm text-red-500">{form.formState.errors.ownerName.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" {...form.register("email")} placeholder="owner@example.com" />
                                        {form.formState.errors.email && (
                                            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input id="phone" {...form.register("phone")} placeholder="+1 234 567 890" />
                                        {form.formState.errors.phone && (
                                            <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address (JSON for now)</Label>
                                    <Input
                                        id="address"
                                        placeholder='{"street": "123 Main St", "city": "City"}'
                                        {...form.register("address", {
                                            setValueAs: (v) => {
                                                try { return typeof v === 'string' ? JSON.parse(v) : v } catch (e) { return v }
                                            }
                                        })}
                                        defaultValue={editingFranchise ? JSON.stringify(editingFranchise.address) : ""}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="legal" className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="legalEntityName">Legal Entity Name</Label>
                                        <Input id="legalEntityName" {...form.register("legalEntityName")} placeholder="LLC Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="taxId">Tax ID / GSTIN</Label>
                                        <Input id="taxId" {...form.register("taxId")} placeholder="Tax ID" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="documents">Upload Legal Documents</Label>
                                    <Input
                                        id="documents"
                                        type="file"
                                        multiple
                                        onChange={(e) => {
                                            form.setValue("documents", e.target.files);
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">Upload agreements, licenses, etc.</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="details" className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="agreementStartDate">Agreement Start Date</Label>
                                        <Input id="agreementStartDate" type="date" {...form.register("agreementStartDate", { valueAsDate: true })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="agreementEndDate">Agreement End Date</Label>
                                        <Input id="agreementEndDate" type="date" {...form.register("agreementEndDate", { valueAsDate: true })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="royaltyPercentage">Royalty Percentage (%)</Label>
                                        <Input id="royaltyPercentage" type="number" step="0.01" {...form.register("royaltyPercentage")} />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={createFranchiseMutation.isPending || updateFranchiseMutation.isPending}>
                                {(createFranchiseMutation.isPending || updateFranchiseMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingFranchise ? "Update Franchise" : "Create Franchise"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this franchise? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => franchiseToDelete && deleteFranchiseMutation.mutate(franchiseToDelete)} disabled={deleteFranchiseMutation.isPending}>
                            {deleteFranchiseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle>All Franchises</CardTitle>
                    <CardDescription>A list of all registered franchises.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Franchise ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4">Loading...</TableCell>
                                </TableRow>
                            ) : franchises?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4">No franchises found.</TableCell>
                                </TableRow>
                            ) : (
                                franchises?.map((franchise: any) => (
                                    <TableRow key={franchise.id}>
                                        <TableCell className="font-medium">{franchise.franchiseId}</TableCell>
                                        <TableCell>{franchise.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{franchise.ownerName}</span>
                                                <span className="text-xs text-muted-foreground">{franchise.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{franchise.address?.city || "N/A"}</TableCell>
                                        <TableCell>
                                            <Badge variant={franchise.status === "active" ? "default" : "secondary"}>
                                                {franchise.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(franchise.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(franchise)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(franchise.id)}>
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
