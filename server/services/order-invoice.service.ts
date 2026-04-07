import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { db } from '../db';
import { LocalStorage } from './local-storage';
import { R2Storage } from './r2-storage';

const APP_BASE_URL = (process.env.APP_BASE_URL || 'https://erp.myfabclean.com').replace(/\/$/, '');
const INVOICE_PUBLIC_BASE_URL = (process.env.R2_INVOICE_PUBLIC_BASE_URL || 'https://bill.myfabclean.com').replace(/\/$/, '');

type OrderLike = {
  id: string;
  orderNumber: string;
  franchiseId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  totalAmount?: string | number | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  status?: string | null;
  invoiceUrl?: string | null;
  createdAt?: string | Date | null;
  deliveryAddress?: any;
  shippingAddress?: any;
  customerAddress?: any;
  address?: any;
  items?: Array<{
    serviceName?: string;
    service_name?: string;
    customName?: string;
    name?: string;
    quantity?: number | string;
    price?: string | number;
    unitPrice?: string | number;
    total?: string | number;
    subtotal?: string | number;
  }> | null;
};

const coerceNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const escapeFilename = (value: string): string =>
  String(value || 'invoice').replace(/[^a-zA-Z0-9._-]/g, '_');

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

const parseAddress = (value: unknown): string => {
  if (!value) return 'Address not provided';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 'Address not provided';
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

    return parts.length > 0 ? parts.join(', ') : 'Address not provided';
  }

  return 'Address not provided';
};

const normalizeInvoiceUrl = (doc: any): string | null => {
  const rawUrl = doc?.fileUrl || doc?.file_url;
  const filepath = doc?.filepath || doc?.file_path || doc?.metadata?.filepath;

  if (rawUrl && typeof rawUrl === 'string') {
    if (rawUrl.includes('.r2.cloudflarestorage.com/')) {
      const objectPath = rawUrl.split('.r2.cloudflarestorage.com/')[1] || '';
      return `${INVOICE_PUBLIC_BASE_URL}/${objectPath.replace(/^invoice-pdf\//, '')}`;
    }
    return rawUrl;
  }

  if (filepath && typeof filepath === 'string') {
    return `${INVOICE_PUBLIC_BASE_URL}/${filepath.replace(/^invoice-pdf\//, '')}`;
  }

  return null;
};

const buildInvoiceBuffer = async (order: OrderLike): Promise<Buffer> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 14;
  const marginRight = 14;
  const usableWidth = pageWidth - marginLeft - marginRight;
  let cursorY = 18;

  const items = Array.isArray(order.items) ? order.items : [];
  const normalizedItems = items.map((item, index) => {
    const quantity = Math.max(1, Math.round(coerceNumber(item?.quantity, 1)));
    const unitPrice = coerceNumber(item?.unitPrice ?? item?.price, 0);
    const total = coerceNumber(item?.total ?? item?.subtotal, unitPrice * quantity);

    return {
      lineNo: index + 1,
      name: String(
        item?.serviceName ||
          item?.service_name ||
          item?.customName ||
          item?.name ||
          'Laundry Service'
      ).trim(),
      quantity,
      unitPrice,
      total,
    };
  });

  const orderTotal = coerceNumber(
    order.totalAmount,
    normalizedItems.reduce((sum, item) => sum + item.total, 0)
  );
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.total, 0) || orderTotal;
  const customerAddress = parseAddress(
    order.deliveryAddress || order.shippingAddress || order.customerAddress || order.address
  );
  const paymentQr = await QRCode.toDataURL(
    `upi://pay?pa=fabclean@ybl&pn=Fab%20Clean&am=${Math.max(orderTotal, 0).toFixed(2)}&cu=INR&tn=${encodeURIComponent(order.orderNumber)}`
  ).catch(() => null);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FAB CLEAN', marginLeft, cursorY);
  doc.setFontSize(10);
  doc.text('Premium Laundry & Dry Cleaning Services', marginLeft, cursorY + 6);

  doc.setFontSize(12);
  doc.text('INVOICE', pageWidth - marginRight, cursorY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Invoice: ${order.orderNumber}`, pageWidth - marginRight, cursorY + 6, { align: 'right' });
  doc.text(`Date: ${formatDisplayDate(order.createdAt)}`, pageWidth - marginRight, cursorY + 11, { align: 'right' });

  cursorY += 18;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(marginLeft, cursorY, pageWidth - marginRight, cursorY);
  cursorY += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BILL TO', marginLeft, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const displayName = order.customerName && order.customerName !== 'Customer' ? order.customerName : 'Customer';
  const displayPhone = order.customerPhone && order.customerPhone !== 'Phone not provided' ? order.customerPhone : '';
  const displayEmail = order.customerEmail || '';
  doc.text(displayName, marginLeft, cursorY + 6);
  if (displayPhone) {
    doc.text(displayPhone, marginLeft, cursorY + 11);
  }
  let billToOffsetY = displayPhone ? 16 : 11;
  if (displayEmail) {
    doc.text(displayEmail, marginLeft, cursorY + billToOffsetY);
    billToOffsetY += 5;
  }
  if (customerAddress && customerAddress !== 'Address not provided') {
    const addressLines = doc.splitTextToSize(customerAddress, usableWidth * 0.55);
    doc.text(addressLines, marginLeft, cursorY + billToOffsetY);
    billToOffsetY += addressLines.length * 4.5;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('STATUS', pageWidth - marginRight - 38, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.text(String(order.status || 'pending').toUpperCase(), pageWidth - marginRight - 38, cursorY + 6);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT', pageWidth - marginRight - 38, cursorY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(String(order.paymentStatus || order.paymentMethod || 'pending').toUpperCase(), pageWidth - marginRight - 38, cursorY + 20);

  cursorY += Math.max(30, billToOffsetY + 4);
  doc.line(marginLeft, cursorY, pageWidth - marginRight, cursorY);
  cursorY += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ITEM', marginLeft, cursorY);
  doc.text('QTY', pageWidth - marginRight - 62, cursorY, { align: 'right' });
  doc.text('RATE', pageWidth - marginRight - 34, cursorY, { align: 'right' });
  doc.text('TOTAL', pageWidth - marginRight, cursorY, { align: 'right' });
  cursorY += 4;
  doc.line(marginLeft, cursorY, pageWidth - marginRight, cursorY);
  cursorY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const linesToRender = normalizedItems.length > 0 ? normalizedItems : [{
    lineNo: 1,
    name: 'Laundry Service',
    quantity: 1,
    unitPrice: orderTotal,
    total: orderTotal,
  }];

  for (const item of linesToRender) {
    const itemLines = doc.splitTextToSize(item.name, usableWidth - 68);
    if (cursorY > pageHeight - 52) {
      doc.addPage();
      cursorY = 20;
    }
    doc.text(itemLines, marginLeft, cursorY);
    doc.text(String(item.quantity), pageWidth - marginRight - 62, cursorY, { align: 'right' });
    doc.text(formatCurrency(item.unitPrice), pageWidth - marginRight - 34, cursorY, { align: 'right' });
    doc.text(formatCurrency(item.total), pageWidth - marginRight, cursorY, { align: 'right' });
    cursorY += Math.max(8, itemLines.length * 4.5);
  }

  cursorY += 2;
  doc.line(marginLeft, cursorY, pageWidth - marginRight, cursorY);
  cursorY += 8;

  const totalsXLabel = pageWidth - marginRight - 55;
  const totalsXValue = pageWidth - marginRight;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal', totalsXLabel, cursorY);
  doc.text(formatCurrency(subtotal), totalsXValue, cursorY, { align: 'right' });
  cursorY += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total', totalsXLabel, cursorY);
  doc.text(formatCurrency(orderTotal), totalsXValue, cursorY, { align: 'right' });

  cursorY += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Payment options', marginLeft, cursorY);
  doc.setFont('helvetica', 'normal');
  const footerLines = doc.splitTextToSize(
    `Use the QR code to pay instantly or visit ${APP_BASE_URL}/trackorder/${encodeURIComponent(order.orderNumber)} to track your order.`,
    usableWidth - 28
  );
  doc.text(footerLines, marginLeft, cursorY + 6);

  if (paymentQr) {
    doc.addImage(paymentQr, 'PNG', pageWidth - marginRight - 24, cursorY, 24, 24);
  }

  doc.setFontSize(9);
  doc.text('Thank you for choosing Fab Clean.', marginLeft, pageHeight - 12);

  return Buffer.from(doc.output('arraybuffer'));
};

const findExistingInvoiceDocument = async (orderNumber: string) => {
  const documents = await db.listDocuments({ type: 'invoice', limit: 250 });
  return documents.find((doc: any) =>
    String(doc.orderNumber || doc.order_number || '') === String(orderNumber) ||
    String(doc?.metadata?.orderNumber || '') === String(orderNumber)
  );
};

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

  const existingDoc = await findExistingInvoiceDocument(order.orderNumber);
  const existingUrl = existingDoc ? normalizeInvoiceUrl(existingDoc) : null;
  if (existingDoc && existingUrl) {
    await db.updateOrder(order.id, { invoiceUrl: existingUrl } as any).catch(() => undefined);
    return {
      fileUrl: existingUrl,
      filepath: existingDoc.filepath || existingDoc.file_path || existingDoc.metadata?.filepath || existingUrl,
      storageUsed: existingUrl.includes('/uploads/') ? 'local' : 'r2',
      reused: true,
    };
  }

  // ----- CRITICAL: Fetch full customer data from DB -----
  // The order object may not carry complete customer info (name, phone, email, address).
  // We MUST fetch from the database to ensure the invoice has all mandatory fields.
  const customerId = (order as any).customerId || (order as any).customer_id;
  if (customerId) {
    try {
      const customer = await db.getCustomer(customerId);
      if (customer) {
        // Merge customer data — order-level fields take priority, then DB data
        if (!order.customerName || order.customerName === 'Customer') {
          order.customerName = (customer as any).name || order.customerName;
        }
        if (!order.customerPhone || order.customerPhone === 'Phone not provided') {
          order.customerPhone = (customer as any).phone || order.customerPhone;
        }
        if (!order.customerEmail) {
          order.customerEmail = (customer as any).email || null;
        }
        // Address: try customer address if order has no address
        const hasOrderAddress = order.deliveryAddress || order.shippingAddress || order.customerAddress || order.address;
        if (!hasOrderAddress) {
          const customerAddr = (customer as any).address || (customer as any).deliveryAddress;
          if (customerAddr) {
            order.customerAddress = customerAddr;
          }
        }
      }
    } catch (customerFetchError) {
      console.warn(`⚠️ [Order Invoice] Could not fetch customer ${customerId}:`, customerFetchError);
    }
  }

  // Validate mandatory fields before generating the invoice
  if (!order.customerName || order.customerName === 'Customer') {
    console.warn(`⚠️ [Order Invoice] Customer name missing for ${order.orderNumber}, using order data as-is`);
  }
  if (!order.customerPhone) {
    console.warn(`⚠️ [Order Invoice] Customer phone missing for ${order.orderNumber}, using order data as-is`);
  }

  const pdfBuffer = await buildInvoiceBuffer(order);
  const filename = escapeFilename(`invoice-${order.orderNumber}-${Date.now()}.pdf`);

  let filepath = '';
  let fileUrl = '';
  let storageUsed: 'r2' | 'local' = 'r2';

  try {
    const upload = await R2Storage.uploadDocumentPdf(filename, pdfBuffer);
    filepath = upload.key;
    fileUrl = upload.url;
  } catch (r2Error) {
    console.error(`❌ [Order Invoice] R2 upload failed for ${order.orderNumber}:`, r2Error instanceof Error ? r2Error.message : String(r2Error));
    filepath = await LocalStorage.saveInvoicePdf(order.orderNumber, pdfBuffer);
    fileUrl = `${APP_BASE_URL}${filepath}`;
    storageUsed = 'local';
  }

  await db.createDocument({
    franchiseId: order.franchiseId || null,
    type: 'invoice',
    title: `Invoice ${order.orderNumber}`,
    filename,
    fileUrl,
    status: 'generated',
    amount: String(coerceNumber(order.totalAmount, 0)),
    customerName: order.customerName || null,
    orderNumber: order.orderNumber,
    metadata: {
      filepath,
      storage: storageUsed,
      generatedBy: 'server-order-create',
      uploadedAt: new Date().toISOString(),
    },
  });

  await db.updateOrder(order.id, { invoiceUrl: fileUrl } as any);

  return {
    fileUrl,
    filepath,
    storageUsed,
    reused: false,
  };
}
