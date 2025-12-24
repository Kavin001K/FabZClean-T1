import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Printer, Settings, Eye, Download } from 'lucide-react';
import { useInvoicePrint } from '@/hooks/use-invoice-print';
import type { Order } from '@shared/schema';
import type { PrintTemplate } from '@/lib/print-driver';

interface PrintSettingsProps {
  order: Order;
  onClose?: () => void;
}

export default function PrintSettings({ order, onClose }: PrintSettingsProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('invoice');
  const [autoPrint, setAutoPrint] = useState(true);
  const [includePreview, setIncludePreview] = useState(false);
  
  const { 
    printInvoice, 
    previewInvoice, 
    getAvailableTemplates, 
    convertOrderToInvoiceData 
  } = useInvoicePrint();

  const templates = getAvailableTemplates();

  const handlePrint = async () => {
    try {
      await printInvoice(order, selectedTemplate);
      onClose?.();
    } catch (error) {
      console.error('Print failed:', error);
    }
  };

  const handlePreview = async () => {
    try {
      const invoiceData = await previewInvoice(order, selectedTemplate);
      // Here you could open a preview modal or navigate to a preview page
      console.log('Preview data:', invoiceData);
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  const handleDownload = async () => {
    try {
      // This would trigger a download instead of printing
      const invoiceData = convertOrderToInvoiceData(order);
      console.log('Download invoice:', invoiceData);
      // You could implement a download function here
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Print Settings
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-2">
          <Label htmlFor="template">Invoice Template</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Print Options */}
        <div className="space-y-4">
          <h4 className="font-medium">Print Options</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-print" className="text-sm">
              Auto Print
            </Label>
            <Switch
              id="auto-print"
              checked={autoPrint}
              onCheckedChange={setAutoPrint}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="preview" className="text-sm">
              Show Preview
            </Label>
            <Switch
              id="preview"
              checked={includePreview}
              onCheckedChange={setIncludePreview}
            />
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handlePrint} 
            className="w-full"
            size="sm"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={handlePreview}
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleDownload}
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Order Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Order: {order.orderNumber}</p>
          <p>Customer: {order.customerName}</p>
          <p>Total: {order.totalAmount}</p>
        </div>
      </CardContent>
    </Card>
  );
}
