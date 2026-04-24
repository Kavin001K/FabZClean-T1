import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { db } from '../db';
import { LocalStorage } from './local-storage';
import { R2Storage } from './r2-storage';
import { businessConfigService } from './business-config-service';
import { sendInvoiceWhatsAppBatch } from './whatsapp.service';
import { smartItemSummary } from '../utils/item-summarizer';
import {
  DEFAULT_INVOICE_TEMPLATE_CONFIG,
  type BusinessProfile,
  type InvoiceTemplateProfile,
  type StoreConfig,
} from '../../shared/business-config';

const APP_BASE_URL = (process.env.APP_BASE_URL || 'https://erp.myfabclean.com').replace(/\/$/, '');
const LOCAL_TMP_DIR = path.join(process.cwd(), 'server', 'uploads', 'tmp_invoices');
const DEFAULT_UPI_ID = process.env.DEFAULT_UPI_ID || 'fabclean@ybl';
const DEFAULT_UPI_NAME = process.env.DEFAULT_UPI_NAME || 'Fab Clean';
const MAX_PIPELINE_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

type OrderLike = {
  id: string;
  orderNumber: string;
  franchiseId?: string | null;
  storeId?: string | null;
  storeCode?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  secondaryPhone?: string | null;
  customerEmail?: string | null;
  totalAmount?: string | number | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  status?: string | null;
  invoiceUrl?: string | null;
  invoiceTemplateId?: string | null;
  appliedTemplateId?: string | null;
  pickupDate?: string | Date | null;
  createdAt?: string | Date | null;
  deliveryAddress?: unknown;
  shippingAddress?: unknown;
  customerAddress?: unknown;
  address?: unknown;
  fulfillmentType?: string | null;
  specialInstructions?: string | null;
  gstEnabled?: boolean | null;
  gstAmount?: string | number | null;
  gstRate?: string | number | null;
  extraCharges?: string | number | null;
  discountValue?: string | number | null;
  deliveryCharges?: string | number | null;
  items?: Array<{
    serviceName?: string;
    service_name?: string;
    customName?: string;
    name?: string;
    note?: string;
    quantity?: number | string;
    price?: string | number;
    unitPrice?: string | number;
    total?: string | number;
    subtotal?: string | number;
  }> | null;
};

type EnrichedInvoiceOrder = {
  order: OrderLike & {
    customerName: string;
    customerPhone: string;
    secondaryPhone?: string | null;
    customerEmail: string;
    customerAddress?: unknown;
    items: NonNullable<OrderLike['items']>;
  };
  businessProfile: BusinessProfile;
  store: StoreConfig | null;
  template: InvoiceTemplateProfile | null;
};

type StoredInvoiceResult = {
  invoiceUrl: string;
  filepath: string;
  storageUsed: 'r2' | 'local';
  appliedTemplateId: string | null;
  templateKey: string | null;
  order: EnrichedInvoiceOrder['order'];
};

const logoCache = new Map<string, string>();

const coerceNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const safeText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value.trim() || fallback : fallback;

const escapeFilename = (value: string): string =>
  String(value || 'invoice').replace(/[^a-zA-Z0-9._-]/g, '_');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDisplayDate = (value?: string | Date | null): string => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatHeroDate = (value?: string | Date | null): string => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return formatDisplayDate(new Date());
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const normalizeUploadsPath = (value: string): string | null => {
  const index = value.indexOf('/uploads/');
  return index >= 0 ? value.slice(index) : null;
};

const parseAddress = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return parseAddress(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  if (typeof value === 'object') {
    const parts = Object.values(value as Record<string, unknown>)
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .map((part) => part.trim());

    return parts.join(', ');
  }

  return '';
};

const getTemplateConfig = (template: InvoiceTemplateProfile | null) => ({
  ...DEFAULT_INVOICE_TEMPLATE_CONFIG,
  ...(template?.config || {}),
});

const getStoreName = (context: EnrichedInvoiceOrder): string =>
  safeText(context.store?.name, safeText(context.businessProfile.companyName, 'Fab Clean'));

const getStoreAddress = (context: EnrichedInvoiceOrder): string =>
  parseAddress(context.store?.address) ||
  parseAddress(context.businessProfile.companyAddress) ||
  '#16, Venkatramana Round Road, Pollachi';

const getStorePhone = (context: EnrichedInvoiceOrder): string =>
  safeText(context.store?.contactDetails?.phone, safeText(context.businessProfile.contactDetails?.phone, '+91 93630 59595'));

const getStoreEmail = (context: EnrichedInvoiceOrder): string =>
  safeText(context.store?.contactDetails?.email, safeText(context.businessProfile.contactDetails?.email, 'support@myfabclean.com'));

const buildPaymentQrPayload = (context: EnrichedInvoiceOrder, amount: number, orderNumber: string) => {
  const paymentDetails = context.businessProfile.paymentDetails || {};
  const upiId = safeText(paymentDetails.upiId, DEFAULT_UPI_ID);
  const upiName = safeText(paymentDetails.upiName, DEFAULT_UPI_NAME);

  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${Math.max(amount, 0).toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderNumber)}`;
};

const toLineItems = (items: NonNullable<OrderLike['items']>) => {
  const normalized = items.map((item, index) => {
    const quantity = Math.max(1, Math.round(coerceNumber(item?.quantity, 1)));
    const unitPrice = coerceNumber(item?.unitPrice ?? item?.price, 0);
    const total = coerceNumber(item?.total ?? item?.subtotal, unitPrice * quantity);

    return {
      lineNo: index + 1,
      name: safeText(
        item?.serviceName ||
          item?.service_name ||
          item?.customName ||
          item?.name,
        'Laundry Service'
      ),
      note: safeText(item?.note),
      quantity,
      unitPrice,
      total,
    };
  });

  if (normalized.length > 0) {
    return normalized;
  }

  return [{
    lineNo: 1,
    name: 'Laundry Service',
    note: '',
    quantity: 1,
    unitPrice: 0,
    total: 0,
  }];
};

const ones = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const numberToWords = (value: number): string => {
  if (value < 20) return ones[value];
  if (value < 100) {
    return `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${ones[value % 10]}` : ''}`;
  }
  if (value < 1000) {
    return `${ones[Math.floor(value / 100)]} Hundred${value % 100 ? ` ${numberToWords(value % 100)}` : ''}`;
  }
  if (value < 100000) {
    return `${numberToWords(Math.floor(value / 1000))} Thousand${value % 1000 ? ` ${numberToWords(value % 1000)}` : ''}`;
  }
  if (value < 10000000) {
    return `${numberToWords(Math.floor(value / 100000))} Lakh${value % 100000 ? ` ${numberToWords(value % 100000)}` : ''}`;
  }

  return `${numberToWords(Math.floor(value / 10000000))} Crore${value % 10000000 ? ` ${numberToWords(value % 10000000)}` : ''}`;
};

const currencyToWords = (amount: number): string => {
  const rupees = Math.max(0, Math.round(amount));
  return `${numberToWords(rupees)} Rupees Only`;
};

async function loadLogoDataUri(): Promise<string | null> {
  const logoPath = path.join(process.cwd(), 'client', 'public', 'assets', 'fabclean-logo.png');

  if (logoCache.has(logoPath)) {
    return logoCache.get(logoPath) || null;
  }

  try {
    const buffer = await fs.promises.readFile(logoPath);
    const dataUri = `data:image/png;base64,${buffer.toString('base64')}`;
    logoCache.set(logoPath, dataUri);
    return dataUri;
  } catch {
    return null;
  }
}

async function uploadInvoiceBuffer(filename: string, pdfBuffer: Buffer): Promise<{
  filepath: string;
  fileUrl: string;
  storageUsed: 'r2' | 'local';
}> {
  const useLocalOnly = process.env.NODE_ENV !== 'production' || process.env.INVOICE_STORAGE_MODE === 'local';

  if (useLocalOnly) {
    await fs.promises.mkdir(LOCAL_TMP_DIR, { recursive: true });
    const safeName = escapeFilename(filename);
    const localPath = path.join(LOCAL_TMP_DIR, safeName);
    await fs.promises.writeFile(localPath, pdfBuffer);
    return {
      filepath: `/uploads/tmp_invoices/${safeName}`,
      fileUrl: `${APP_BASE_URL}/uploads/tmp_invoices/${safeName}`,
      storageUsed: 'local',
    };
  }

  try {
    const upload = await R2Storage.uploadDocumentPdf(filename, pdfBuffer);
    return {
      filepath: upload.key,
      fileUrl: upload.url,
      storageUsed: 'r2',
    };
  } catch (r2Error) {
    console.error('[Order Invoice] R2 upload failed, falling back to local storage:', r2Error);
    const localUrl = await LocalStorage.saveInvoicePdf(filename.replace(/\.pdf$/i, ''), pdfBuffer);
    return {
      filepath: localUrl,
      fileUrl: `${APP_BASE_URL}${localUrl}`,
      storageUsed: 'local',
    };
  }
}

export async function deleteFromInvoiceStorage(urlOrPath?: string | null): Promise<boolean> {
  if (!urlOrPath) return false;

  const uploadsPath = normalizeUploadsPath(urlOrPath);
  if (uploadsPath) {
    return LocalStorage.deleteFile(uploadsPath);
  }

  try {
    return await R2Storage.deleteInvoiceObject(urlOrPath);
  } catch (error) {
    console.error('[Order Invoice] Failed to delete remote invoice:', error);
    return false;
  }
}

async function hydrateOrderForInvoice(orderId: string, templateId?: string): Promise<EnrichedInvoiceOrder> {
  const order = await db.getOrder(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  const mutableOrder: EnrichedInvoiceOrder['order'] = {
    ...order,
    customerName: safeText((order as any).customerName),
    customerPhone: safeText((order as any).customerPhone),
    secondaryPhone: safeText((order as any).secondaryPhone),
    customerEmail: safeText((order as any).customerEmail),
    items: Array.isArray((order as any).items) ? (order as any).items : [],
  };

  if ((order as any).customerId) {
    const customer = await db.getCustomer((order as any).customerId);
    if (!customer) {
      throw new Error(`Customer ${(order as any).customerId} not found for order ${order.orderNumber}`);
    }

    mutableOrder.customerName = safeText((customer as any).name, mutableOrder.customerName);
    mutableOrder.customerPhone = safeText((customer as any).phone, mutableOrder.customerPhone);
    mutableOrder.secondaryPhone = safeText((customer as any).secondaryPhone, mutableOrder.secondaryPhone);
    mutableOrder.customerEmail = safeText((customer as any).email, mutableOrder.customerEmail);

    const hasOrderAddress = mutableOrder.deliveryAddress || mutableOrder.shippingAddress || mutableOrder.customerAddress || mutableOrder.address;
    if (!hasOrderAddress && (customer as any).address) {
      mutableOrder.customerAddress = (customer as any).address;
    }
  }

  if (!mutableOrder.customerName) {
    throw new Error(`Customer name is required before generating an invoice for ${order.orderNumber}`);
  }

  if (!mutableOrder.customerPhone) {
    throw new Error(`Customer phone is required before generating an invoice for ${order.orderNumber}`);
  }

  const context = await businessConfigService.resolveInvoiceContext({
    storeId: mutableOrder.storeId || null,
    storeCode: mutableOrder.storeCode || null,
    templateId: templateId || mutableOrder.invoiceTemplateId || null,
    templateKey: null,
  });

  return {
    order: mutableOrder,
    businessProfile: context.businessProfile,
    store: context.store,
    template: context.template,
  };
}

async function buildInvoiceBuffer(context: EnrichedInvoiceOrder): Promise<Buffer> {
  const { order, template } = context;
  const templateConfig = getTemplateConfig(template);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;
  const contentWidth = pageWidth - (margin * 2);
  const accent: [number, number, number] = [10, 174, 132];
  const accentDark: [number, number, number] = [15, 118, 110];
  const ink: [number, number, number] = [17, 24, 39];
  const slate: [number, number, number] = [100, 116, 139];
  const line: [number, number, number] = [226, 232, 240];
  const tableHeader: [number, number, number] = [15, 23, 42];

  const items = toLineItems(order.items);
  const subtotalFromItems = items.reduce((sum, item) => sum + item.total, 0);
  const extraCharges = coerceNumber(order.extraCharges, 0);
  const deliveryCharges = coerceNumber(order.deliveryCharges, 0);
  const discountValue = coerceNumber(order.discountValue, 0);
  const gstAmount = coerceNumber(order.gstAmount, 0);
  const total = coerceNumber(order.totalAmount, subtotalFromItems + extraCharges + deliveryCharges + gstAmount - discountValue);
  const subtotal = subtotalFromItems;
  const dueDate = order.pickupDate || order.createdAt;
  const displayAddress = parseAddress(order.deliveryAddress || order.shippingAddress || order.customerAddress || order.address);
  const logoDataUri = await loadLogoDataUri();
  const paymentQr = templateConfig.showPaymentQr
    ? await QRCode.toDataURL(buildPaymentQrPayload(context, total, order.orderNumber)).catch(() => null)
    : null;

  const drawCard = (x: number, y: number, width: number, height: number) => {
    doc.setDrawColor(...line);
    doc.setFillColor(255, 255, 255);
    (doc as any).roundedRect(x, y, width, height, 5, 5, 'FD');
  };

  const splitText = (text: string, width: number) => text ? doc.splitTextToSize(text, width) : [];

  doc.setFillColor(...accent);
  doc.rect(0, 0, pageWidth, 45, 'F');

  drawCard(8, 7, 34, 16);
  if (logoDataUri) {
    doc.addImage(logoDataUri, 'PNG', 10, 9, 30, 12);
  } else {
    doc.setTextColor(...accentDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Fab Clean', 25, 17, { align: 'center' });
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(getStoreName(context), 46, 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Premium Laundry & Dry Cleaning Services', 46, 23);

  doc.setFillColor(255, 255, 255);
  doc.setTextColor(...accentDark);
  const isEdited = (order as any).isEdited;
  const invoiceLabel = isEdited ? 'REVISED' : 'INVOICE';
  const labelWidth = isEdited ? 24 : 22;
  (doc as any).roundedRect(pageWidth - 9 - labelWidth, 7, labelWidth, 9, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(invoiceLabel, pageWidth - 9 - (labelWidth / 2), 13, { align: 'center' });
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('ORDER REF', pageWidth - 10, 25, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.text(order.orderNumber, pageWidth - 10, 35, { align: 'right' });

  let cursorY = 50;
  const columnGap = 4;
  const cardWidth = (contentWidth - columnGap) / 2;
  const fromTextWidth = cardWidth - 12;

  const fromLines = [
    getStoreName(context),
    ...splitText(getStoreAddress(context), fromTextWidth),
    getStorePhone(context),
    getStoreEmail(context),
  ].filter(Boolean);
  const billLines = [
    order.customerName,
    ...(templateConfig.showCustomerAddress ? splitText(displayAddress || 'Tamil Nadu, India', fromTextWidth) : []),
    order.customerPhone,
    order.customerEmail,
  ].filter(Boolean);

  const fromHeight = Math.max(38, 16 + (fromLines.length * 6));
  const billHeight = Math.max(38, 16 + (billLines.length * 6));
  const infoHeight = Math.max(fromHeight, billHeight);

  drawCard(margin, cursorY, cardWidth, infoHeight);
  drawCard(margin + cardWidth + columnGap, cursorY, cardWidth, infoHeight);

  doc.setTextColor(...slate);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('FROM', margin + 5, cursorY + 8);
  doc.setTextColor(...accentDark);
  doc.text('BILL TO', margin + cardWidth + columnGap + 5, cursorY + 8);

  doc.setTextColor(...ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(fromLines[0], margin + 10, cursorY + 17);
  doc.text(billLines[0], margin + cardWidth + columnGap + 10, cursorY + 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let lineY = cursorY + 24;
  fromLines.slice(1).forEach((lineText) => {
    doc.text(String(lineText), margin + 10, lineY);
    lineY += 5.5;
  });

  lineY = cursorY + 24;
  billLines.slice(1).forEach((lineText) => {
    doc.text(String(lineText), margin + cardWidth + columnGap + 10, lineY);
    lineY += 5.5;
  });

  cursorY += infoHeight + 5;
  const smallCardHeight = 18;
  drawCard(margin, cursorY, cardWidth, smallCardHeight);
  drawCard(margin + cardWidth + columnGap, cursorY, cardWidth, smallCardHeight);
  doc.setTextColor(...slate);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('ISSUED ON', margin + 10, cursorY + 7.5);
  doc.text('DUE / PICKUP', margin + cardWidth + columnGap + 10, cursorY + 7.5);
  doc.setTextColor(...ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(formatHeroDate(order.createdAt), margin + 10, cursorY + 14);
  doc.text(formatHeroDate(dueDate), margin + cardWidth + columnGap + 10, cursorY + 14);

  cursorY += smallCardHeight + 4;
  drawCard(margin, cursorY, contentWidth, 18);
  doc.setTextColor(...slate);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('FULFILLMENT METHOD', margin + 10, cursorY + 7.5);
  doc.setTextColor(...ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(order.fulfillmentType === 'delivery' ? 'Home Delivery' : 'Store Pickup', margin + 10, cursorY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Status: ${safeText(order.status, 'pending')}`, pageWidth - 10, cursorY + 14, { align: 'right' });

  cursorY += 24;
  doc.setFillColor(...tableHeader);
  (doc as any).roundedRect(margin, cursorY, contentWidth, 12, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('#', margin + 4, cursorY + 7.5);
  doc.text('DESCRIPTION', margin + 18, cursorY + 7.5);
  doc.text('QTY', pageWidth - 66, cursorY + 7.5, { align: 'right' });
  doc.text('RATE', pageWidth - 36, cursorY + 7.5, { align: 'right' });
  doc.text('AMOUNT', pageWidth - 10, cursorY + 7.5, { align: 'right' });
  cursorY += 14;

  doc.setTextColor(...ink);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  items.forEach((item, index) => {
    const descriptionLines = splitText(item.note ? `${item.name} (${item.note})` : item.name, contentWidth - 82);
    const rowHeight = Math.max(14, 8 + (descriptionLines.length * 4.5));

    if (cursorY + rowHeight > pageHeight - 88) {
      doc.addPage();
      cursorY = 18;
    }

    doc.setFillColor(index % 2 === 0 ? 255 : 249, index % 2 === 0 ? 255 : 251, index % 2 === 0 ? 255 : 253);
    doc.setDrawColor(...line);
    doc.rect(margin, cursorY - 4, contentWidth, rowHeight, 'FD');

    doc.setTextColor(...slate);
    doc.text(String(item.lineNo), margin + 4, cursorY + 3);
    doc.setTextColor(...ink);
    doc.setFont('helvetica', 'bold');
    doc.text(descriptionLines[0], margin + 18, cursorY + 3);
    if (descriptionLines.length > 1) {
      doc.setFont('helvetica', 'normal');
      doc.text(descriptionLines.slice(1), margin + 18, cursorY + 7.5);
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentDark);
    doc.text(String(item.quantity), pageWidth - 66, cursorY + 3, { align: 'right' });
    doc.setTextColor(...slate);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(item.unitPrice), pageWidth - 36, cursorY + 3, { align: 'right' });
    doc.setTextColor(...ink);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.total), pageWidth - 10, cursorY + 3, { align: 'right' });

    cursorY += rowHeight;
  });

  cursorY += 4;
  const footerTop = Math.max(cursorY, pageHeight - 82);
  const qrBoxWidth = 94;
  const totalBoxWidth = contentWidth - qrBoxWidth - 4;

  drawCard(margin, footerTop, qrBoxWidth, 34);
  drawCard(margin + qrBoxWidth + 4, footerTop, totalBoxWidth, 46);

  if (paymentQr) {
    doc.addImage(paymentQr, 'PNG', margin + 7, footerTop + 6, 24, 24);
  }

  doc.setTextColor(...accentDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(templateConfig.paymentQrLabel || 'Scan to Pay', margin + 36, footerTop + 11);
  doc.setTextColor(...slate);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('UPI / GPay / PhonePe', margin + 36, footerTop + 18);
  doc.text(getStoreName(context), margin + 36, footerTop + 25);

  const totalsX = margin + qrBoxWidth + 10;
  const valueX = pageWidth - 12;
  doc.setTextColor(...ink);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let totalsY = footerTop + 10;
  doc.text('Subtotal', totalsX, totalsY);
  doc.text(formatCurrency(subtotal), valueX, totalsY, { align: 'right' });
  totalsY += 6;

  if (discountValue > 0) {
    doc.text('Discount', totalsX, totalsY);
    doc.text(`-${formatCurrency(discountValue)}`, valueX, totalsY, { align: 'right' });
    totalsY += 6;
  }

  if (deliveryCharges > 0) {
    doc.text('Delivery', totalsX, totalsY);
    doc.text(formatCurrency(deliveryCharges), valueX, totalsY, { align: 'right' });
    totalsY += 6;
  }

  if (extraCharges > 0) {
    doc.text('Extra Charges', totalsX, totalsY);
    doc.text(formatCurrency(extraCharges), valueX, totalsY, { align: 'right' });
    totalsY += 6;
  }

  if (coerceNumber(order.gstAmount, 0) > 0 && (order.gstEnabled || templateConfig.showGstBreakup)) {
    doc.text(`GST (${coerceNumber(order.gstRate, 0).toFixed(0)}%)`, totalsX, totalsY);
    doc.text(formatCurrency(gstAmount), valueX, totalsY, { align: 'right' });
    totalsY += 6;
  }

  doc.setDrawColor(...accentDark);
  doc.setLineWidth(0.7);
  doc.line(totalsX, totalsY, valueX, totalsY);
  totalsY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('GRAND TOTAL', totalsX, totalsY);
  doc.setTextColor(...accentDark);
  doc.setFontSize(28);
  doc.text(formatCurrency(total), valueX, totalsY + 1, { align: 'right' });
  doc.setTextColor(...slate);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.text(currencyToWords(total), valueX, totalsY + 10, { align: 'right' });

  const termsTop = footerTop + 40;
  drawCard(margin, termsTop, qrBoxWidth, 36);
  doc.setTextColor(...accentDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TERMS & CONDITIONS', margin + 5, termsTop + 10);
  doc.setTextColor(...ink);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const termLines = splitText(
    templateConfig.termsAndConditions ||
      [
        '1. Payment due on delivery or pickup.',
        '2. We are not responsible for natural wear and tear.',
        '3. Review garments at the time of handover.',
        `4. Order status: ${safeText(order.status, 'pending')}.`,
      ].join(' '),
    qrBoxWidth - 10
  );
  doc.text(termLines.slice(0, 6), margin + 5, termsTop + 17);

  doc.setFillColor(...tableHeader);
  doc.rect(0, pageHeight - 16, pageWidth, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Thank you for choosing ${getStoreName(context)}`, 8, pageHeight - 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('This is a computer-generated invoice. No signature required.', pageWidth - 8, pageHeight - 6, { align: 'right' });

  return Buffer.from(doc.output('arraybuffer'));
}

export async function generateAndStoreInvoice(orderId: string, templateId?: string): Promise<StoredInvoiceResult> {
  let uploadedUrl: string | null = null;

  try {
    const context = await hydrateOrderForInvoice(orderId, templateId);
    const pdfBuffer = await buildInvoiceBuffer(context);
    const filename = escapeFilename(`invoice-${context.order.orderNumber}-${Date.now()}.pdf`);
    const upload = await uploadInvoiceBuffer(filename, pdfBuffer);

    uploadedUrl = upload.fileUrl;

    const updatedOrder = await db.updateOrder(orderId, {
      invoiceUrl: upload.fileUrl,
      appliedTemplateId: context.template?.id || null,
      whatsappBillStatus: 'pending',
    } as any);

    if (!updatedOrder) {
      throw new Error('Database verification failed. Order not found after invoice upload.');
    }

    try {
      await db.createDocument({
        franchiseId: context.order.franchiseId || null,
        storeId: context.store?.id || context.order.storeId || null,
        type: 'invoice',
        title: `Invoice ${context.order.orderNumber}`,
        filename,
        filepath: upload.filepath,
        fileUrl: upload.fileUrl,
        status: 'draft',
        amount: String(coerceNumber(context.order.totalAmount, 0)),
        customerName: context.order.customerName,
        orderNumber: context.order.orderNumber,
        templateKey: context.template?.templateKey || null,
        metadata: {
          storage: upload.storageUsed,
          appliedTemplateId: context.template?.id || null,
          appliedTemplateKey: context.template?.templateKey || null,
          generatedAt: new Date().toISOString(),
          invoiceVersion: 'verified-pipeline-v1',
        },
      });
    } catch (documentError) {
      console.warn('[Order Invoice] Invoice document record creation failed:', documentError);
    }

    return {
      invoiceUrl: upload.fileUrl,
      filepath: upload.filepath,
      storageUsed: upload.storageUsed,
      appliedTemplateId: context.template?.id || null,
      templateKey: context.template?.templateKey || null,
      order: context.order,
    };
  } catch (error) {
    if (uploadedUrl) {
      console.warn(`[Order Invoice] Rolling back uploaded invoice ${uploadedUrl}`);
      await deleteFromInvoiceStorage(uploadedUrl);
    }
    throw error;
  }
}

async function cleanupOrderInvoiceState(orderId: string, invoiceUrl?: string | null) {
  if (invoiceUrl) {
    await deleteFromInvoiceStorage(invoiceUrl).catch(() => false);
  }

  await db.updateOrder(orderId, {
    invoiceUrl: null,
    appliedTemplateId: null,
    whatsappBillStatus: 'pending',
  } as any).catch(() => undefined);
}

export async function processOrderBillingPipeline(orderId: string, retryCount = 0): Promise<{
  success: boolean;
  invoiceUrl?: string;
  error?: string;
}> {
  try {
    const generated = await generateAndStoreInvoice(orderId);
    const currentOrder = await db.getOrder(orderId);
    const currentCount = Number((currentOrder as any)?.whatsappMessageCount || 0);

    const waResult = await sendInvoiceWhatsAppBatch([
      generated.order.customerPhone,
      generated.order.secondaryPhone,
    ], {
      pdfUrl: generated.invoiceUrl,
      filename: `Invoice-${generated.order.orderNumber}.pdf`,
      customerName: generated.order.customerName,
      invoiceNumber: generated.order.orderNumber,
      amount: coerceNumber(generated.order.totalAmount, 0).toFixed(2),
      itemName: smartItemSummary(generated.order.items as any) || 'Laundry Services',
      templateType: 'order',
    });

    if (!waResult.success) {
      throw new Error(waResult.error || 'WhatsApp delivery rejected or failed');
    }

    await db.updateOrder(orderId, {
      whatsappBillStatus: 'sent',
      lastWhatsappStatus: 'Invoice sent',
      lastWhatsappSentAt: new Date(),
      whatsappMessageCount: currentCount + 1,
    } as any);

    return {
      success: true,
      invoiceUrl: generated.invoiceUrl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown billing pipeline error';

    if (retryCount < MAX_PIPELINE_RETRIES) {
      const order = await db.getOrder(orderId);
      await cleanupOrderInvoiceState(orderId, (order as any)?.invoiceUrl || null);
      await sleep(RETRY_DELAY_MS);
      return processOrderBillingPipeline(orderId, retryCount + 1);
    }

    await db.updateOrder(orderId, {
      whatsappBillStatus: 'failed',
      lastWhatsappStatus: `Invoice failed: ${errorMessage}`,
    } as any).catch(() => undefined);

    return {
      success: false,
      error: `Pipeline exhausted retries: ${errorMessage}`,
    };
  }
}

export async function ensureOrderInvoiceDocument(order: OrderLike): Promise<{
  fileUrl: string;
  filepath: string;
  storageUsed: 'r2' | 'local';
  reused: boolean;
}> {
  if (order.invoiceUrl) {
    return {
      fileUrl: order.invoiceUrl,
      filepath: order.invoiceUrl,
      storageUsed: order.invoiceUrl.includes('/uploads/') ? 'local' : 'r2',
      reused: true,
    };
  }

  if (!order.id) {
    throw new Error('Order ID is required to generate an invoice');
  }

  const stored = await generateAndStoreInvoice(order.id, order.invoiceTemplateId || undefined);
  return {
    fileUrl: stored.invoiceUrl,
    filepath: stored.filepath,
    storageUsed: stored.storageUsed,
    reused: false,
  };
}
