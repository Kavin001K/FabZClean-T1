import React, { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Edit2, Upload, AlertCircle, FileSpreadsheet, Check, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

interface ImportedService {
    id: string; // Temporary ID
    name: string;
    category: string;
    description: string;
    price: string;
    status: 'active' | 'inactive';
    duration: string;
}

interface ServiceImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ServiceImportDialog({ open, onOpenChange }: ServiceImportDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [data, setData] = useState<ImportedService[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ImportedService>>({});

    const handleDownloadTemplate = () => {
        const rows = [
            { name: 'Dry Cleaning - Shirt', category: 'Dry Cleaning', description: 'Professional dry cleaning for dress shirts', price: 15.00, duration: '48 hours', status: 'active' },
            { name: 'Alteration - Hemming', category: 'Alterations', description: 'Standard hemming for trousers', price: 10.00, duration: '24 hours', status: 'active' },
            { name: 'Laundry - Duvet', category: 'Laundry', description: 'Heavy duty washing for duvets', price: 25.00, duration: '72 hours', status: 'active' },
        ];

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Services Template");
        XLSX.writeFile(workbook, "service_import_template.xlsx");
    };

    const processFile = async (file: File) => {
        try {
            setFileName(file.name);
            const text = await file.text();
            let parsedData: ImportedService[] = [];

            if (file.name.endsWith('.json')) {
                const json = JSON.parse(text);
                if (Array.isArray(json)) {
                    parsedData = json.map((item, index) => ({
                        id: `temp-${index}`,
                        name: item.name || '',
                        category: item.category || 'General',
                        description: item.description || '',
                        price: String(item.price || '0'),
                        status: item.status === 'inactive' ? 'inactive' : 'active',
                        duration: item.duration || '24 hrs'
                    }));
                }
            } else if (file.name.endsWith('.csv')) {
                // Simple CSV parser
                const lines = text.split('\n');
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

                parsedData = lines.slice(1).filter(line => line.trim()).map((line, index) => {
                    const values = line.split(',');
                    const item: any = {};
                    headers.forEach((h, i) => {
                        item[h] = values[i]?.trim();
                    });

                    return {
                        id: `temp-${index}`,
                        name: item.name || `Service ${index + 1}`,
                        category: item.category || 'General',
                        description: item.description || '',
                        price: item.price || '0',
                        status: item.status?.includes('inactive') ? 'inactive' : 'active',
                        duration: item.duration || '24 hrs'

                    };
                });
            } else if (file.name.match(/\.xlsx?$/)) {
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet) as any[];

                parsedData = json.map((item, index) => ({
                    id: `temp-${index}`,
                    name: item.name || item.Name || `Service ${index + 1}`,
                    category: item.category || item.Category || 'General',
                    description: item.description || item.Description || '',
                    price: String(item.price || item.Price || '0'),
                    status: (item.status || item.Status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active',
                    duration: item.duration || item.Duration || '24 hrs'
                }));
            }

            if (parsedData.length === 0) {
                toast({
                    title: "Empty or Invalid File",
                    description: "Could not parse any services from the file.",
                    variant: "destructive"
                });
                return;
            }

            setData(parsedData);
            toast({
                title: "File Processed",
                description: `Found ${parsedData.length} services to import. Review them below.`
            });

        } catch (err) {
            console.error(err);
            toast({
                title: "Import Error",
                description: "Failed to process file.",
                variant: "destructive"
            });
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDelete = (id: string) => {
        setData(prev => prev.filter(item => item.id !== id));
    };

    const startEdit = (service: ImportedService) => {
        setEditingId(service.id);
        setEditForm({ ...service });
    };

    const saveEdit = () => {
        if (!editingId) return;
        setData(prev => prev.map(item =>
            item.id === editingId ? { ...item, ...editForm } as ImportedService : item
        ));
        setEditingId(null);
    };

    const importMutation = useMutation({
        mutationFn: async (services: ImportedService[]) => {
            // Use bulk endpoint
            const payload = services.map(service => ({
                name: service.name,
                category: service.category,
                description: service.description,
                price: parseFloat(service.price) || 0,
                status: service.status,
                duration: service.duration
            }));

            return apiRequest('POST', '/services/bulk', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            toast({ title: "Import Successful", description: `Imported ${data.length} services.` });
            onOpenChange(false);
            setData([]);
            setFileName('');
        },
        onError: (err: any) => {
            toast({
                title: "Import Failed",
                description: err.message || "Failed to import services.",
                variant: "destructive"
            });
        }
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Services</DialogTitle>
                    <div className="flex justify-between items-start">
                        <DialogDescription>
                            Upload a Excel, CSV or JSON file to import services in bulk.
                        </DialogDescription>
                        <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2">
                            <FileDown className="h-4 w-4" />
                            Download Template
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
                    {data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                            onClick={() => fileInputRef.current?.click()}>
                            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">Click to upload file</p>
                            <p className="text-sm text-muted-foreground">Supports Excel, CSV and JSON</p>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.json,.xlsx,.xls"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center px-2">
                                <span className="text-sm font-medium">File: {fileName} ({data.length} services)</span>
                                <Button variant="outline" size="sm" onClick={() => setData([])}>Clear</Button>
                            </div>

                            <div className="flex-1 overflow-auto border rounded-md relative">
                                <Table>
                                    <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                                        <TableRow>
                                            <TableHead className="bg-background">Category</TableHead>
                                            <TableHead className="bg-background">Name</TableHead>
                                            <TableHead className="bg-background">Price</TableHead>
                                            <TableHead className="bg-background">Status</TableHead>
                                            <TableHead className="w-[100px] bg-background">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((service) => (
                                            <TableRow key={service.id}>
                                                {editingId === service.id ? (
                                                    <>
                                                        <TableCell><Input value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} /></TableCell>
                                                        <TableCell><Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></TableCell>
                                                        <TableCell><Input value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} /></TableCell>
                                                        <TableCell>
                                                            <select
                                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                                value={editForm.status}
                                                                onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                                                            >
                                                                <option value="active">Active</option>
                                                                <option value="inactive">Inactive</option>
                                                            </select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TableCell>{service.category}</TableCell>
                                                        <TableCell>{service.name}</TableCell>
                                                        <TableCell>₹{service.price}</TableCell>
                                                        <TableCell>
                                                            <span className={`px-2 py-1 rounded-full text-xs ${service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                                {service.status}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-1">
                                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(service)}><Edit2 className="h-4 w-4" /></Button>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleDelete(service.id)}><Trash2 className="h-4 w-4" /></Button>
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        disabled={data.length === 0 || importMutation.isPending}
                        onClick={() => importMutation.mutate(data)}
                        className="flex gap-2"
                    >
                        {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Import {data.length > 0 ? `${data.length} Services` : ''}
                    </Button>
                </DialogFooter>
            </DialogContent >
        </Dialog >
    );
}
