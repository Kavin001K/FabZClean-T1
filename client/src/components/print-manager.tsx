import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Printer, 
  Settings, 
  FileText, 
  QrCode, 
  Package, 
  Receipt, 
  Download,
  Eye,
  Trash2,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  printDriver, 
  BarcodePrintData, 
  LabelPrintData, 
  InvoicePrintData,
  PrintTemplate 
} from '@/lib/print-driver';
import PrintSettingsComponent from './print-settings';

interface PrintJob {
  id: string;
  type: 'barcode' | 'label' | 'invoice' | 'receipt';
  data: any;
  templateId: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  createdAt: string;
}

interface PrintManagerProps {
  className?: string;
}

export default function PrintManager({ className }: PrintManagerProps) {
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('barcode-label');
  const [showSettings, setShowSettings] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const { toast } = useToast();

  const templates = printDriver.getTemplates();

  const addPrintJob = (type: PrintJob['type'], data: any, templateId: string) => {
    const job: PrintJob = {
      id: `job-${Date.now()}`,
      type,
      data,
      templateId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    setPrintJobs(prev => [...prev, job]);
    toast({
      title: "Print Job Added",
      description: `${type} print job has been added to the queue`,
    });
  };

  const removePrintJob = (jobId: string) => {
    setPrintJobs(prev => prev.filter(job => job.id !== jobId));
    toast({
      title: "Print Job Removed",
      description: "Print job has been removed from the queue",
    });
  };

  const updateJobStatus = (jobId: string, status: PrintJob['status']) => {
    setPrintJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status } : job
    ));
  };

  const printJob = async (job: PrintJob) => {
    try {
      updateJobStatus(job.id, 'printing');
      setIsPrinting(true);

      switch (job.type) {
        case 'barcode':
          await printDriver.printBarcode(job.data, job.templateId);
          break;
        case 'label':
          await printDriver.printLabel(job.data, job.templateId);
          break;
        case 'invoice':
          await printDriver.printInvoice(job.data, job.templateId);
          break;
        case 'receipt':
          await printDriver.printReceipt(job.data, job.templateId);
          break;
        default:
          throw new Error(`Unknown print type: ${job.type}`);
      }

      updateJobStatus(job.id, 'completed');
      toast({
        title: "Print Successful",
        description: `${job.type} has been printed successfully`,
      });
    } catch (error) {
      updateJobStatus(job.id, 'failed');
      toast({
        title: "Print Failed",
        description: `Failed to print ${job.type}: ${error}`,
        variant: "destructive"
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const printAllJobs = async () => {
    const pendingJobs = printJobs.filter(job => job.status === 'pending');
    
    for (const job of pendingJobs) {
      await printJob(job);
    }
  };

  const clearCompletedJobs = () => {
    setPrintJobs(prev => prev.filter(job => job.status !== 'completed'));
    toast({
      title: "Queue Cleared",
      description: "Completed print jobs have been removed",
    });
  };

  const getStatusColor = (status: PrintJob['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'printing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: PrintJob['type']) => {
    switch (type) {
      case 'barcode': return <QrCode className="h-4 w-4" />;
      case 'label': return <Package className="h-4 w-4" />;
      case 'invoice': return <FileText className="h-4 w-4" />;
      case 'receipt': return <Receipt className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Manager
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              size="sm"
              onClick={printAllJobs}
              disabled={isPrinting || printJobs.filter(job => job.status === 'pending').length === 0}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print All ({printJobs.filter(job => job.status === 'pending').length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Settings Panel */}
        {showSettings && (
          <div className="space-y-4">
            <Separator />
            <PrintSettingsComponent />
            <Separator />
          </div>
        )}

        {/* Quick Print Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Print</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Add sample barcode job
                    const sampleBarcode: BarcodePrintData = {
                      code: 'SAMPLE-12345',
                      type: 'qr',
                      entityType: 'order',
                      entityId: 'sample-order-123',
                      entityData: { customer: 'Sample Customer', amount: '$99.99' },
                      imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
                    };
                    addPrintJob('barcode', sampleBarcode, selectedTemplate);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sample
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompletedJobs}
                  disabled={printJobs.filter(job => job.status === 'completed').length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Print Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Print Queue</h3>
            <Badge variant="outline">
              {printJobs.length} jobs
            </Badge>
          </div>

          {printJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No print jobs in queue</p>
              <p className="text-sm">Add items to start printing</p>
            </div>
          ) : (
            <div className="space-y-2">
              {printJobs.map(job => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(job.type)}
                    <div>
                      <p className="font-medium capitalize">{job.type}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(job.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    
                    {job.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => printJob(job)}
                        disabled={isPrinting}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePrintJob(job.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Print Statistics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Statistics</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {printJobs.filter(job => job.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {printJobs.filter(job => job.status === 'printing').length}
              </p>
              <p className="text-sm text-gray-500">Printing</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {printJobs.filter(job => job.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {printJobs.filter(job => job.status === 'failed').length}
              </p>
              <p className="text-sm text-gray-500">Failed</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
