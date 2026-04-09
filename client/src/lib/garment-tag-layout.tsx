import React from 'react';
import { DEFAULT_COMPANY_INFO, getFranchiseById } from './franchise-config';
import { normalizeOrderStoreCode } from './order-store';
import { DEFAULT_TAG_TEMPLATE_CONFIG, type TagTemplateConfig } from '@shared/business-config';

export const THERMAL_TAG_WIDTH_MM = 36;
export const THERMAL_TAG_HEIGHT_MM = 28;
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
  customerAddress?: unknown;
  franchiseId?: string | null;
  storeCode?: string;
  commonNote?: string;
  billDate?: string;
  dueDate?: string;
  templateConfig?: Partial<TagTemplateConfig>;
  items: ThermalTagItem[];
}

export interface PreparedThermalTag {
  id: string;
  shortOrderId: string;
  shortOrderFontMm: number;
  billText: string;
  billFontMm: number;
  customerText: string;
  branchText: string;
  serviceText: string;
  noteText: string;
  hasNote: boolean;
  dueText: string;
  countText: string;
  customerFontMm: number;
  branchFontMm: number;
  serviceFontMm: number;
  noteFontMm: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeWhitespace = (value: string | undefined | null, fallback = '') => {
  const raw = String(value || fallback).replace(/\s+/g, ' ').trim();
  return raw || fallback;
};

const normalizeText = (value: string | undefined | null, fallback: string) => {
  const raw = normalizeWhitespace(value, fallback);
  return raw ? raw.toUpperCase() : fallback.toUpperCase();
};

const formatCustomerDisplay = (customerName?: string) => {
  const fullName = normalizeWhitespace(customerName, 'CUSTOMER');
  return normalizeText(fullName, 'CUSTOMER');
};

const SECONDARY_SERVICE_RULES: Array<[RegExp, string]> = [
  [/\bDRY CLEAN ONLY\b/g, 'DCO'],
  [/\bDRY CLEAN\b/g, 'DC'],
  [/\bDRY WASH\b/g, 'DW'],
  [/\bHAND WASH\b/g, 'HW'],
  [/\bSTAIN REMOVAL\b/g, 'SR'],
  [/\bWASH AND IRON\b/g, 'WI'],
  [/\bWASH & IRON\b/g, 'WI'],
  [/\bWASH AND FOLD\b/g, 'WF'],
  [/\bWASH & FOLD\b/g, 'WF'],
  [/\bSTEAM IRON\b/g, 'SI'],
  [/\bWHITE\s*\/\s*COLOR\b/g, 'W/C'],
  [/\bWHITE\s*&\s*COLOR\b/g, 'W/C'],
  [/\bWHITE COLOR\b/g, 'W/C'],
  [/\bWHITE\b/g, 'W'],
  [/\bCOLOR\b/g, 'C'],
  [/\bCOLOUR\b/g, 'C'],
];

const compactSecondaryText = (value: string | undefined | null) => {
  let text = normalizeText(value, '');

  SECONDARY_SERVICE_RULES.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  return text
    .replace(/[()]/g, ' ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
};

const formatCompactServiceDisplay = (serviceName?: string) => {
  const normalized = normalizeText(serviceName, 'SERVICE')
    .replace(/\s+/g, ' ')
    .trim();

  const parenthesizedMatch = normalized.match(/^(.*?)\s*\((.*?)\)\s*$/);
  const beforeParen = (parenthesizedMatch?.[1] || normalized).trim();
  const inParen = (parenthesizedMatch?.[2] || '').trim();

  const headTokens = beforeParen.split(/[\/\s]+/).map((token) => token.trim()).filter(Boolean);
  const primary = headTokens[0] || 'SERVICE';

  const remainderBeforeParen = headTokens.slice(1).join(' ');
  const remainderRaw = [remainderBeforeParen, inParen].filter(Boolean).join(' ');

  const secondary = compactSecondaryText(remainderRaw)
    .split(/[\/\s]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => token !== 'ONLY' && token !== 'AND');

  if (secondary.length === 0) {
    return primary;
  }

  return `${primary}/${secondary.join('/')}`;
};

const formatCompactNoteDisplay = (value?: string) =>
  normalizeWhitespace(value, '');

const fitText = (
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
  const normalized = normalizeWhitespace(value, fallback);
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
) => fitText(normalizeText(value, fallback), fallback.toUpperCase(), config);

const formatShortOrderId = (orderNumber: string) => normalizeText(orderNumber.slice(-5), orderNumber);

const formatTagDate = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return normalizeText(value, '—');
  }

  const day = String(parsed.getDate());
  const month = parsed.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
  return `${day}/${month}`;
};

const resolveBranchText = (franchiseId?: string | null, storeCode?: string) => {
  const franchise = franchiseId ? getFranchiseById(franchiseId) : DEFAULT_COMPANY_INFO;
  const normalizedStoreCode = normalizeOrderStoreCode(storeCode);
  const branchCode = normalizedStoreCode || normalizeText(franchise.branchCode, franchise.branchCode);
  return `FAB CLEAN(${branchCode})`;
};

export const prepareThermalTags = ({
  orderNumber,
  customerName,
  franchiseId,
  storeCode,
  commonNote,
  billDate,
  dueDate,
  templateConfig,
  items,
}: ThermalTagSource): PreparedThermalTag[] => {
  const resolvedConfig = {
    ...DEFAULT_TAG_TEMPLATE_CONFIG,
    ...(templateConfig || {}),
  };
  const shortOrderId = formatShortOrderId(orderNumber);
  const shortOrderFit = fitUppercaseText(shortOrderId, shortOrderId, {
    baseFontMm: 6,
    minFontMm: 4.3,
    shrinkStart: 5,
    shrinkStepChars: 1,
    shrinkFactor: 0.34,
    maxCharsAtMin: 10,
  });
  const branchText = resolveBranchText(franchiseId, storeCode);
  const customerFit = fitText(formatCustomerDisplay(customerName), 'CUSTOMER', {
    baseFontMm: 3.1,
    minFontMm: 2.1,
    shrinkStart: 12,
    shrinkStepChars: 2,
    shrinkFactor: 0.1,
    maxCharsAtMin: 30,
  });
  const branchFit = fitUppercaseText(branchText, branchText, {
    baseFontMm: 2.3,
    minFontMm: 1.9,
    shrinkStart: 12,
    shrinkStepChars: 3,
    shrinkFactor: 0.12,
    maxCharsAtMin: 18,
  });
  const billText = formatTagDate(billDate);
  const dueText = resolvedConfig.showDueDate ? formatTagDate(dueDate) : '';
  const billFit = fitUppercaseText(`ORD ${billText}`, `ORD ${billText}`, {
    baseFontMm: 2.75,
    minFontMm: 2.15,
    shrinkStart: 7,
    shrinkStepChars: 1,
    shrinkFactor: 0.12,
    maxCharsAtMin: 12,
  });

  return items.flatMap((item, itemIndex) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const compactServiceText = resolvedConfig.showServiceName ? formatCompactServiceDisplay(item.serviceName) : '';
    const compactNoteText = resolvedConfig.showTagNote
      ? formatCompactNoteDisplay(item.tagNote || commonNote || '').slice(0, resolvedConfig.maxNoteChars || DEFAULT_TAG_TEMPLATE_CONFIG.maxNoteChars)
      : '';
    const noteFit = fitText(compactNoteText, '', {
      baseFontMm: 2.6,
      minFontMm: 2.05,
      shrinkStart: 80,
      shrinkStepChars: 4,
      shrinkFactor: 0.14,
      maxCharsAtMin: 160,
    });
    const hasNote = noteFit.text.length > 0;
    const serviceFit = fitText(compactServiceText, 'Service', hasNote
      ? {
        baseFontMm: 4.85,
        minFontMm: 2.85,
        shrinkStart: 12,
        shrinkStepChars: 3,
        shrinkFactor: 0.2,
        maxCharsAtMin: 32,
      }
      : {
        baseFontMm: 5.55,
        minFontMm: 3.2,
        shrinkStart: 14,
        shrinkStepChars: 3,
        shrinkFactor: 0.2,
        maxCharsAtMin: 40,
      });

    return Array.from({ length: quantity }, (_, tagIndex) => ({
      id: `${orderNumber}-${itemIndex}-${tagIndex}`,
      shortOrderId: resolvedConfig.showOrderNumber ? shortOrderId : '',
      shortOrderFontMm: shortOrderFit.fontSizeMm,
      billText: resolvedConfig.showOrderNumber ? billText : '',
      billFontMm: billFit.fontSizeMm,
      customerText: resolvedConfig.showCustomerName ? customerFit.text : '',
      branchText: resolvedConfig.showStoreCode ? branchFit.text : '',
      serviceText: serviceFit.text,
      noteText: noteFit.text,
      hasNote,
      dueText,
      countText: resolvedConfig.showQuantity ? `${tagIndex + 1}/${quantity}` : '',
      customerFontMm: customerFit.fontSizeMm,
      branchFontMm: branchFit.fontSizeMm,
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
    font-family: Arial, Helvetica, sans-serif;
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
    border-top: 0.4mm dashed #000000;
    border-bottom: 0.4mm dashed #000000;
    display: flex;
    flex-direction: column;
    gap: 0.45mm;
    break-inside: avoid;
    page-break-inside: avoid;
    overflow: hidden;
    background: #ffffff;
    padding: 0.75mm 0.85mm 0.65mm;
  }

  .branch-bar {
    line-height: 0.92;
    font-weight: 700;
    letter-spacing: 0.025mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
    padding-bottom: 0.25mm;
    border-bottom: 0.2mm solid #000000;
  }

  .tag-head {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    align-items: end;
    gap: 0.7mm;
    min-height: 5.1mm;
  }

  .short-id {
    line-height: 0.86;
    font-weight: 900;
    letter-spacing: 0.03mm;
    white-space: nowrap;
    overflow: visible;
    text-overflow: clip;
  }

  .bill-date {
    line-height: 0.95;
    font-weight: 800;
    letter-spacing: 0.03mm;
    white-space: nowrap;
    padding: 0.25mm 0.55mm 0.15mm;
    border: 0.22mm solid #000000;
    border-radius: 99mm;
    justify-self: end;
  }

  .customer-line {
    font-weight: 800;
    line-height: 0.94;
    letter-spacing: 0.03mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-transform: uppercase;
  }

  .tag-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 0.45mm;
    padding: 0.6mm 0.7mm 0.45mm;
    border: 0.22mm solid #000000;
    border-radius: 0.95mm;
  }

  .tag-body--with-note {
    justify-content: flex-start;
    gap: 0.45mm;
  }

  .tag-body--no-note {
    justify-content: center;
    gap: 0.15mm;
    padding-top: 0.35mm;
    padding-bottom: 0.35mm;
  }

  .service-line {
    font-weight: 900;
    line-height: 0.92;
    letter-spacing: 0.03mm;
    white-space: normal;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .tag-body--no-note .service-line {
    -webkit-line-clamp: 3;
    line-height: 0.9;
  }

  .note-line {
    font-weight: 700;
    line-height: 0.94;
    letter-spacing: 0.02mm;
    white-space: normal;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .tag-footer {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 0.65mm;
    min-height: 3.6mm;
    padding-top: 0.15mm;
  }

  .due-text {
    font-size: 2.85mm;
    line-height: 0.95;
    font-weight: 800;
    letter-spacing: 0.03mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0.35mm 0.85mm 0.25mm;
    border: 0.22mm solid #000000;
    border-radius: 99mm;
  }

  .count-text {
    font-size: 3.5mm;
    line-height: 0.95;
    font-weight: 900;
    letter-spacing: 0.02mm;
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
      <div class="branch-bar" style="font-size:${tag.branchFontMm}mm;">${escapeHtml(tag.branchText)}</div>
      <div class="tag-head">
        <div class="short-id" style="font-size:${tag.shortOrderFontMm}mm;">${escapeHtml(tag.shortOrderId)}</div>
        <div class="bill-date" style="font-size:${tag.billFontMm}mm;">ORD ${escapeHtml(tag.billText)}</div>
      </div>
      <div class="customer-line" style="font-size:${tag.customerFontMm}mm;">${escapeHtml(tag.customerText)}</div>
      <div class="tag-body ${tag.hasNote ? 'tag-body--with-note' : 'tag-body--no-note'}">
        <div class="service-line" style="font-size:${tag.serviceFontMm}mm;">${escapeHtml(tag.serviceText)}</div>
        ${tag.hasNote ? `<div class="note-line" style="font-size:${tag.noteFontMm}mm;">${escapeHtml(tag.noteText)}</div>` : ''}
      </div>
      <div class="tag-footer">
        <div class="due-text">DUE ${escapeHtml(tag.dueText)}</div>
        <div class="count-text">${escapeHtml(tag.countText)}</div>
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
        borderTop: '0.4mm dashed #000000',
        borderBottom: '0.4mm dashed #000000',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45mm',
        padding: '0.75mm 0.85mm 0.65mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        style={{
          fontSize: `${tag.branchFontMm}mm`,
          lineHeight: 0.92,
          fontWeight: 700,
          letterSpacing: '0.025mm',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'left',
          paddingBottom: '0.25mm',
          borderBottom: '0.2mm solid #000000',
        }}
      >
        {tag.branchText}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'max-content minmax(0, 1fr)',
          alignItems: 'end',
          gap: '0.7mm',
          minHeight: '5.1mm',
        }}
      >
        <div
          style={{
            fontSize: `${tag.shortOrderFontMm}mm`,
            lineHeight: 0.86,
            fontWeight: 900,
            letterSpacing: '0.03mm',
            whiteSpace: 'nowrap',
            overflow: 'visible',
            textOverflow: 'clip',
          }}
        >
          {tag.shortOrderId}
        </div>
        <div
          style={{
            fontSize: `${tag.billFontMm}mm`,
            lineHeight: 0.95,
            fontWeight: 800,
            letterSpacing: '0.03mm',
            whiteSpace: 'nowrap',
            padding: '0.25mm 0.55mm 0.15mm',
            border: '0.22mm solid #000000',
            borderRadius: '99mm',
            justifySelf: 'end',
          }}
        >
          {`ORD ${tag.billText}`}
        </div>
      </div>
      <div
        style={{
          fontSize: `${tag.customerFontMm}mm`,
          fontWeight: 800,
          lineHeight: 0.94,
          letterSpacing: '0.03mm',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textTransform: 'uppercase',
        }}
      >
        {tag.customerText}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: tag.hasNote ? 'flex-start' : 'center',
          gap: tag.hasNote ? '0.45mm' : '0.15mm',
          padding: tag.hasNote ? '0.6mm 0.7mm 0.45mm' : '0.35mm 0.7mm',
          border: '0.22mm solid #000000',
          borderRadius: '0.95mm',
        }}
      >
        <div
          style={{
            fontSize: `${tag.serviceFontMm}mm`,
            fontWeight: 900,
            lineHeight: 0.92,
            letterSpacing: '0.03mm',
            whiteSpace: 'normal',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: tag.hasNote ? 2 : 3,
          }}
        >
          {tag.serviceText}
        </div>
        {tag.hasNote && (
          <div
            style={{
              fontSize: `${tag.noteFontMm}mm`,
              fontWeight: 700,
              lineHeight: 0.94,
              letterSpacing: '0.02mm',
              whiteSpace: 'normal',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
            }}
          >
            {tag.noteText}
          </div>
        )}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          alignItems: 'end',
          gap: '0.65mm',
          minHeight: '3.6mm',
          paddingTop: '0.15mm',
        }}
      >
        <div
          style={{
            fontSize: '2.85mm',
            lineHeight: 0.95,
            fontWeight: 800,
            letterSpacing: '0.03mm',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            padding: '0.35mm 0.85mm 0.25mm',
            border: '0.22mm solid #000000',
            borderRadius: '99mm',
          }}
        >
          {`DUE ${tag.dueText}`}
        </div>
        <div
          style={{
            fontSize: '3.5mm',
            lineHeight: 0.95,
            fontWeight: 900,
            letterSpacing: '0.02mm',
            whiteSpace: 'nowrap',
          }}
        >
          {tag.countText}
        </div>
      </div>
    </div>
  );
}
