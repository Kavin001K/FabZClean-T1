import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, FileText, Download, Eye } from 'lucide-react';
import { printDriver, InvoiceData } from '@/lib/print-driver';
import { useToast } from '@/hooks/use-toast';
import InvoiceTemplateIN from '@/components/print/invoice-template-in';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate: number;
  hsn: string;
}

export const InvoiceGenerator: React.FC = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    company: {
      name: 'FabZClean Services',
      address: '123 Business Street\nCity, State 12345',
      phone: '+91 9876543210',
      email: 'billing@fabzclean.com',
      taxId: '27ABCDE1234F1Z5',
      logo: '/assets/logo.webp'
    },
    customer: {
      name: '',
      address: '',
      phone: '',
      email: '',
      taxId: ''
    },
    items: [
      {
        description: 'Dry Cleaning - Suit',
        quantity: 1,
        unitPrice: 500,
        total: 500,
        taxRate: 18,
        hsn: '9601'
      }
    ],
    subtotal: 500,
    taxAmount: 90,
    total: 590,
    paymentTerms: 'Net 30 days',
    notes: 'Thank you for your business!',
    qrCode: 'payment-qr-code'
  });

  const [newItem, setNewItem] = useState<InvoiceItem>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    total: 0,
    taxRate: 18,
    hsn: ''
  });

  const { toast } = useToast();

  const calculateTotals = (items: InvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = items.reduce((sum, item) => sum + (item.total * item.taxRate / 100), 0);
    const total = subtotal + taxAmount;
    
    return { subtotal, taxAmount, total };
  };

  const updateItemTotal = (item: InvoiceItem) => {
    item.total = item.quantity * item.unitPrice;
    return item;
  };

  const addItem = () => {
    if (!newItem.description || newItem.unitPrice <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields for the item",
        variant: "destructive"
      });
      return;
    }

    const updatedItem = updateItemTotal(newItem);
    const updatedItems = [...invoiceData.items, updatedItem];
    const totals = calculateTotals(updatedItems);

    setInvoiceData({
      ...invoiceData,
      items: updatedItems,
      ...totals
    });

    setNewItem({
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      taxRate: 18,
      hsn: ''
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = invoiceData.items.filter((_, i) => i !== index);
    const totals = calculateTotals(updatedItems);

    setInvoiceData({
      ...invoiceData,
      items: updatedItems,
      ...totals
    });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoiceData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index] = updateItemTotal(updatedItems[index]);
    }
    
    const totals = calculateTotals(updatedItems);
    
    setInvoiceData({
      ...invoiceData,
      items: updatedItems,
      ...totals
    });
  };

  const generateInvoice = async () => {
    try {
      await printDriver.printProfessionalInvoice(invoiceData);
      toast({
        title: "Success",
        description: "Invoice generated successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive"
      });
    }
  };

  const generateIndianInvoice = async () => {
    try {
      await printDriver.printComponent(<InvoiceTemplateIN data={invoiceData} />, 'indian-invoice.pdf');
      toast({
        title: "Success",
        description: "Indian Invoice generated successfully!"
      });
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to generate Indian invoice",
        variant: "destructive"
      });
    }
  };

  const previewInvoice = () => {
    // In a real app, this would open a preview modal
    toast({
      title: "Preview",
      description: "Invoice preview would open here"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceData.invoiceDate}
                  onChange={(e) => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={invoiceData.dueDate}
                  onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select
                  value={invoiceData.paymentTerms}
                  onValueChange={(value) => setInvoiceData({ ...invoiceData, paymentTerms: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15 days">Net 15 days</SelectItem>
                    <SelectItem value="Net 30 days">Net 30 days</SelectItem>
                    <SelectItem value="Net 45 days">Net 45 days</SelectItem>
                    <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                  placeholder="Additional notes or terms..."
                />
              </div>
.
            </div>
          </div>

          <Separator />

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={invoiceData.customer.name}
                  onChange={(e) => setInvoiceData({
                    ...invoiceData,
                    customer: { ...invoiceData.customer, name: e.target.value }
                  })}
                  placeholder="Enter customer name"
                />
              </div>
              
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={invoiceData.customer.email}
                  onChange={(e) => setInvoiceData({
                    ...invoiceData,
                    customer: { ...invoiceData.customer, email: e.target.value }
                  })}
                  placeholder="customer@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  value={invoiceData.customer.phone}
                  onChange={(e) => setInvoiceData({
                    ...invoiceData,
                    customer: { ...invoiceData.customer, phone: e.target.value }
                  })}
                  placeholder="+91 9876543210"
                />
              </div>
              
              <div>
                <Label htmlFor="customerTaxId">GSTIN (Optional)</Label>
                <Input
                  id="customerTaxId"
                  value={invoiceData.customer.taxId || ''}
                  onChange={(e) => setInvoiceData({
                    ...invoiceData,
                    customer: { ...invoiceData.customer, taxId: e.target.value }
                  })}
                  placeholder="27ABCDE1234F1Z5"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="customerAddress">Address</Label>
                <Textarea
                  id="customerAddress"
                  value={invoiceData.customer.address}
                  onChange={(e) => setInvoiceData({
                    ...invoiceData,
                    customer: { ...invoiceData.customer, address: e.target.value }
                  })}
                  placeholder="Enter customer address"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Invoice Items</h3>
            
            <div className="space-y-4">
              {invoiceData.items.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>HSN/SAC</Label>
                      <Input
                        value={item.hsn}
                        onChange={(e) => updateItem(index, 'hsn', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    
                    <div>
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label>Tax Rate (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.taxRate}
                        onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <Label>Total</Label>
                        <div className="text-lg font-semibold">
                          ₹{item.total.toFixed(2)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Add New Item */}
            <Card className="p-4 border-dashed">
              <h4 className="font-semibold mb-4">Add New Item</h4>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Item description"
                  />
                </div>
                <div>
                  <Label>HSN/SAC</Label>
                  <Input
                    value={newItem.hsn}
                    onChange={(e) => setNewItem({ ...newItem, hsn: e.target.value })}
                    placeholder="e.g. 9601"
                  />
                </div>
                
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                
                <div>
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button onClick={addItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            </Card>.
          </div>

          <Separator />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{invoiceData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>₹{invoiceData.taxAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₹{invoiceData.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={previewInvoice}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={generateInvoice}>
              <Download className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
            <Button onClick={generateIndianInvoice}>
              <Download className="h-4 w-4 mr-2" />
              Generate Indian Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
