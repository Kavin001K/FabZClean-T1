import React from 'react';
import { DEFAULT_COMPANY_INFO, getFranchiseById } from './franchise-config';
import { normalizeOrderStoreCode } from './order-store';

export const THERMAL_TAG_WIDTH_MM = 36;
export const THERMAL_TAG_HEIGHT_MM = 23;
const THERMAL_TAG_STACK_PADDING_MM = 0.2;

export interface ThermalTagItem {
  orderNumber: string;
  serviceName: string;
  tagNote?: string;
  quantity: number;
  customerName?: string;
  storeCode?: string;
  dueDate?: string;
}

export interface ThermalTagSource {
  orderNumber: string;
  customerName?: string;
  franchiseId?: string | null;
  storeCode?: string;
  commonNote?: string;
  dueDate?: string;
  items: ThermalTagItem[];
}

export interface PreparedThermalTag {
  id: string;
  shortOrderId: string;
  customerText: string;
  branchText: string;
  serviceText: string;
  noteText: string;
  dueText: string;
  countText: string;
  customerFontMm: number;
  serviceFontMm: number;
  noteFontMm: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeText = (value: string | undefined | null, fallback: string) => {
  const raw = String(value || fallback).replace(/\s+/g, ' ').trim();
  return raw ? raw.toUpperCase() : fallback.toUpperCase();
};

const fitUppercaseText = (
  value: string | undefined | null,
  fallback: string,
  config: {
    baseFontMm: number;
    minFontMm: number;
    shrinkStart: number;
    shrinkStepChars: number;
    shrinkFactor: number;
    maxCharsAtMin: number;
  }
) => {
  const normalized = normalizeText(value, fallback);
  const overflowChars = Math.max(0, normalized.length - config.shrinkStart);
  const steps = Math.ceil(overflowChars / config.shrinkStepChars);
  const fontSizeMm = clamp(
    config.baseFontMm - (steps * config.shrinkFactor),
    config.minFontMm,
    config.baseFontMm
  );

  const text = normalized.length > config.maxCharsAtMin
    ? `${normalized.slice(0, Math.max(1, config.maxCharsAtMin - 1)).trim()}…`
    : normalized;

  return { text, fontSizeMm };
};

const formatShortOrderId = (orderNumber: string) => normalizeText(orderNumber.slice(-5), orderNumber);

const formatDueDate = (dueDate?: string) => {
  if (!dueDate) return '—';
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    return normalizeText(dueDate, '—');
  }

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = parsed.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
  return `${day}\\${month}`;
};

const resolveBranchText = (franchiseId?: string | null, storeCode?: string) => {
  const franchise = franchiseId ? getFranchiseById(franchiseId) : DEFAULT_COMPANY_INFO;
  const normalizedStoreCode = normalizeOrderStoreCode(storeCode);
  const branchCode = normalizedStoreCode || normalizeText(franchise.branchCode, franchise.branchCode);
  return `FAB CLEAN (${branchCode})`;
};

export const prepareThermalTags = ({
  orderNumber,
  customerName,
  franchiseId,
  storeCode,
  commonNote,
  dueDate,
  items,
}: ThermalTagSource): PreparedThermalTag[] => {
  const shortOrderId = formatShortOrderId(orderNumber);
  const branchText = resolveBranchText(franchiseId, storeCode);
  const customerFit = fitUppercaseText(customerName, 'CUSTOMER', {
    baseFontMm: 2.6,
    minFontMm: 1.9,
    shrinkStart: 8,
    shrinkStepChars: 3,
    shrinkFactor: 0.22,
    maxCharsAtMin: 16,
  });
  const dueText = formatDueDate(dueDate);

  return items.flatMap((item, itemIndex) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const serviceFit = fitUppercaseText(item.serviceName, 'SERVICE', {
      baseFontMm: 4.2,
      minFontMm: 2.7,
      shrinkStart: 10,
      shrinkStepChars: 3,
      shrinkFactor: 0.28,
      maxCharsAtMin: 20,
    });
    const noteFit = fitUppercaseText(item.tagNote || commonNote || '', '', {
      baseFontMm: 2.8,
      minFontMm: 1.9,
      shrinkStart: 12,
      shrinkStepChars: 4,
      shrinkFactor: 0.22,
      maxCharsAtMin: 24,
    });

    return Array.from({ length: quantity }, (_, tagIndex) => ({
      id: `${orderNumber}-${itemIndex}-${tagIndex}`,
      shortOrderId,
      customerText: customerFit.text,
      branchText,
      serviceText: serviceFit.text,
      noteText: noteFit.text || ' ',
      dueText,
      countText: `${tagIndex + 1}\\${quantity}`,
      customerFontMm: customerFit.fontSizeMm,
      serviceFontMm: serviceFit.fontSizeMm,
      noteFontMm: noteFit.fontSizeMm,
    }));
  });
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const getThermalTagPrintStyles = (pageHeightMm: number) => `
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #000000;
    width: var(--thermal-page-width-mm);
    min-width: var(--thermal-page-width-mm);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: "Arial Black", Arial, Helvetica, sans-serif;
  }

  .no-print {
    display: block;
  }

  .thermal-page {
    width: var(--thermal-page-width-mm);
    min-height: var(--thermal-page-height-mm);
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .thermal-tag {
    width: ${THERMAL_TAG_WIDTH_MM}mm;
    height: ${THERMAL_TAG_HEIGHT_MM}mm;
    min-height: ${THERMAL_TAG_HEIGHT_MM}mm;
    max-height: ${THERMAL_TAG_HEIGHT_MM}mm;
    padding: 1.2mm 1.4mm 1.1mm 1.4mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    break-inside: avoid;
    page-break-inside: avoid;
    overflow: hidden;
    background: #ffffff;
  }

  .tag-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1mm;
    min-height: 3.4mm;
    overflow: hidden;
  }

  .short-id {
    font-size: 2.8mm;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 0.05mm;
    white-space: nowrap;
    color: #000000;
  }

  .customer {
    line-height: 1;
    font-weight: 900;
    letter-spacing: 0.04mm;
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #000000;
    max-width: 18.5mm;
  }

  .divider {
    border-top: 0.45mm dashed #000000;
    width: 100%;
    margin: 0;
  }

  .branch {
    font-size: 2.25mm;
    line-height: 1.05;
    font-weight: 900;
    letter-spacing: 0.03mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #000000;
    padding-top: 0.35mm;
  }

  .service {
    line-height: 1;
    font-weight: 900;
    text-align: center;
    letter-spacing: 0.05mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #000000;
    padding-top: 0.3mm;
  }

  .note {
    line-height: 1;
    font-weight: 900;
    text-align: center;
    letter-spacing: 0.03mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #000000;
    min-height: 2.8mm;
  }

  .tag-footer {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1mm;
    min-height: 3.4mm;
    padding-top: 0.2mm;
  }

  .due {
    font-size: 2.45mm;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 0.03mm;
    color: #000000;
    white-space: nowrap;
  }

  .count {
    font-size: 3mm;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 0.05mm;
    color: #000000;
    white-space: nowrap;
  }

  @media print {
    @page {
      size: ${THERMAL_TAG_WIDTH_MM}mm ${pageHeightMm}mm;
      margin: 0;
    }

    .no-print {
      display: none !important;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: var(--thermal-page-width-mm) !important;
      min-width: var(--thermal-page-width-mm) !important;
      height: var(--thermal-page-height-mm) !important;
      min-height: var(--thermal-page-height-mm) !important;
      overflow: hidden !important;
    }

    .thermal-page {
      min-height: var(--thermal-page-height-mm) !important;
    }
  }
`;

export const getThermalTagStripHeightMm = (tagCount: number) =>
  Math.max(THERMAL_TAG_HEIGHT_MM, (Math.max(1, tagCount) * THERMAL_TAG_HEIGHT_MM) + THERMAL_TAG_STACK_PADDING_MM);

export const buildThermalTagPrintHtml = (tags: PreparedThermalTag[], title: string) => {
  const pageHeightMm = getThermalTagStripHeightMm(tags.length);
  const tagsHtml = tags.map((tag) => `
    <div class="thermal-tag">
      <div class="tag-top">
        <span class="short-id">${escapeHtml(tag.shortOrderId)}</span>
        <span class="customer" style="font-size:${tag.customerFontMm}mm;">${escapeHtml(tag.customerText)}</span>
      </div>
      <div class="divider"></div>
      <div class="branch">${escapeHtml(tag.branchText)}</div>
      <div class="service" style="font-size:${tag.serviceFontMm}mm;">${escapeHtml(tag.serviceText)}</div>
      <div class="note" style="font-size:${tag.noteFontMm}mm;">${escapeHtml(tag.noteText)}</div>
      <div class="divider"></div>
      <div class="tag-footer">
        <span class="due">${escapeHtml(tag.dueText)}</span>
        <span class="count">${escapeHtml(tag.countText)}</span>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
      <style>${getThermalTagPrintStyles(pageHeightMm)}</style>
    </head>
    <body style="--thermal-page-width-mm:${THERMAL_TAG_WIDTH_MM}mm;--thermal-page-height-mm:${pageHeightMm}mm;">
      <div class="no-print" style="padding:4mm 0;text-align:center;width:${THERMAL_TAG_WIDTH_MM}mm;">
        <button onclick="window.print()" style="font:900 12px Arial,sans-serif;padding:8px 12px;border:1px solid #000;background:#fff;color:#000;cursor:pointer;">
          PRINT TAGS
        </button>
      </div>
      <div class="thermal-page">
        ${tagsHtml}
      </div>
      <script>
        window.onload = function () {
          setTimeout(function () {
            window.print();
          }, 400);
        };
      </script>
    </body>
  </html>`;
};

export function ThermalTagLabel({ tag }: { tag: PreparedThermalTag }) {
  return (
    <div
      className="bg-white text-black overflow-hidden"
      style={{
        width: `${THERMAL_TAG_WIDTH_MM}mm`,
        height: `${THERMAL_TAG_HEIGHT_MM}mm`,
        minHeight: `${THERMAL_TAG_HEIGHT_MM}mm`,
        maxHeight: `${THERMAL_TAG_HEIGHT_MM}mm`,
        padding: '1.2mm 1.4mm 1.1mm 1.4mm',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: '"Arial Black", Arial, Helvetica, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '1mm',
          minHeight: '3.4mm',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontSize: '2.8mm',
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: '0.05mm',
            whiteSpace: 'nowrap',
          }}
        >
          {tag.shortOrderId}
        </span>
        <span
          style={{
            fontSize: `${tag.customerFontMm}mm`,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: '0.04mm',
            textAlign: 'right',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '18.5mm',
          }}
        >
          {tag.customerText}
        </span>
      </div>
      <div style={{ borderTop: '0.45mm dashed #000000', width: '100%' }} />
      <div
        style={{
          fontSize: '2.25mm',
          lineHeight: 1.05,
          fontWeight: 900,
          letterSpacing: '0.03mm',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          paddingTop: '0.35mm',
        }}
      >
        {tag.branchText}
      </div>
      <div
        style={{
          fontSize: `${tag.serviceFontMm}mm`,
          lineHeight: 1,
          fontWeight: 900,
          textAlign: 'center',
          letterSpacing: '0.05mm',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          paddingTop: '0.3mm',
        }}
      >
        {tag.serviceText}
      </div>
      <div
        style={{
          fontSize: `${tag.noteFontMm}mm`,
          lineHeight: 1,
          fontWeight: 900,
          textAlign: 'center',
          letterSpacing: '0.03mm',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minHeight: '2.8mm',
        }}
      >
        {tag.noteText}
      </div>
      <div style={{ borderTop: '0.45mm dashed #000000', width: '100%' }} />
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '1mm',
          minHeight: '3.4mm',
          paddingTop: '0.2mm',
        }}
      >
        <span
          style={{
            fontSize: '2.45mm',
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: '0.03mm',
            whiteSpace: 'nowrap',
          }}
        >
          {tag.dueText}
        </span>
        <span
          style={{
            fontSize: '3mm',
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: '0.05mm',
            whiteSpace: 'nowrap',
          }}
        >
          {tag.countText}
        </span>
      </div>
    </div>
  );
}
