import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Download,
  Eye,
  Plus,
  Calendar,
  DollarSign,
  BarChart3,
  Receipt,
  FileSpreadsheet,
  Archive,
  Search,
  Filter,
  Loader2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  History,
  Info
} from 'lucide-react';
import { InvoiceGenerator } from '@/components/invoice-generator';
import { ReportGenerator } from '@/components/report-generator';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { documentsApi, formatDate, formatCurrency } from '@/lib/data-service';

interface Document {
  id: string;
  type: 'invoice' | 'report' | 'receipt' | 'label' | 'legal_agreement' | 'tax_compliance' | 'kyc_proof' | 'operational_license' | 'insurance';
  category?: 'legal' | 'tax' | 'kyc' | 'license' | 'insurance' | 'operational';
  title: string;
  filename: string;
  filepath: string;
  fileUrl: string;
  status: string;
  versionNumber: number;
  expiryDate?: string;
  isVerified: boolean;
  verificationStatus: 'unverified' | 'verified' | 'rejected';
  rejectionReason?: string;
  amount?: string | null;
  customerName?: string | null;
  orderNumber?: string | null;
  createdAt: string;
  metadata?: any;
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('vault');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents from API
  const { data: documents = [], isLoading, error, refetch } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: documentsApi.getAll,
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'verified' | 'rejected' }) =>
      documentsApi.verify(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: "Updated", description: "Verification status updated." });
    }
  });

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (doc: Document) => {
    if (doc.verificationStatus === 'verified') {
      return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>;
    }
    if (doc.verificationStatus === 'rejected') {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Rejected</Badge>;
    }
    return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
  };

  const getExpiryBadge = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) return <Badge variant="destructive" className="ml-2 animate-pulse">Expired</Badge>;
    if (diffDays < 30) return <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600 bg-amber-50">Expires in {diffDays}d</Badge>;
    return null;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'legal_agreement': return <ShieldCheck className="h-4 w-4" />;
      case 'tax_compliance': return <FileSpreadsheet className="h-4 w-4" />;
      case 'kyc_proof': return <FileText className="h-4 w-4" />;
      case 'operational_license': return <ExternalLink className="h-4 w-4" />;
      case 'insurance': return <ShieldCheck className="h-4 w-4" />;
      case 'invoice': return <Receipt className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const stats = {
    total: documents.length,
    verified: documents.filter(d => d.verificationStatus === 'verified').length,
    expiringSoon: documents.filter(d => {
      if (!d.expiryDate) return false;
      const days = Math.ceil((new Date(d.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return days > 0 && days < 30;
    }).length,
    complianceScore: documents.length > 0 ? Math.round((documents.filter(d => d.verificationStatus === 'verified').length / documents.length) * 100) : 0
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-2xl text-white shadow-xl shadow-slate-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Digital Vault & Compliance Center</h1>
          <p className="text-slate-300 mt-1">Manage legal agreements, tax filings, and operational licenses securely.</p>
          <div className="mt-6 flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-slate-400 text-sm">Overall Compliance</span>
              <div className="flex items-center gap-3 mt-1">
                <Progress value={stats.complianceScore} className="w-32 h-2 bg-slate-700" />
                <span className="font-bold">{stats.complianceScore}%</span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-700"></div>
            <div className="flex flex-col">
              <span className="text-slate-400 text-sm">Verified Docs</span>
              <span className="text-2xl font-bold mt-1 text-emerald-400">{stats.verified}/{stats.total}</span>
            </div>
            {stats.expiringSoon > 0 && (
              <>
                <div className="h-10 w-px bg-slate-700"></div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-sm">Action Required</span>
                  <span className="text-2xl font-bold mt-1 text-amber-400">{stats.expiringSoon} Expiring</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-900/40">
            <Plus className="h-4 w-4 mr-2" />
            Secure Upload
          </Button>
          <Button variant="outline" className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700">
            <ShieldCheck className="h-4 w-4 mr-2 text-emerald-400" />
            Compliance Check
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="vault" className="rounded-lg px-6">Document Vault</TabsTrigger>
          <TabsTrigger value="compliance" className="rounded-lg px-6">Compliance Tasks</TabsTrigger>
          <TabsTrigger value="generator" className="rounded-lg px-6">Generators</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg px-6">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="vault" className="space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vault Content</CardTitle>
                <CardDescription>Search and filter your verified business documents.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-80 bg-slate-50 border-slate-200"
                  />
                </div>
                <Button variant="outline" size="icon" className="bg-slate-50">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="group relative p-4 border rounded-xl hover:border-blue-400 transition-all bg-white shadow-sm hover:shadow-md">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-3 bg-slate-100 rounded-lg text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        {getTypeIcon(doc.type)}
                      </div>
                      {getStatusBadge(doc)}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-lg truncate pr-8" title={doc.title}>{doc.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="uppercase font-medium tracking-wider">{doc.category || 'General'}</span>
                        <span>•</span>
                        <span>v{doc.versionNumber}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(doc.createdAt)}
                      </div>
                      {doc.expiryDate && (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Exp: {formatDate(doc.expiryDate)}
                          {getExpiryBadge(doc.expiryDate)}
                        </div>
                      )}
                    </div>

                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm" onClick={() => window.open(doc.fileUrl, '_blank')}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="secondary" className="w-full text-xs h-9 bg-slate-50 hover:bg-slate-100" onClick={() => window.open(doc.fileUrl, '_blank')}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                      <Button variant="outline" className="w-full text-xs h-9" onClick={() => documentsApi.requestUpdate(doc.id)}>
                        <History className="w-4 h-4 mr-2" /> History
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Needs Verification</CardTitle>
                <CardDescription>Administrative review required for these documents.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.filter(d => d.verificationStatus === 'unverified').map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg border shadow-sm">
                          <FileText className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{doc.title}</p>
                          <p className="text-xs text-slate-500 uppercase tracking-tighter font-semibold">Uploaded by Franchise Store #204 • {formatDate(doc.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.open(doc.fileUrl, '_blank')}>Review</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 h-8" size="sm" onClick={() => verifyMutation.mutate({ id: doc.id, status: 'verified' })}>Approve</Button>
                        <Button variant="destructive" className="h-8" size="sm" onClick={() => verifyMutation.mutate({ id: doc.id, status: 'rejected' })}>Reject</Button>
                      </div>
                    </div>
                  ))}
                  {documents.filter(d => d.verificationStatus === 'unverified').length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>All compliance documents have been reviewed.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50/50 border-orange-100">
              <CardHeader>
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  <CardTitle className="text-lg">Compliance Alerts</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                  <div className="mt-1"><Info className="w-4 h-4 text-orange-600" /></div>
                  <div>
                    <p className="text-sm font-bold text-orange-900 leading-tight">GST Filing Incomplete</p>
                    <p className="text-xs text-orange-700 mt-1">GSTR-1 for Feb 2025 is missing a verified signature.</p>
                  </div>
                </div>
                {documents.filter(d => {
                  if (!d.expiryDate) return false;
                  return new Date(d.expiryDate) < new Date();
                }).map(doc => (
                  <div key={doc.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="mt-1"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
                    <div>
                      <p className="text-sm font-bold text-red-900 leading-tight">{doc.title} Expired</p>
                      <p className="text-xs text-red-700 mt-1">This document expired on {formatDate(doc.expiryDate)}. Operations may be affected.</p>
                      <Button variant="link" className="p-0 h-auto text-xs text-red-800 font-bold mt-2">Request Renewal</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="generator">
          <Tabs defaultValue="invoice" className="space-y-4">
            <TabsList>
              <TabsTrigger value="invoice" className="h-8 text-xs">Invoice Generator</TabsTrigger>
              <TabsTrigger value="report" className="h-8 text-xs">Compliance Report</TabsTrigger>
            </TabsList>
            <TabsContent value="invoice">
              <InvoiceGenerator />
            </TabsContent>
            <TabsContent value="report">
              <ReportGenerator />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
