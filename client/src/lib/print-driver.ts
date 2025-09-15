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
}

// Export singleton instance
export const printDriver = PrintDriver.getInstance();
