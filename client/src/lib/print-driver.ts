import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  customerInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  notes?: string;
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
      name: 'Invoice',
      description: 'Professional invoice template',
      category: 'invoice',
      settings: {
        pageSize: 'A4',
        orientation: 'portrait',
        margin: { top: 25, right: 25, bottom: 25, left: 25 },
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
      this.addCompanyInfo(doc, template);
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
    doc.save(`${data.title.toLowerCase().replace(/\s+/g, '-')}-label.pdf`);
  }

  public async printInvoice(data: InvoicePrintData, templateId: string = 'invoice'): Promise<void> {
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
      this.addCompanyInfo(doc, template);
    }

    // Add invoice details
    this.addInvoiceDetails(doc, template, data);

    // Add items table
    if (template.layout.table) {
      this.addItemsTable(doc, template, data);
    }

    // Add totals
    this.addInvoiceTotals(doc, template, data);

    // Add signature
    if (template.layout.signature) {
      this.addSignature(doc, template);
    }

    // Add footer
    if (template.layout.footer) {
      this.addFooter(doc, template, data);
    }

    // Print or save
    doc.autoPrint();
    doc.save(`invoice-${data.invoiceNumber}.pdf`);
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
      this.addCompanyInfo(doc, template);
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

  private addCompanyInfo(doc: jsPDF, template: PrintTemplate): void {
    const { margin } = template.settings;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const companyInfo = [
      'FabZClean Services',
      '123 Business Street',
      'City, State 12345',
      'Phone: (555) 123-4567',
      'Email: info@fabzclean.com'
    ];

    companyInfo.forEach((line, index) => {
      doc.text(line, margin.left, margin.top + 30 + (index * 5));
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
    
    // Invoice number and date
    doc.setFontSize(template.settings.fontSize);
    doc.setFont(undefined, 'bold');
    doc.text(`Invoice #: ${data.invoiceNumber}`, margin.left, margin.top + 80);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin.left, margin.top + 90);
    
    // Customer info
    doc.text('Bill To:', margin.left, margin.top + 110);
    doc.setFont(undefined, 'normal');
    doc.text(data.customerInfo.name, margin.left, margin.top + 120);
    doc.text(data.customerInfo.address, margin.left, margin.top + 130);
    doc.text(data.customerInfo.phone, margin.left, margin.top + 140);
    doc.text(data.customerInfo.email, margin.left, margin.top + 150);
  }

  private addItemsTable(doc: jsPDF, template: PrintTemplate, data: InvoicePrintData): void {
    const { margin } = template.settings;
    
    // Table headers
    doc.setFontSize(template.settings.fontSize);
    doc.setFont(undefined, 'bold');
    const startY = margin.top + 170;
    
    doc.text('Item', margin.left, startY);
    doc.text('Qty', margin.left + 80, startY);
    doc.text('Price', margin.left + 100, startY);
    doc.text('Total', margin.left + 130, startY);
    
    // Table rows
    doc.setFont(undefined, 'normal');
    data.items.forEach((item, index) => {
      const y = startY + 15 + (index * 10);
      doc.text(item.name, margin.left, y);
      doc.text(item.quantity.toString(), margin.left + 80, y);
      doc.text(`$${item.price.toFixed(2)}`, margin.left + 100, y);
      doc.text(`$${item.total.toFixed(2)}`, margin.left + 130, y);
    });
  }

  private addInvoiceTotals(doc: jsPDF, template: PrintTemplate, data: InvoicePrintData): void {
    const { margin } = template.settings;
    
    const startY = margin.top + 170 + (data.items.length * 10) + 30;
    
    doc.setFontSize(template.settings.fontSize);
    doc.setFont(undefined, 'normal');
    doc.text(`Subtotal: $${data.subtotal.toFixed(2)}`, margin.left + 100, startY);
    doc.text(`Tax: $${data.tax.toFixed(2)}`, margin.left + 100, startY + 10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: $${data.total.toFixed(2)}`, margin.left + 100, startY + 20);
    
    if (data.paymentMethod) {
      doc.setFont(undefined, 'normal');
      doc.text(`Payment Method: ${data.paymentMethod}`, margin.left, startY + 40);
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
      doc.text(`Qty: ${item.quantity} x $${item.price.toFixed(2)} = $${item.total.toFixed(2)}`, margin.left, y + 8);
    });
  }

  private addReceiptTotals(doc: jsPDF, template: PrintTemplate, data: InvoicePrintData): void {
    const { margin } = template.settings;
    
    const startY = margin.top + 90 + (data.items.length * 15) + 20;
    
    doc.setFontSize(template.settings.fontSize);
    doc.setFont(undefined, 'normal');
    doc.text(`Subtotal: $${data.subtotal.toFixed(2)}`, margin.left, startY);
    doc.text(`Tax: $${data.tax.toFixed(2)}`, margin.left, startY + 10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: $${data.total.toFixed(2)}`, margin.left, startY + 20);
    
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
        pdf.text(item.quantity.toString(), xPosition + 2, yPosition + 5);
        xPosition += colWidths[1];
        pdf.text(`₹${item.unitPrice.toFixed(2)}`, xPosition + 2, yPosition + 5);
        xPosition += colWidths[2];
        pdf.text(`${(item.taxRate || 0)}%`, xPosition + 2, yPosition + 5);
        xPosition += colWidths[3];
        pdf.text(`₹${item.total.toFixed(2)}`, xPosition + 2, yPosition + 5);
        
        yPosition += 8;
      });
      
      yPosition += 10;
    }

    // Totals
    const totalsX = pageWidth - margin.right - 60;
    pdf.setFontSize(10);
    pdf.setFont(template.settings.fontFamily, 'normal');
    
    pdf.text('Subtotal:', totalsX, yPosition);
    pdf.text(`₹${data.subtotal.toFixed(2)}`, totalsX + 40, yPosition);
    yPosition += 6;
    
    pdf.text('Tax:', totalsX, yPosition);
    pdf.text(`₹${data.taxAmount.toFixed(2)}`, totalsX + 40, yPosition);
    yPosition += 6;
    
    pdf.setFont(template.settings.fontFamily, 'bold');
    pdf.setFontSize(12);
    pdf.text('Total:', totalsX, yPosition);
    pdf.text(`₹${data.total.toFixed(2)}`, totalsX + 40, yPosition);
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
      pdf.text(item.value, xPos + cardWidth/2, yPosition + 10, { align: 'center' });
      
      pdf.setFont(template.settings.fontFamily, 'normal');
      pdf.setFontSize(8);
      pdf.text(item.label, xPos + cardWidth/2, yPosition + 18, { align: 'center' });
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

    pdf.save(`${data.title.replace(/\s+/g, '_')}_Report.pdf`);
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
