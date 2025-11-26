import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';

export interface PrintSettings {
  pageSize: 'A4' | 'A5' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
}

export interface PrintTemplate {
  id: string;
  name: string;
  description: string;
  category: 'barcode' | 'label' | 'invoice' | 'receipt' | 'report';
  settings: PrintSettings;
  layout: {
    header?: boolean;
    footer?: boolean;
    logo?: boolean;
    companyInfo?: boolean;
    barcode?: boolean;
    qrCode?: boolean;
    table?: boolean;
    signature?: boolean;
  };
}

export interface PrintData {
  templateId: string;
  data: Record<string, any>;
  metadata?: {
    printDate: string;
    printedBy: string;
    documentType: string;
    documentId: string;
  };
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId: string;
    logo?: string;
  };
  customer: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxRate?: number;
  }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentTerms: string;
  notes?: string;
  qrCode?: string;
}

export interface ReportData {
  title: string;
  subtitle?: string;
  reportDate: string;
  generatedBy: string;
  company: {
    name: string;
    address: string;
    logo?: string;
  };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    averageOrderValue: number;
    topServices: Array<{
      name: string;
      count: number;
      revenue: number;
    }>;
  };
  charts?: Array<{
    type: 'line' | 'bar' | 'pie';
    title: string;
    data: any;
  }>;
  tables?: Array<{
    title: string;
    headers: string[];
    rows: string[][];
  }>;
  footer?: string;
}

export interface BarcodePrintData {
  code: string;
  type: 'qr' | 'barcode' | 'ean13' | 'code128';
  entityType: string;
  entityId: string;
  entityData: Record<string, any>;
  imageData: string;
  imagePath?: string;
}

export interface LabelPrintData {
  title: string;
  subtitle?: string;
  barcode?: BarcodePrintData;
  qrCode?: BarcodePrintData;
  details: Array<{
    label: string;
    value: string;
  }>;
  footer?: string;
}

export interface InvoicePrintData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  orderNumber?: string;
  customerInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    taxId?: string;
  };
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxRate?: number;
  }>;
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  paymentMethod?: string;
  paymentStatus?: string;
  notes?: string;
  terms?: string;
  status?: string;
}

// Utility function to convert Order data to InvoicePrintData
export function convertOrderToInvoiceData(order: any): InvoicePrintData {
  // Default company information - you should update this with your actual company details
  const companyInfo = {
    name: "FabZClean",
    address: "123 Business Street, City, State 12345\nIndia",
    phone: "+1 (555) 123-4567",
    email: "info@fabzclean.com",
    website: "www.fabzclean.com",
    taxId: "29ABCDE1234F1Z5" // Example GSTIN format
  };

  // Parse customer address
  let customerAddress = 'Address not provided';
  if (order.shippingAddress) {
    if (typeof order.shippingAddress === 'string') {
      customerAddress = order.shippingAddress;
    } else if (typeof order.shippingAddress === 'object') {
      // Handle address object
      const addr = order.shippingAddress;
      const parts = [
        addr.street || addr.line1,
        addr.line2,
        addr.city,
        addr.state,
        addr.postalCode || addr.zipCode,
        addr.country
      ].filter(Boolean);
      customerAddress = parts.join(', ');
    }
  } else if (order.address) {
    customerAddress = typeof order.address === 'string' ? order.address : JSON.stringify(order.address);
  }

  // Parse order items
  let items: InvoicePrintData['items'] = [];
  if (order.items && Array.isArray(order.items)) {
    items = order.items.map((item: any) => {
      const quantity = parseInt(String(item.quantity)) || 1;
      const unitPrice = parseFloat(String(item.unitPrice || item.price || 0));
      const total = item.total ? parseFloat(String(item.total)) : (quantity * unitPrice);

      return {
        name: item.name || item.serviceName || item.description || 'Service Item',
        description: item.description || item.details,
        quantity,
        unitPrice,
        total,
        taxRate: parseFloat(String(item.taxRate)) || 0.18 // Default 18% GST
      };
    });
  } else {
    // Fallback for orders without structured items
    const totalAmount = parseFloat(String(order.totalAmount)) || 0;
    const serviceName = order.serviceName || order.service || 'Dry Cleaning Service';

    items = [{
      name: serviceName,
      description: `Order ${order.orderNumber || order.id}`,
      quantity: 1,
      unitPrice: totalAmount / 1.18, // Assuming 18% tax included
      total: totalAmount / 1.18,
      taxRate: 0.18
    }];
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = items.reduce((sum, item) => sum + (item.total * (item.taxRate || 0.18)), 0);
  const total = subtotal + tax;

  return {
    invoiceNumber: `INV-${order.orderNumber || order.id}`,
    invoiceDate: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    orderNumber: order.orderNumber || order.id,
    customerInfo: {
      name: order.customerName || order.customer?.name || 'Customer',
      address: customerAddress,
      phone: order.customerPhone || order.customer?.phone || order.phone || 'N/A',
      email: order.customerEmail || order.customer?.email || order.email || 'N/A'
    },
    companyInfo,
    items,
    subtotal,
    tax,
    total,
    paymentMethod: order.paymentMethod || 'Cash',
    paymentStatus: order.paymentStatus || order.status || 'Pending',
    notes: order.notes || order.specialInstructions || `Order Status: ${order.status}`,
    terms: 'Payment due within 30 days of invoice date. Interest @ 18% p.a. will be charged on delayed payments.',
    status: order.status
  };
}

export class PrintDriver {
  private static instance: PrintDriver;
  private templates: Map<string, PrintTemplate> = new Map();
  private defaultSettings: PrintSettings;

  private constructor() {
    this.defaultSettings = {
      pageSize: 'A4',
      orientation: 'portrait',
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      fontSize: 12,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: '#FFFFFF'
    };
    this.initializeTemplates();
  }

  public static getInstance(): PrintDriver {
    if (!PrintDriver.instance) {
      PrintDriver.instance = new PrintDriver();
    }
    return PrintDriver.instance;
  }

  private initializeTemplates(): void {
    // Barcode Label Template
    this.templates.set('barcode-label', {
      id: 'barcode-label',
      name: 'Barcode Label',
      description: 'Standard barcode label for products and orders',
      category: 'barcode',
      settings: {
        pageSize: 'A4',
        orientation: 'portrait',
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        fontSize: 10,
        fontFamily: 'Arial',
        color: '#000000',
        backgroundColor: '#FFFFFF'
      },
      layout: {
        header: true,
        footer: true,
        logo: true,
        companyInfo: true,
        barcode: true,
        qrCode: true
      }
    });

    // Shipping Label Template
    this.templates.set('shipping-label', {
      id: 'shipping-label',
      name: 'Shipping Label',
      description: 'Shipping label with tracking information',
      category: 'label',
      settings: {
        pageSize: 'A4',
        orientation: 'landscape',
        margin: { top: 15, right: 15, bottom: 15, left: 15 },
        fontSize: 11,
        fontFamily: 'Arial',
        color: '#000000',
        backgroundColor: '#FFFFFF'
      },
      layout: {
        header: true,
        footer: true,
        logo: true,
        companyInfo: true,
        barcode: true,
        qrCode: true,
        table: true
      }
    });

    // Invoice Template
    this.templates.set('invoice', {
      id: 'invoice',
      name: 'Professional Invoice',
      description: 'Professional invoice template with company branding',
      category: 'invoice',
      settings: {
        pageSize: 'A4',
        orientation: 'portrait',
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
        fontSize: 10,
        fontFamily: 'helvetica',
        color: '#000000',
        backgroundColor: '#FFFFFF'
      },
      layout: {
        header: true,
        footer: true,
        logo: true,
        companyInfo: true,
        table: true,
        signature: true
      }
    });

    // Modern Invoice Template
    this.templates.set('modern-invoice', {
      id: 'modern-invoice',
      name: 'Modern Invoice',
      description: 'Modern invoice template with clean design',
      category: 'invoice',
      settings: {
        pageSize: 'A4',
        orientation: 'portrait',
        margin: { top: 15, right: 15, bottom: 15, left: 15 },
        fontSize: 9,
        fontFamily: 'helvetica',
        color: '#2C3E50',
        backgroundColor: '#FFFFFF'
      },
      layout: {
        header: true,
        footer: true,
        logo: true,
        companyInfo: true,
        table: true,
        signature: true
      }
    });

    // Receipt Template
    this.templates.set('receipt', {
      id: 'receipt',
      name: 'Receipt',
      description: 'Point of sale receipt',
      category: 'receipt',
      settings: {
        pageSize: 'A5',
        orientation: 'portrait',
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        fontSize: 10,
        fontFamily: 'Courier',
        color: '#000000',
        backgroundColor: '#FFFFFF'
      },
      layout: {
        header: true,
        footer: true,
        logo: true,
        companyInfo: true,
        table: true
      }
    });

    // Report Template
    this.templates.set('report', {
      id: 'report',
      name: 'Report',
      description: 'General report template',
      category: 'report',
      settings: {
        pageSize: 'A4',
        orientation: 'portrait',
        margin: { top: 30, right: 30, bottom: 30, left: 30 },
        fontSize: 12,
        fontFamily: 'Arial',
        color: '#000000',
        backgroundColor: '#FFFFFF'
      },
      layout: {
        header: true,
        footer: true,
        logo: true,
        companyInfo: true,
        table: true
      }
    });
  }

  public getTemplates(): PrintTemplate[] {
    return Array.from(this.templates.values());
  }

  public getTemplate(id: string): PrintTemplate | undefined {
    return this.templates.get(id);
  }

  public updateTemplateSettings(templateId: string, settings: PrintSettings): void {
    const template = this.templates.get(templateId);
    if (template) {
      template.settings = { ...template.settings, ...settings };
      this.templates.set(templateId, template);
    }
  }

  public updateTemplateLayout(templateId: string, layout: Partial<PrintTemplate['layout']>): void {
    const template = this.templates.get(templateId);
    if (template) {
      template.layout = { ...template.layout, ...layout };
      this.templates.set(templateId, template);
    }
  }

  public getDefaultSettings(): PrintSettings {
    return { ...this.defaultSettings };
  }

  public updateDefaultSettings(settings: Partial<PrintSettings>): void {
    this.defaultSettings = { ...this.defaultSettings, ...settings };
  }

  public async printBarcode(data: BarcodePrintData, templateId: string = 'barcode-label'): Promise<void> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const doc = new jsPDF({
      orientation: template.settings.orientation,
      unit: 'mm',
      format: template.settings.pageSize
    });

    // Set font
    doc.setFont(template.settings.fontFamily);
    doc.setFontSize(template.settings.fontSize);
    doc.setTextColor(template.settings.color);

    // Add header
    if (template.layout.header) {
      this.addHeader(doc, template, data);
    }

    // Add company info
    if (template.layout.companyInfo) {
      this.addCompanyInfo(doc, template, data);
    }

    // Add barcode/QR code
    if (template.layout.barcode || template.layout.qrCode) {
      await this.addBarcode(doc, template, data);
    }

    // Add entity details
    this.addEntityDetails(doc, template, data);

    // Add footer
    if (template.layout.footer) {
      this.addFooter(doc, template, data);
    }

    // Print or save
    doc.autoPrint();
    doc.save(`${data.entityType}-${data.entityId}-barcode.pdf`);
  }

  public async printLabel(data: LabelPrintData, templateId: string = 'shipping-label'): Promise<void> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const doc = new jsPDF({
      orientation: template.settings.orientation,
      unit: 'mm',
      format: template.settings.pageSize
    });

    // Set font
    doc.setFont(template.settings.fontFamily);
    doc.setFontSize(template.settings.fontSize);
    doc.setTextColor(template.settings.color);

    // Add header
    if (template.layout.header) {
      this.addHeader(doc, template, data);
    }

    // Add title
    doc.setFontSize(template.settings.fontSize + 4);
    doc.setFont(undefined, 'bold');
    doc.text(data.title, template.settings.margin.left, template.settings.margin.top + 20);

    if (data.subtitle) {
      doc.setFontSize(template.settings.fontSize);
      doc.setFont(undefined, 'normal');
      doc.text(data.subtitle, template.settings.margin.left, template.settings.margin.top + 30);
    }

    // Add barcode/QR code if present
    if (data.barcode && template.layout.barcode) {
      await this.addBarcode(doc, template, data.barcode);
    }

    if (data.qrCode && template.layout.qrCode) {
      await this.addBarcode(doc, template, data.qrCode);
    }

    // Add details
    this.addLabelDetails(doc, template, data);

    // Add footer
    if (template.layout.footer) {
      this.addFooter(doc, template, data);
    }

    // Print or save
    doc.autoPrint();
    doc.save(`${data.title ? data.title.toLowerCase().replace(/\s+/g, '-') : 'document'}-label.pdf`);
  }

  public async printInvoice(data: InvoicePrintData, templateId: string = 'invoice'): Promise<void> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    try {
      // Import the InvoiceTemplateIN component dynamically
      const { default: InvoiceTemplateIN } = await import('../components/print/invoice-template-in');
      const React = await import('react');

      // Convert InvoicePrintData to InvoiceData format expected by the template
      const invoiceData = {
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        company: {
          name: data.companyInfo.name,
          address: data.companyInfo.address,
          phone: data.companyInfo.phone,
          email: data.companyInfo.email,
          taxId: data.companyInfo.taxId || 'GSTIN-NOT-PROVIDED',
          logo: undefined
        },
        customer: {
          name: data.customerInfo.name,
          address: data.customerInfo.address,
          phone: data.customerInfo.phone,
          email: data.customerInfo.email,
          taxId: undefined
        },
        items: data.items.map(item => ({
          description: item.description || item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          taxRate: item.taxRate || 18,
          hsn: '998314' // Default HSN for dry cleaning services
        })),
        subtotal: data.subtotal,
        taxAmount: data.tax,
        total: data.total,
        paymentTerms: data.terms || 'Payment due within 30 days',
        notes: data.notes,
        status: data.status
      };

      // Create a temporary container for rendering
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm'; // A4 width
      container.style.background = 'white';
      document.body.appendChild(container);

      // Render the React component
      const root = createRoot(container);
      await new Promise<void>((resolve) => {
        root.render(React.createElement(InvoiceTemplateIN, { data: invoiceData }));
        // Wait for rendering and any images to load
        setTimeout(resolve, 1000);
      });

      // Convert to PDF using html2canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794, // A4 width in pixels at 96 DPI
        windowHeight: 1123 // A4 height in pixels at 96 DPI
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Cleanup
      root.unmount();
      document.body.removeChild(container);

      // Get PDF as blob for upload
      const pdfBlob = pdf.output('blob');
      const filename = `invoice-${data.invoiceNumber}-${Date.now()}.pdf`;

      // Save to server
      await this.savePDFToServer(pdfBlob, filename, {
        type: 'invoice',
        invoiceNumber: data.invoiceNumber,
        orderNumber: data.orderNumber,
        customerName: data.customerInfo.name,
        amount: data.total,
        status: data.paymentStatus || 'pending',
        metadata: {
          invoiceDate: data.invoiceDate,
          dueDate: data.dueDate,
          items: data.items.length,
          subtotal: data.subtotal,
          tax: data.tax,
          total: data.total
        }
      });

      // Also trigger download for user
      pdf.save(filename);

      console.log(`Invoice ${data.invoiceNumber} saved to server successfully`);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw new Error('Failed to generate invoice PDF');
    }
  }

  private async savePDFToServer(
    pdfBlob: Blob,
    filename: string,
    metadata: {
      type: string;
      invoiceNumber?: string;
      orderNumber?: string;
      customerName?: string;
      amount?: number;
      status?: string;
      metadata?: any;
    }
  ): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', pdfBlob, filename);
      formData.append('type', metadata.type);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload PDF: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('PDF uploaded successfully:', result);
    } catch (error) {
      console.error('Error uploading PDF to server:', error);
      // Don't throw - we still want the download to work even if upload fails
    }
  }

  public async printReceipt(data: InvoicePrintData, templateId: string = 'receipt'): Promise<void> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const doc = new jsPDF({
      orientation: template.settings.orientation,
      unit: 'mm',
      format: template.settings.pageSize
    });

    // Set font
    doc.setFont(template.settings.fontFamily);
    doc.setFontSize(template.settings.fontSize);
    doc.setTextColor(template.settings.color);

    // Add header
    if (template.layout.header) {
      this.addHeader(doc, template, data);
    }

    // Add company info
    if (template.layout.companyInfo) {
      this.addCompanyInfo(doc, template, data);
    }

    // Add receipt details
    this.addReceiptDetails(doc, template, data);

    // Add items
    this.addReceiptItems(doc, template, data);

    // Add totals
    this.addReceiptTotals(doc, template, data);

    // Add footer
    if (template.layout.footer) {
      this.addFooter(doc, template, data);
    }

    // Print or save
    doc.autoPrint();
    doc.save(`receipt-${data.invoiceNumber}.pdf`);
  }

  public async printFromElement(element: HTMLElement, filename: string = 'document.pdf'): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.autoPrint();
      pdf.save(filename);
    } catch (error) {
      console.error('Error printing from element:', error);
      throw new Error('Failed to print document');
    }
  }

  public async printComponent(component: React.ReactElement, filename: string = 'document.pdf'): Promise<void> {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const root = createRoot(container);
    await new Promise<void>((resolve) => {
      root.render(component);
      setTimeout(resolve, 500); // Wait for rendering
    });

    await this.printFromElement(container, filename);

    root.unmount();
    document.body.removeChild(container);
  }

  private addHeader(doc: jsPDF, template: PrintTemplate, data: any): void {
    const { margin } = template.settings;

    // Add logo placeholder
    if (template.layout.logo) {
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('FabZClean', margin.left, margin.top + 10);
    }

    // Add document type
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Document: ${data.invoiceNumber || data.title || 'Barcode'}`,
      doc.internal.pageSize.width - margin.right - 50, margin.top + 10);
  }

  private addCompanyInfo(doc: jsPDF, template: PrintTemplate, data?: any): void {
    const { margin } = template.settings;

    // Use company info from data if available, otherwise use default
    const companyInfo = data?.companyInfo || {
      name: 'FabZClean Services',
      address: '123 Business Street',
      phone: '(555) 123-4567',
      email: 'info@fabzclean.com',
      website: 'www.fabzclean.com'
    };

    // Company name (larger, bold)
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(companyInfo.name, margin.left, margin.top + 15);

    // Company details (smaller, normal)
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const details = [
      companyInfo.address,
      `Phone: ${companyInfo.phone}`,
      `Email: ${companyInfo.email}`
    ];

    if (companyInfo.website) {
      details.push(`Website: ${companyInfo.website}`);
    }

    if (companyInfo.taxId) {
      details.push(`Tax ID: ${companyInfo.taxId}`);
    }

    details.forEach((line, index) => {
      doc.text(line, margin.left, margin.top + 25 + (index * 5));
    });
  }

  private async addBarcode(doc: jsPDF, template: PrintTemplate, data: BarcodePrintData): Promise<void> {
    const { margin } = template.settings;

    try {
      // Add barcode image
      const img = new Image();
      img.src = data.imageData;

      await new Promise((resolve) => {
        img.onload = () => {
          const imgWidth = 40;
          const imgHeight = 40;
          const x = doc.internal.pageSize.width - margin.right - imgWidth;
          const y = margin.top + 50;

          doc.addImage(data.imageData, 'PNG', x, y, imgWidth, imgHeight);

          // Add barcode text
          doc.setFontSize(8);
          doc.text(data.code, x, y + imgHeight + 5);

          resolve(void 0);
        };
      });
    } catch (error) {
      console.error('Error adding barcode:', error);
    }
  }

  private addEntityDetails(doc: jsPDF, template: PrintTemplate, data: BarcodePrintData): void {
    const { margin } = template.settings;

    doc.setFontSize(template.settings.fontSize);
    doc.setFont(undefined, 'bold');
    doc.text(`${data.entityType.toUpperCase()} DETAILS`, margin.left, margin.top + 80);

    doc.setFont(undefined, 'normal');
    doc.text(`ID: ${data.entityId}`, margin.left, margin.top + 90);
    doc.text(`Code: ${data.code}`, margin.left, margin.top + 100);
    doc.text(`Type: ${data.type.toUpperCase()}`, margin.left, margin.top + 110);

    if (data.entityData) {
      Object.entries(data.entityData).forEach(([key, value], index) => {
        doc.text(`${key}: ${value}`, margin.left, margin.top + 120 + (index * 10));
      });
    }
  }

  private addLabelDetails(doc: jsPDF, template: PrintTemplate, data: LabelPrintData): void {
    const { margin } = template.settings;

    doc.setFontSize(template.settings.fontSize);
    doc.setFont(undefined, 'bold');
    doc.text('DETAILS', margin.left, margin.top + 80);

    doc.setFont(undefined, 'normal');
    data.details.forEach((detail, index) => {
      doc.text(`${detail.label}: ${detail.value}`, margin.left, margin.top + 90 + (index * 10));
    });

    if (data.footer) {
      doc.text(data.footer, margin.left, margin.top + 90 + (data.details.length * 10) + 10);
    }
  }

  private addInvoiceDetails(doc: jsPDF, template: PrintTemplate, data: InvoicePrintData): void {
    const { margin } = template.settings;

    // Invoice header section
    const pageWidth = doc.internal.pageSize.getWidth();
    const rightMargin = pageWidth - margin.right;

    // Invoice number and date (right aligned)
    doc.setFontSize(template.settings.fontSize + 2);
    doc.setFont(undefined, 'bold');
    doc.text(`INVOICE`, rightMargin - doc.getTextWidth('INVOICE'), margin.top + 20);

    doc.setFontSize(template.settings.fontSize);
    doc.text(`Invoice #: ${data.invoiceNumber}`, rightMargin - doc.getTextWidth(`Invoice #: ${data.invoiceNumber}`), margin.top + 30);
    doc.text(`Date: ${data.invoiceDate}`, rightMargin - doc.getTextWidth(`Date: ${data.invoiceDate}`), margin.top + 40);

    if (data.orderNumber) {
      doc.text(`Order #: ${data.orderNumber}`, rightMargin - doc.getTextWidth(`Order #: ${data.orderNumber}`), margin.top + 50);
    }

    if (data.dueDate) {
      doc.text(`Due Date: ${data.dueDate}`, rightMargin - doc.getTextWidth(`Due Date: ${data.dueDate}`), margin.top + 60);
    }

    // Customer info section
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', margin.left, margin.top + 80);
    doc.setFont(undefined, 'normal');

    const customerY = margin.top + 90;
    doc.text(data.customerInfo.name, margin.left, customerY);
    doc.text(data.customerInfo.address, margin.left, customerY + 10);
    doc.text(data.customerInfo.phone, margin.left, customerY + 20);
    doc.text(data.customerInfo.email, margin.left, customerY + 30);

    // Payment status
    if (data.paymentStatus) {
      doc.setFont(undefined, 'bold');
      const statusColor = data.paymentStatus.toLowerCase() === 'paid' ? '#27AE60' : '#E74C3C';
      doc.setTextColor(statusColor);
      doc.text(`Status: ${data.paymentStatus.toUpperCase()}`, rightMargin - doc.getTextWidth(`Status: ${data.paymentStatus.toUpperCase()}`), customerY + 20);
      doc.setTextColor(template.settings.color); // Reset color
    }
  }

  private addItemsTable(doc: jsPDF, template: PrintTemplate, data: InvoicePrintData): void {
    const { margin } = template.settings;
    const pageWidth = doc.internal.pageSize.getWidth();
    const rightMargin = pageWidth - margin.right;

    // Calculate column positions
    const itemWidth = 80;
    const qtyWidth = 25;
    const priceWidth = 35;
    const totalWidth = 35;

    const startY = margin.top + 140;

    // Draw table header background
    doc.setFillColor(240, 240, 240);
    doc.rect(margin.left, startY - 5, pageWidth - margin.left - margin.right, 10, 'F');

    // Table headers
    doc.setFontSize(template.settings.fontSize);
    doc.setFont(undefined, 'bold');
    doc.text('Item/Description', margin.left + 2, startY);
    doc.text('Qty', margin.left + itemWidth + 2, startY);
    doc.text('Unit Price', margin.left + itemWidth + qtyWidth + 2, startY);
    doc.text('Total', rightMargin - totalWidth + 2, startY);

    // Draw header underline
    doc.setLineWidth(0.5);
    doc.line(margin.left, startY + 2, rightMargin, startY + 2);

    // Table rows
    doc.setFont(undefined, 'normal');
    let currentY = startY + 15;

    data.items.forEach((item, index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin.left, currentY - 3, pageWidth - margin.left - margin.right, 10, 'F');
      }

      // Item name and description
      const itemText = item.description ? `${item.name}\n${item.description}` : item.name;
      doc.text(itemText, margin.left + 2, currentY);

      // Quantity
      doc.text((item.quantity || 0).toString(), margin.left + itemWidth + 2, currentY);

      // Unit price
      doc.text(`₹${(parseFloat(String(item.unitPrice)) || 0).toFixed(2)}`, margin.left + itemWidth + qtyWidth + 2, currentY);

      // Total
      doc.text(`₹${(parseFloat(String(item.total)) || 0).toFixed(2)}`, rightMargin - totalWidth + 2, currentY);

      currentY += 12;

      // Check if we need a new page
      if (currentY > pageWidth - margin.bottom - 50) {
        doc.addPage();
        currentY = margin.top + 20;
      }
    });
  }

  private addInvoiceTotals(doc: jsPDF, template: PrintTemplate, data: InvoicePrintData): void {
    const { margin } = template.settings;
    const pageWidth = doc.internal.pageSize.getWidth();
    const rightMargin = pageWidth - margin.right;

    // Calculate totals section position
    const tableEndY = margin.top + 140 + (data.items.length * 12) + 20;
    const startY = Math.max(tableEndY, margin.top + 200);

    // Draw totals box
    const totalsWidth = 80;
    const totalsX = rightMargin - totalsWidth;
    const totalsHeight = data.discount ? 60 : 50;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(totalsX - 5, startY - 5, totalsWidth, totalsHeight, 'S');

    // Subtotal
    doc.setFontSize(template.settings.fontSize);
    doc.setFont(undefined, 'normal');
    doc.text('Subtotal:', totalsX, startY + 10);
    doc.text(`₹${(parseFloat(String(data.subtotal)) || 0).toFixed(2)}`, totalsX + 50, startY + 10);

    // Discount (if applicable)
    if (data.discount && data.discount > 0) {
      doc.text('Discount:', totalsX, startY + 20);
      doc.text(`-₹${(parseFloat(String(data.discount)) || 0).toFixed(2)}`, totalsX + 50, startY + 20);
    }

    // Tax
    doc.text('Tax:', totalsX, startY + (data.discount ? 30 : 20));
    doc.text(`₹${(parseFloat(String(data.tax)) || 0).toFixed(2)}`, totalsX + 50, startY + (data.discount ? 30 : 20));

    // Total
    doc.setFont(undefined, 'bold');
    doc.setFontSize(template.settings.fontSize + 1);
    const totalY = startY + (data.discount ? 45 : 35);
    doc.text('Total:', totalsX, totalY);
    doc.text(`₹${(parseFloat(String(data.total)) || 0).toFixed(2)}`, totalsX + 50, totalY);

    // Payment information
    if (data.paymentMethod || data.paymentStatus) {
      doc.setFont(undefined, 'normal');
      doc.setFontSize(template.settings.fontSize - 1);

      const paymentY = totalY + 25;
      if (data.paymentMethod) {
        doc.text(`Payment Method: ${data.paymentMethod}`, margin.left, paymentY);
      }
      if (data.paymentStatus) {
        doc.text(`Payment Status: ${data.paymentStatus}`, margin.left, paymentY + 10);
      }
    }

    // Terms and conditions
    if (data.terms) {
      doc.setFontSize(template.settings.fontSize - 2);
      doc.text('Terms:', margin.left, startY + 80);
      doc.text(data.terms, margin.left, startY + 90);
    }
  }

  private addReceiptDetails(doc: jsPDF, template: PrintTemplate, data: InvoicePrintData): void {
    const { margin } = template.settings;

    doc.setFontSize(template.settings.fontSize);
    doc.setFont(undefined, 'bold');
    doc.text(`Receipt #: ${data.invoiceNumber}`, margin.left, margin.top + 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin.left, margin.top + 60);
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, margin.left, margin.top + 70);
  }

  private addReceiptItems(doc: jsPDF, template: PrintTemplate, data: InvoicePrintData): void {
    const { margin } = template.settings;

    doc.setFontSize(template.settings.fontSize);
    doc.setFont(undefined, 'normal');

    data.items.forEach((item, index) => {
      const y = margin.top + 90 + (index * 15);
      doc.text(`${item.name}`, margin.left, y);
      doc.text(`Qty: ${item.quantity} x ₹${(item.unitPrice || 0).toFixed(2)} = ₹${(item.total || 0).toFixed(2)}`, margin.left, y + 8);
    });
  }

  private addReceiptTotals(doc: jsPDF, template: PrintTemplate, data: InvoicePrintData): void {
    const { margin } = template.settings;

    const startY = margin.top + 90 + (data.items.length * 15) + 20;

    doc.setFontSize(template.settings.fontSize);
    doc.setFont(undefined, 'normal');
    doc.text(`Subtotal: ₹${(parseFloat(String(data.subtotal)) || 0).toFixed(2)}`, margin.left, startY);
    doc.text(`Tax: ₹${(parseFloat(String(data.tax)) || 0).toFixed(2)}`, margin.left, startY + 10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: ₹${(parseFloat(String(data.total)) || 0).toFixed(2)}`, margin.left, startY + 20);

    if (data.paymentMethod) {
      doc.setFont(undefined, 'normal');
      doc.text(`Payment: ${data.paymentMethod}`, margin.left, startY + 30);
    }
  }

  private addSignature(doc: jsPDF, template: PrintTemplate): void {
    const { margin } = template.settings;

    doc.setFontSize(template.settings.fontSize);
    doc.setFont(undefined, 'normal');
    doc.text('Signature:', margin.left, doc.internal.pageSize.height - margin.bottom - 30);
    doc.text('_________________________', margin.left, doc.internal.pageSize.height - margin.bottom - 20);
    doc.text('Date:', margin.left + 100, doc.internal.pageSize.height - margin.bottom - 30);
    doc.text('_________________________', margin.left + 100, doc.internal.pageSize.height - margin.bottom - 20);
  }

  private addFooter(doc: jsPDF, template: PrintTemplate, data: any): void {
    const { margin } = template.settings;

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Printed on: ${new Date().toLocaleString()}`, margin.left, doc.internal.pageSize.height - margin.bottom + 10);
    doc.text('Thank you for your business!', margin.left, doc.internal.pageSize.height - margin.bottom + 20);
  }

  public async printMultiple(items: Array<{ type: string; data: any; templateId: string }>): Promise<void> {
    const doc = new jsPDF();
    let isFirstPage = true;

    for (const item of items) {
      if (!isFirstPage) {
        doc.addPage();
      }

      switch (item.type) {
        case 'barcode':
          await this.printBarcode(item.data, item.templateId);
          break;
        case 'label':
          await this.printLabel(item.data, item.templateId);
          break;
        case 'invoice':
          await this.printInvoice(item.data, item.templateId);
          break;
        case 'receipt':
          await this.printReceipt(item.data, item.templateId);
          break;
        default:
          console.warn(`Unknown print type: ${item.type}`);
      }

      isFirstPage = false;
    }

    doc.autoPrint();
    doc.save('multiple-documents.pdf');
  }

  // Enhanced Invoice Generation
  async printProfessionalInvoice(data: InvoiceData): Promise<void> {
    const template = this.getTemplate('invoice');
    const pdf = new jsPDF({
      orientation: template.settings.orientation,
      unit: 'mm',
      format: template.settings.pageSize
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = template.settings.margin;

    let yPosition = margin.top;

    // Header with Logo
    if (template.layout.header) {
      pdf.setFontSize(24);
      pdf.setFont(template.settings.fontFamily, 'bold');
      pdf.text('INVOICE', pageWidth - margin.right - 30, yPosition);

      if (template.layout.logo && data.company.logo) {
        try {
          const logoImg = await this.loadImage(data.company.logo);
          pdf.addImage(logoImg, 'PNG', margin.left, yPosition - 5, 30, 15);
        } catch (error) {
          console.error('Error loading logo:', error);
        }
      }

      yPosition += 20;
    }

    // Company Information
    if (template.layout.companyInfo) {
      pdf.setFontSize(12);
      pdf.setFont(template.settings.fontFamily, 'bold');
      pdf.text(data.company.name, margin.left, yPosition);
      yPosition += 6;

      pdf.setFontSize(10);
      pdf.setFont(template.settings.fontFamily, 'normal');
      const companyAddress = data.company.address.split('\n');
      companyAddress.forEach((line: string) => {
        pdf.text(line, margin.left, yPosition);
        yPosition += 4;
      });

      pdf.text(`Phone: ${data.company.phone}`, margin.left, yPosition);
      yPosition += 4;
      pdf.text(`Email: ${data.company.email}`, margin.left, yPosition);
      yPosition += 4;
      pdf.text(`Tax ID: ${data.company.taxId}`, margin.left, yPosition);
      yPosition += 15;
    }

    // Invoice Details
    pdf.setFontSize(12);
    pdf.setFont(template.settings.fontFamily, 'bold');
    pdf.text(`Invoice #: ${data.invoiceNumber}`, pageWidth - margin.right - 50, margin.top + 20);
    pdf.text(`Date: ${data.invoiceDate}`, pageWidth - margin.right - 50, margin.top + 26);
    pdf.text(`Due Date: ${data.dueDate}`, pageWidth - margin.right - 50, margin.top + 32);

    // Customer Information
    yPosition = margin.top + 50;
    pdf.setFontSize(12);
    pdf.setFont(template.settings.fontFamily, 'bold');
    pdf.text('Bill To:', margin.left, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont(template.settings.fontFamily, 'normal');
    pdf.text(data.customer.name, margin.left, yPosition);
    yPosition += 4;

    const customerAddress = data.customer.address.split('\n');
    customerAddress.forEach((line: string) => {
      pdf.text(line, margin.left, yPosition);
      yPosition += 4;
    });

    pdf.text(`Phone: ${data.customer.phone}`, margin.left, yPosition);
    yPosition += 4;
    pdf.text(`Email: ${data.customer.email}`, margin.left, yPosition);
    yPosition += 4;
    if (data.customer.taxId) {
      pdf.text(`Tax ID: ${data.customer.taxId}`, margin.left, yPosition);
      yPosition += 4;
    }
    yPosition += 10;

    // Items Table
    if (template.layout.table) {
      const tableTop = yPosition;
      const colWidths = [80, 20, 25, 25, 25];
      const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);

      // Table Headers
      pdf.setFontSize(10);
      pdf.setFont(template.settings.fontFamily, 'bold');
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin.left, tableTop, tableWidth, 8, 'F');

      let xPosition = margin.left;
      pdf.text('Description', xPosition + 2, tableTop + 5);
      xPosition += colWidths[0];
      pdf.text('Qty', xPosition + 2, tableTop + 5);
      xPosition += colWidths[1];
      pdf.text('Unit Price', xPosition + 2, tableTop + 5);
      xPosition += colWidths[2];
      pdf.text('Tax', xPosition + 2, tableTop + 5);
      xPosition += colWidths[3];
      pdf.text('Total', xPosition + 2, tableTop + 5);

      yPosition = tableTop + 8;

      // Table Rows
      pdf.setFont(template.settings.fontFamily, 'normal');
      data.items.forEach((item, index) => {
        if (yPosition > pageHeight - margin.bottom - 20) {
          pdf.addPage();
          yPosition = margin.top;
        }

        pdf.setFillColor(index % 2 === 0 ? 255 : 248, 248, 248);
        pdf.rect(margin.left, yPosition, tableWidth, 8, 'F');

        xPosition = margin.left;
        pdf.text(item.description, xPosition + 2, yPosition + 5);
        xPosition += colWidths[0];
        pdf.text((item.quantity || 0).toString(), xPosition + 2, yPosition + 5);
        xPosition += colWidths[1];
        pdf.text(`₹${(parseFloat(String(item.unitPrice)) || 0).toFixed(2)}`, xPosition + 2, yPosition + 5);
        xPosition += colWidths[2];
        pdf.text(`${(parseFloat(String(item.taxRate)) || 0)}%`, xPosition + 2, yPosition + 5);
        xPosition += colWidths[3];
        pdf.text(`₹${(parseFloat(String(item.total)) || 0).toFixed(2)}`, xPosition + 2, yPosition + 5);

        yPosition += 8;
      });

      yPosition += 10;
    }

    // Totals
    const totalsX = pageWidth - margin.right - 60;
    pdf.setFontSize(10);
    pdf.setFont(template.settings.fontFamily, 'normal');

    pdf.text('Subtotal:', totalsX, yPosition);
    pdf.text(`₹${(parseFloat(String(data.subtotal)) || 0).toFixed(2)}`, totalsX + 40, yPosition);
    yPosition += 6;

    pdf.text('Tax:', totalsX, yPosition);
    pdf.text(`₹${(parseFloat(String(data.taxAmount)) || 0).toFixed(2)}`, totalsX + 40, yPosition);
    yPosition += 6;

    pdf.setFont(template.settings.fontFamily, 'bold');
    pdf.setFontSize(12);
    pdf.text('Total:', totalsX, yPosition);
    pdf.text(`₹${(parseFloat(String(data.total)) || 0).toFixed(2)}`, totalsX + 40, yPosition);
    yPosition += 15;

    // Payment Terms
    pdf.setFontSize(10);
    pdf.setFont(template.settings.fontFamily, 'normal');
    pdf.text('Payment Terms:', margin.left, yPosition);
    yPosition += 6;
    pdf.text(data.paymentTerms, margin.left, yPosition);
    yPosition += 10;

    // Notes
    if (data.notes) {
      pdf.text('Notes:', margin.left, yPosition);
      yPosition += 6;
      const notesLines = data.notes.split('\n');
      notesLines.forEach((line: string) => {
        pdf.text(line, margin.left, yPosition);
        yPosition += 4;
      });
      yPosition += 10;
    }

    // QR Code for Payment
    if (data.qrCode && template.layout.qrCode) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = 100;
          canvas.height = 100;
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '8px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Payment QR', canvas.width / 2, canvas.height / 2);

          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', pageWidth - margin.right - 30, yPosition, 20, 20);
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }

    // Footer
    if (template.layout.footer) {
      yPosition = pageHeight - margin.bottom;
      pdf.setFontSize(8);
      pdf.setFont(template.settings.fontFamily, 'italic');
      pdf.text(`Generated on ${new Date().toLocaleString()}`, margin.left, yPosition);
      pdf.text('Thank you for your business!', pageWidth - margin.right - 50, yPosition);
    }

    pdf.save(`Invoice_${data.invoiceNumber}.pdf`);
  }

  // Enhanced Report Generation
  async printProfessionalReport(data: ReportData): Promise<void> {
    const template = this.getTemplate('report');
    const pdf = new jsPDF({
      orientation: template.settings.orientation,
      unit: 'mm',
      format: template.settings.pageSize
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = template.settings.margin;

    let yPosition = margin.top;

    // Header with Logo
    if (template.layout.header) {
      if (template.layout.logo && data.company.logo) {
        try {
          const logoImg = await this.loadImage(data.company.logo);
          pdf.addImage(logoImg, 'PNG', margin.left, yPosition, 30, 15);
        } catch (error) {
          console.error('Error loading logo:', error);
        }
      }

      pdf.setFontSize(20);
      pdf.setFont(template.settings.fontFamily, 'bold');
      pdf.text(data.title, margin.left + 40, yPosition + 10);

      if (data.subtitle) {
        pdf.setFontSize(14);
        pdf.setFont(template.settings.fontFamily, 'normal');
        pdf.text(data.subtitle, margin.left + 40, yPosition + 18);
      }

      yPosition += 30;
    }

    // Report Info
    pdf.setFontSize(10);
    pdf.setFont(template.settings.fontFamily, 'normal');
    pdf.text(`Generated on: ${data.reportDate}`, margin.left, yPosition);
    pdf.text(`Generated by: ${data.generatedBy}`, margin.left, yPosition + 6);
    yPosition += 20;

    // Company Information
    if (template.layout.companyInfo) {
      pdf.setFontSize(12);
      pdf.setFont(template.settings.fontFamily, 'bold');
      pdf.text(data.company.name, margin.left, yPosition);
      yPosition += 6;

      pdf.setFontSize(10);
      pdf.setFont(template.settings.fontFamily, 'normal');
      pdf.text(data.company.address, margin.left, yPosition);
      yPosition += 15;
    }

    // Summary Section
    pdf.setFontSize(14);
    pdf.setFont(template.settings.fontFamily, 'bold');
    pdf.text('Executive Summary', margin.left, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont(template.settings.fontFamily, 'normal');

    // Summary Cards
    const cardWidth = (pageWidth - margin.left - margin.right - 20) / 4;
    const cardHeight = 25;

    const summaryData = [
      { label: 'Total Orders', value: data.summary.totalOrders.toString() },
      { label: 'Total Revenue', value: `₹${data.summary.totalRevenue.toLocaleString()}` },
      { label: 'Total Customers', value: data.summary.totalCustomers.toString() },
      { label: 'Avg Order Value', value: `₹${data.summary.averageOrderValue.toFixed(2)}` }
    ];

    summaryData.forEach((item, index) => {
      const xPos = margin.left + (index * (cardWidth + 5));

      pdf.setFillColor(240, 240, 240);
      pdf.rect(xPos, yPosition, cardWidth, cardHeight, 'F');

      pdf.setFont(template.settings.fontFamily, 'bold');
      pdf.setFontSize(12);
      pdf.text(item.value, xPos + cardWidth / 2, yPosition + 10, { align: 'center' });

      pdf.setFont(template.settings.fontFamily, 'normal');
      pdf.setFontSize(8);
      pdf.text(item.label, xPos + cardWidth / 2, yPosition + 18, { align: 'center' });
    });

    yPosition += cardHeight + 15;

    // Top Services
    if (data.summary.topServices.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont(template.settings.fontFamily, 'bold');
      pdf.text('Top Performing Services', margin.left, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont(template.settings.fontFamily, 'normal');

      data.summary.topServices.forEach((service, index) => {
        if (yPosition > pageHeight - margin.bottom - 20) {
          pdf.addPage();
          yPosition = margin.top;
        }

        pdf.text(`${index + 1}. ${service.name}`, margin.left, yPosition);
        pdf.text(`Orders: ${service.count}`, margin.left + 80, yPosition);
        pdf.text(`Revenue: ₹${service.revenue.toLocaleString()}`, margin.left + 120, yPosition);
        yPosition += 6;
      });

      yPosition += 10;
    }

    // Tables
    if (data.tables && data.tables.length > 0) {
      data.tables.forEach((table) => {
        if (yPosition > pageHeight - margin.bottom - 50) {
          pdf.addPage();
          yPosition = margin.top;
        }

        pdf.setFontSize(12);
        pdf.setFont(template.settings.fontFamily, 'bold');
        pdf.text(table.title, margin.left, yPosition);
        yPosition += 8;

        // Table Headers
        const colWidths = table.headers.map(() => (pageWidth - margin.left - margin.right) / table.headers.length);
        const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);

        pdf.setFontSize(9);
        pdf.setFont(template.settings.fontFamily, 'bold');
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin.left, yPosition, tableWidth, 8, 'F');

        let xPosition = margin.left;
        table.headers.forEach((header, index) => {
          pdf.text(header, xPosition + 2, yPosition + 5);
          xPosition += colWidths[index];
        });

        yPosition += 8;

        // Table Rows
        pdf.setFont(template.settings.fontFamily, 'normal');
        table.rows.forEach((row, index) => {
          if (yPosition > pageHeight - margin.bottom - 20) {
            pdf.addPage();
            yPosition = margin.top;
          }

          pdf.setFillColor(index % 2 === 0 ? 255 : 248, 248, 248);
          pdf.rect(margin.left, yPosition, tableWidth, 6, 'F');

          xPosition = margin.left;
          row.forEach((cell, cellIndex) => {
            pdf.text(cell, xPosition + 2, yPosition + 4);
            xPosition += colWidths[cellIndex];
          });

          yPosition += 6;
        });

        yPosition += 15;
      });
    }

    // Footer
    if (template.layout.footer) {
      yPosition = pageHeight - margin.bottom;
      pdf.setFontSize(8);
      pdf.setFont(template.settings.fontFamily, 'italic');
      pdf.text(`Generated on ${new Date().toLocaleString()}`, margin.left, yPosition);
      if (data.footer) {
        pdf.text(data.footer, pageWidth - margin.right - 50, yPosition);
      }
    }

    pdf.save(`${data.title ? data.title.replace(/\s+/g, '_') : 'report'}_Report.pdf`);
  }

  private async loadImage(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = src;
    });
  }
}

// Export singleton instance
export const printDriver = PrintDriver.getInstance();
