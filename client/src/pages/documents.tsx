import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  Filter
} from 'lucide-react';
import { InvoiceGenerator } from '@/components/invoice-generator';
import { ReportGenerator } from '@/components/report-generator';
import { Input } from '@/components/ui/input';

interface Document {
  id: string;
  type: 'invoice' | 'report' | 'receipt' | 'label';
  title: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  amount?: number;
  createdAt: string;
  customer?: string;
  description: string;
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock documents data
  const documents: Document[] = [
    {
      id: '1',
      type: 'invoice',
      title: 'Invoice #INV-001',
      status: 'sent',
      amount: 1500,
      createdAt: '2024-01-15',
      customer: 'John Doe',
      description: 'Cleaning services for residential property'
    },
    {
      id: '2',
      type: 'report',
      title: 'Monthly Sales Report',
      status: 'draft',
      createdAt: '2024-01-14',
      description: 'January 2024 performance analysis'
    },
    {
      id: '3',
      type: 'invoice',
      title: 'Invoice #INV-002',
      status: 'paid',
      amount: 850,
      createdAt: '2024-01-10',
      customer: 'Jane Smith',
      description: 'Office cleaning services'
    },
    {
      id: '4',
      type: 'receipt',
      title: 'Receipt #RCP-001',
      status: 'sent',
      amount: 200,
      createdAt: '2024-01-12',
      customer: 'Bob Johnson',
      description: 'One-time cleaning service'
    },
    {
      id: '5',
      type: 'report',
      title: 'Customer Analytics Report',
      status: 'draft',
      createdAt: '2024-01-13',
      description: 'Customer behavior and preferences analysis'
    }
  ];

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.customer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'sent': return 'bg-blue-500';
      case 'paid': return 'bg-green-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'invoice': return <FileText className="h-4 w-4" />;
      case 'report': return <BarChart3 className="h-4 w-4" />;
      case 'receipt': return <Receipt className="h-4 w-4" />;
      case 'label': return <FileSpreadsheet className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'invoice': return 'text-blue-600';
      case 'report': return 'text-green-600';
      case 'receipt': return 'text-purple-600';
      case 'label': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const stats = {
    totalDocuments: documents.length,
    totalInvoices: documents.filter(d => d.type === 'invoice').length,
    totalReports: documents.filter(d => d.type === 'report').length,
    totalAmount: documents.reduce((sum, d) => sum + (d.amount || 0), 0),
    pendingInvoices: documents.filter(d => d.type === 'invoice' && d.status === 'sent').length,
    overdueInvoices: documents.filter(d => d.type === 'invoice' && d.status === 'overdue').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
          <p className="text-muted-foreground">Generate, manage, and track all your business documents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="generator">Generators</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Documents</span>
                </div>
                <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Total Amount</span>
                </div>
                <div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Pending Invoices</span>
                </div>
                <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Reports</span>
                </div>
                <div className="text-2xl font-bold">{stats.totalReports}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Documents</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getTypeColor(doc.type)} bg-gray-100`}>
                        {getTypeIcon(doc.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{doc.title}</h3>
                          <Badge className={`${getStatusColor(doc.status)} text-white`}>
                            {doc.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{doc.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {doc.createdAt}
                          </span>
                          {doc.customer && (
                            <span>Customer: {doc.customer}</span>
                          )}
                          {doc.amount && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ₹{doc.amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.filter(d => d.type === 'invoice').map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg text-blue-600 bg-blue-100">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{invoice.title}</h3>
                          <Badge className={`${getStatusColor(invoice.status)} text-white`}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{invoice.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span>Customer: {invoice.customer}</span>
                          <span>Amount: ₹{invoice.amount?.toLocaleString()}</span>
                          <span>Date: {invoice.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">View</Button>
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Send</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.filter(d => d.type === 'report').map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg text-green-600 bg-green-100">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{report.title}</h3>
                          <Badge className={`${getStatusColor(report.status)} text-white`}>
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{report.description}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          Generated on: {report.createdAt}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">View</Button>
                      <Button variant="outline" size="sm">Download</Button>
                      <Button variant="outline" size="sm">Share</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generator" className="space-y-6">
          <Tabs defaultValue="invoice" className="space-y-4">
            <TabsList>
              <TabsTrigger value="invoice">Invoice Generator</TabsTrigger>
              <TabsTrigger value="report">Report Generator</TabsTrigger>
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
