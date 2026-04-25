import React from 'react';
import { DEFAULT_COMPANY_INFO, getFranchiseById } from './franchise-config';
import { normalizeOrderStoreCode } from './order-store';
import type { OrderCoverType } from '@shared/schema';

export const THERMAL_TAG_WIDTH_MM = 36;
export const THERMAL_TAG_HEIGHT_MM = 28;
const THERMAL_TAG_CUT_GAP_MM = 0.8;
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
  pieceText?: string;
  pieceFontMm?: number;
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

const SERVICE_DESCRIPTOR_RULES: Array<[RegExp, string]> = [
  [/\bWITHOUT\b/g, 'W/O'],
  [/\bWITH\b/g, 'W/'],
  [/\bHEAVY\b/g, 'HVY'],
  [/\bLIGHT\b/g, 'LT'],
  [/\bPLAIN\b/g, 'PLN'],
  [/\bSIMPLE\b/g, 'SPL'],
  [/\bDESIGNER\b/g, 'DSN'],
  [/\bEMBROIDERY\b/g, 'EMB'],
  [/\bEMBROIDERED\b/g, 'EMB'],
  [/\bBORDER\b/g, 'BDR'],
  [/\bPRINTED\b/g, 'PRNT'],
  [/\bPRINT\b/g, 'PRNT'],
  [/\bCHECKED\b/g, 'CHK'],
  [/\bSTRIPED\b/g, 'STRP'],
  [/\bSTARCHED\b/g, 'STRCH'],
  [/\bSTARCH\b/g, 'STRCH'],
  [/\bCOTTON\b/g, 'CTN'],
  [/\bLINEN\b/g, 'LIN'],
  [/\bSYNTHETIC\b/g, 'SYN'],
  [/\bPOLYESTER\b/g, 'PLY'],
  [/\bGEORGETTE\b/g, 'GEO'],
  [/\bCHIFFON\b/g, 'CHF'],
  [/\bBANARASI\b/g, 'BNR'],
  [/\bLEHENGA\b/g, 'LHN'],
  [/\bDUPATTA\b/g, 'DPT'],
  [/\bCHUDIDAR\b/g, 'CHUD'],
  [/\bSALWAR\b/g, 'SLWR'],
  [/\bKAMEEZ\b/g, 'KMZ'],
  [/\bBLOUSE\b/g, 'BLS'],
  [/\bTROUSER\b/g, 'TRSR'],
  [/\bPANT\b/g, 'PNT'],
  [/\bSHERWANI\b/g, 'SHRW'],
  [/\bNIGHTY\b/g, 'NGTY'],
];

const SERVICE_FILLER_WORDS = new Set(['AND', 'ONLY', 'ITEM', 'PCS', 'PC']);

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

const normalizeServiceName = (serviceName?: string) =>
  normalizeText(serviceName, 'SERVICE')
    .replace(/\s+/g, ' ')
    .trim();

const applyServiceRules = (value: string) => {
  let text = value;

  SECONDARY_SERVICE_RULES.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  SERVICE_DESCRIPTOR_RULES.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  return text
    .replace(/[()]/g, ' ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
};

const abbreviateServiceToken = (token: string) => {
  if (token.length <= 5) return token;
  if (token.length <= 7) return token.slice(0, 5);
  return token.slice(0, 4);
};

const buildServiceCandidates = (serviceName?: string) => {
  const normalized = normalizeServiceName(serviceName);
  const compact = applyServiceRules(normalized);
  const compactTokens = compact
    .split(/[\/\s]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !SERVICE_FILLER_WORDS.has(token));

  const shortenedTokens = compactTokens.map((token, index) => {
    if (index === 0) return token;
    return abbreviateServiceToken(token);
  });

  const headTailCompact = compactTokens.length <= 3
    ? compactTokens.join(' ')
    : [compactTokens[0], compactTokens[1], compactTokens[compactTokens.length - 1]].join(' ');

  const headTailAbbreviated = shortenedTokens.length <= 3
    ? shortenedTokens.join(' ')
    : [shortenedTokens[0], shortenedTokens[1], shortenedTokens[shortenedTokens.length - 1]].join(' ');

  const initialCompact = compactTokens.length <= 1
    ? compactTokens[0] || normalized
    : [compactTokens[0], ...compactTokens.slice(1).map((token) => token[0])].join(' ');

  return Array.from(new Set([
    normalized,
    compact,
    compactTokens.join(' '),
    headTailCompact,
    shortenedTokens.join(' '),
    headTailAbbreviated,
    initialCompact,
  ].map((value) => normalizeWhitespace(value, '')).filter(Boolean)));
};

const formatCompactServiceDisplay = (serviceName?: string) => {
  const normalized = normalizeServiceName(serviceName);

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

const TAG_BUNDLE_SIZE_PATTERNS: RegExp[] = [
  /\b(?:set|combo|pack|bundle)\s*(?:of)?\s*(\d{1,2})\b/i,
  /\b(\d{1,2})\s*(?:pc|pcs|piece|pieces|item|items)\b/i,
];

const TAG_BUNDLE_HINT_PATTERN = /\b(?:set|combo|pack|bundle|pair|pcs?|pieces?)\b/i;
const TAG_COMPONENT_KEYWORDS = [
  'top',
  'bottom',
  'dupatta',
  'kurti',
  'kurta',
  'pant',
  'pants',
  'palazzo',
  'legging',
  'leggings',
  'salwar',
  'churidar',
  'chudidar',
  'kameez',
  'blouse',
  'skirt',
  'lehenga',
  'jacket',
  'shawl',
  'stole',
  'inner',
];

const normalizeComponentToken = (value: string) => {
  const normalized = normalizeWhitespace(value, '')
    .replace(/^[-–—/+,.\s]+|[-–—/+,.\s]+$/g, '')
    .replace(/\s+/g, ' ');

  if (!normalized) return '';

  const lower = normalized.toLowerCase();
  if (lower === 'pants') return 'Pant';
  if (lower === 'leggings') return 'Legging';

  return normalized
    .split(' ')
    .map((part) => part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : '')
    .join(' ');
};

const extractBundleComponentInfo = (serviceName?: string) => {
  const normalized = normalizeWhitespace(serviceName, '');
  const match = normalized.match(/^(.*?)\s*\(([^()]+)\)\s*["']?\s*$/);
  const baseServiceName = normalizeWhitespace(match?.[1] || normalized, 'SERVICE');
  const componentText = normalizeWhitespace(match?.[2], '');

  if (!componentText) {
    return { baseServiceName, components: [] as string[] };
  }

  const rawComponents = componentText
    .split(/[,/&+]/)
    .map((part) => normalizeComponentToken(part))
    .filter(Boolean);

  if (rawComponents.length < 2) {
    return { baseServiceName, components: [] as string[] };
  }

  const hasBundleHint = TAG_BUNDLE_HINT_PATTERN.test(normalized);
  const keywordMatches = rawComponents.filter((part) => {
    const lower = part.toLowerCase();
    return TAG_COMPONENT_KEYWORDS.some((keyword) => lower.includes(keyword));
  }).length;

  if (!hasBundleHint && keywordMatches < Math.max(2, rawComponents.length - 1)) {
    return { baseServiceName, components: [] as string[] };
  }

  return { baseServiceName, components: Array.from(new Set(rawComponents)) };
};

const inferTagBundleSize = (serviceName?: string) => {
  const { components } = extractBundleComponentInfo(serviceName);
  if (components.length > 1) {
    return components.length;
  }

  const normalized = normalizeWhitespace(serviceName, '');

  for (const pattern of TAG_BUNDLE_SIZE_PATTERNS) {
    const match = normalized.match(pattern);
    const parsed = Number(match?.[1]);
    if (Number.isInteger(parsed) && parsed > 1) {
      return parsed;
    }
  }

  return 1;
};

const buildBundlePieceSequence = (serviceName: string | undefined, quantity: number) => {
  const { baseServiceName, components } = extractBundleComponentInfo(serviceName);

  if (components.length === 0) {
    return {
      baseServiceName,
      pieceLabels: Array.from(
        { length: inferTagBundleSize(serviceName) * quantity },
        () => undefined as string | undefined
      ),
    };
  }

  return {
    baseServiceName,
    pieceLabels: Array.from({ length: quantity }, () => components).flat(),
  };
};

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

  return { text, fontSizeMm, isTruncated: text !== normalized };
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

const selectBestServiceFit = (
  serviceName: string | undefined,
  config: {
    baseFontMm: number;
    minFontMm: number;
    shrinkStart: number;
    shrinkStepChars: number;
    shrinkFactor: number;
    maxCharsAtMin: number;
  },
  pieceLabel?: string
) => {
  const { baseServiceName } = extractBundleComponentInfo(serviceName);
  const normalizedPiece = pieceLabel ? normalizeText(pieceLabel, 'ITEM') : '';
  const baseNormalized = normalizeServiceName(baseServiceName);
  const basePrimary = baseNormalized.split(/[\/\s]+/).map((token) => token.trim()).filter(Boolean)[0] || 'SET';
  const compactBase = formatCompactServiceDisplay(baseServiceName);

  const candidates = normalizedPiece
    ? Array.from(new Set([
      normalizedPiece,
      `${basePrimary}/${normalizedPiece}`,
      `${basePrimary} ${normalizedPiece}`,
      `${compactBase}/${normalizedPiece}`,
      `${normalizedPiece} ${compactBase}`,
      `${baseNormalized} ${normalizedPiece}`,
    ].map((value) => normalizeWhitespace(value, '')).filter(Boolean)))
    : Array.from(new Set([
      formatCompactServiceDisplay(baseServiceName),
      ...buildServiceCandidates(baseServiceName),
    ]));

  let fallbackFit = fitText(candidates[0] || serviceName || 'SERVICE', 'SERVICE', config);

  for (const candidate of candidates) {
    const fit = fitText(candidate, 'SERVICE', config);
    fallbackFit = fit;

    if (!fit.isTruncated) {
      return fit;
    }
  }

  return fallbackFit;
};

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
  items,
}: ThermalTagSource): PreparedThermalTag[] => {
  const shortOrderId = formatShortOrderId(orderNumber);
  const shortOrderFit = fitUppercaseText(shortOrderId, shortOrderId, {
    baseFontMm: 2.8,
    minFontMm: 2.3,
    shrinkStart: 8,
    shrinkStepChars: 1,
    shrinkFactor: 0.1,
    maxCharsAtMin: 12,
  });
  const branchText = resolveBranchText(franchiseId, storeCode);
  const customerFit = fitText(formatCustomerDisplay(customerName), 'CUSTOMER', {
    baseFontMm: 3.75,
    minFontMm: 2.45,
    shrinkStart: 10,
    shrinkStepChars: 2,
    shrinkFactor: 0.12,
    maxCharsAtMin: 24,
  });
  const branchFit = fitUppercaseText(branchText, branchText, {
    baseFontMm: 2.15,
    minFontMm: 1.75,
    shrinkStart: 11,
    shrinkStepChars: 3,
    shrinkFactor: 0.12,
    maxCharsAtMin: 18,
  });
  const billText = formatTagDate(billDate);
  const dueText = formatTagDate(dueDate);
  const billFit = fitUppercaseText(`ORD ${billText}`, `ORD ${billText}`, {
    baseFontMm: 5,
    minFontMm: 3.9,
    shrinkStart: 4,
    shrinkStepChars: 1,
    shrinkFactor: 0.24,
    maxCharsAtMin: 8,
  });

  return items.flatMap((item, itemIndex) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const { baseServiceName, pieceLabels } = buildBundlePieceSequence(item.serviceName, quantity);
    const totalTagCount = pieceLabels.length;
    const compactNoteText = formatCompactNoteDisplay(item.tagNote || commonNote || '');
    const noteFit = fitText(compactNoteText, '', {
      baseFontMm: 2.45,
      minFontMm: 1.95,
      shrinkStart: 72,
      shrinkStepChars: 4,
      shrinkFactor: 0.12,
      maxCharsAtMin: 140,
    });
    const hasNote = noteFit.text.length > 0;
    const serviceFitConfig = hasNote
      ? {
        baseFontMm: 3.95,
        minFontMm: 2.35,
        shrinkStart: 12,
        shrinkStepChars: 2,
        shrinkFactor: 0.18,
        maxCharsAtMin: 42,
      }
      : {
        baseFontMm: 4.45,
        minFontMm: 2.45,
        shrinkStart: 10,
        shrinkStepChars: 2,
        shrinkFactor: 0.2,
        maxCharsAtMin: 52,
      };

    return pieceLabels.map((pieceLabel, tagIndex) => {
      const pieceFit = pieceLabel
        ? fitUppercaseText(pieceLabel, pieceLabel, {
          baseFontMm: hasNote ? 2.55 : 2.9,
          minFontMm: 1.95,
          shrinkStart: 10,
          shrinkStepChars: 2,
          shrinkFactor: 0.12,
          maxCharsAtMin: 22,
        })
        : null;
      const serviceFit = selectBestServiceFit(
        baseServiceName,
        pieceLabel
          ? {
            baseFontMm: hasNote ? 4.15 : 4.55,
            minFontMm: 2.45,
            shrinkStart: 10,
            shrinkStepChars: 2,
            shrinkFactor: 0.18,
            maxCharsAtMin: 34,
          }
          : serviceFitConfig
      );

      return {
        id: `${orderNumber}-${itemIndex}-${tagIndex}`,
        shortOrderId,
        shortOrderFontMm: shortOrderFit.fontSizeMm,
        billText,
        billFontMm: billFit.fontSizeMm,
        customerText: customerFit.text,
        branchText: branchFit.text,
        pieceText: pieceFit?.text,
        pieceFontMm: pieceFit?.fontSizeMm,
        serviceText: serviceFit.text,
        noteText: noteFit.text,
        hasNote,
        dueText,
        countText: `${tagIndex + 1}/${totalTagCount}`,
        customerFontMm: customerFit.fontSizeMm,
        branchFontMm: branchFit.fontSizeMm,
        serviceFontMm: serviceFit.fontSizeMm,
        noteFontMm: noteFit.fontSizeMm,
      };
    });
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
    gap: ${THERMAL_TAG_CUT_GAP_MM}mm;
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
    gap: 0.35mm;
    break-inside: avoid;
    page-break-inside: avoid;
    overflow: hidden;
    background: #ffffff;
    padding: 0.7mm 0.85mm 0.6mm;
  }

  .branch-bar {
    line-height: 0.9;
    font-weight: 700;
    letter-spacing: 0.025mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
    padding-bottom: 0.2mm;
    border-bottom: 0.2mm solid #000000;
  }

  .tag-head {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    align-items: end;
    gap: 0.55mm;
    min-height: 4.35mm;
    padding-bottom: 0.2mm;
    border-bottom: 0.2mm solid #000000;
  }

  .short-id {
    line-height: 0.8;
    font-weight: 900;
    letter-spacing: 0.015mm;
    white-space: nowrap;
    overflow: visible;
    text-overflow: clip;
  }

  .bill-date {
    line-height: 0.9;
    font-weight: 800;
    letter-spacing: 0.03mm;
    white-space: nowrap;
    padding: 0.22mm 0.5mm 0.12mm;
    border: 0.22mm solid #000000;
    border-radius: 99mm;
    justify-self: end;
  }

  .customer-line {
    font-weight: 900;
    line-height: 0.88;
    letter-spacing: 0.02mm;
    padding-top: 0.12mm;
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
    gap: 0.35mm;
    padding: 0.5mm 0.68mm 0.4mm;
    border: 0.22mm solid #000000;
    border-radius: 0.95mm;
  }

  .tag-body--with-note {
    justify-content: flex-start;
    gap: 0.35mm;
  }

  .tag-body--no-note {
    justify-content: center;
    gap: 0.1mm;
    padding-top: 0.2mm;
    padding-bottom: 0.2mm;
  }

  .service-line {
    font-weight: 900;
    line-height: 0.84;
    letter-spacing: 0.015mm;
    white-space: normal;
    overflow: hidden;
    overflow-wrap: anywhere;
    word-break: break-word;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    text-transform: uppercase;
  }

  .tag-body--no-note .service-line {
    -webkit-line-clamp: 3;
    line-height: 0.8;
  }

  .service-stack {
    display: flex;
    flex-direction: column;
    gap: 0.18mm;
    min-height: 0;
  }

  .piece-line {
    font-weight: 700;
    line-height: 0.82;
    letter-spacing: 0.012mm;
    white-space: normal;
    overflow: hidden;
    overflow-wrap: anywhere;
    word-break: break-word;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    text-transform: uppercase;
  }

  .service-subline {
    font-weight: 900;
    line-height: 0.84;
    letter-spacing: 0.015mm;
    white-space: normal;
    overflow: hidden;
    overflow-wrap: anywhere;
    word-break: break-word;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    text-transform: uppercase;
  }

  .tag-body--no-note .service-subline {
    -webkit-line-clamp: 2;
  }

  .note-line {
    font-weight: 700;
    line-height: 0.88;
    letter-spacing: 0.02mm;
    white-space: normal;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    border-top: 0.2mm dashed #000000;
    padding-top: 0.28mm;
  }

  .tag-footer {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 0.55mm;
    min-height: 3.3mm;
    padding-top: 0.1mm;
  }

  .due-text {
    font-size: 2.7mm;
    line-height: 0.9;
    font-weight: 800;
    letter-spacing: 0.03mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0.28mm 0.75mm 0.18mm;
    border: 0.22mm solid #000000;
    border-radius: 99mm;
  }

  .count-text {
    font-size: 3.25mm;
    line-height: 0.9;
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
  Math.max(
    THERMAL_TAG_HEIGHT_MM,
    (Math.max(1, tagCount) * THERMAL_TAG_HEIGHT_MM) +
      (Math.max(0, tagCount - 1) * THERMAL_TAG_CUT_GAP_MM) +
      THERMAL_TAG_STACK_PADDING_MM
  );

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
        ${tag.pieceText
          ? `<div class="service-stack">
              <div class="service-subline" style="font-size:${tag.serviceFontMm}mm;">${escapeHtml(tag.serviceText)}</div>
              <div class="piece-line" style="font-size:${tag.pieceFontMm ?? tag.serviceFontMm}mm;">${escapeHtml(tag.pieceText)}</div>
            </div>`
          : `<div class="service-line" style="font-size:${tag.serviceFontMm}mm;">${escapeHtml(tag.serviceText)}</div>`
        }
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
        gap: '0.35mm',
        padding: '0.7mm 0.85mm 0.6mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        style={{
          fontSize: `${tag.branchFontMm}mm`,
          lineHeight: 0.9,
          fontWeight: 700,
          letterSpacing: '0.025mm',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'left',
          paddingBottom: '0.2mm',
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
          gap: '0.55mm',
          minHeight: '4.35mm',
          paddingBottom: '0.2mm',
          borderBottom: '0.2mm solid #000000',
        }}
      >
        <div
          style={{
            fontSize: `${tag.shortOrderFontMm}mm`,
            lineHeight: 0.8,
            fontWeight: 900,
            letterSpacing: '0.015mm',
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
            lineHeight: 0.9,
            fontWeight: 800,
            letterSpacing: '0.03mm',
            whiteSpace: 'nowrap',
            padding: '0.22mm 0.5mm 0.12mm',
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
          fontWeight: 900,
          lineHeight: 0.88,
          letterSpacing: '0.02mm',
          paddingTop: '0.12mm',
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
          gap: tag.hasNote ? '0.35mm' : '0.1mm',
          padding: tag.hasNote ? '0.5mm 0.68mm 0.4mm' : '0.2mm 0.68mm',
          border: '0.22mm solid #000000',
          borderRadius: '0.95mm',
        }}
      >
        {tag.pieceText ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.18mm',
              minHeight: 0,
            }}
          >
            <div
              style={{
                fontSize: `${tag.serviceFontMm}mm`,
                fontWeight: 900,
                lineHeight: 0.84,
                letterSpacing: '0.015mm',
                whiteSpace: 'normal',
                overflow: 'hidden',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                textTransform: 'uppercase',
              }}
            >
              {tag.serviceText}
            </div>
            <div
              style={{
                fontSize: `${tag.pieceFontMm ?? tag.serviceFontMm}mm`,
                fontWeight: 700,
                lineHeight: 0.82,
                letterSpacing: '0.012mm',
                whiteSpace: 'normal',
                overflow: 'hidden',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                textTransform: 'uppercase',
              }}
            >
              {tag.pieceText}
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: `${tag.serviceFontMm}mm`,
              fontWeight: 900,
              lineHeight: tag.hasNote ? 0.84 : 0.82,
              letterSpacing: '0.015mm',
              whiteSpace: 'normal',
              overflow: 'hidden',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: tag.hasNote ? 2 : 3,
              textTransform: 'uppercase',
            }}
          >
            {tag.serviceText}
          </div>
        )}
        {tag.hasNote && (
          <div
            style={{
              fontSize: `${tag.noteFontMm}mm`,
              fontWeight: 700,
              lineHeight: 0.88,
              letterSpacing: '0.02mm',
              whiteSpace: 'normal',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              borderTop: '0.2mm dashed #000000',
              paddingTop: '0.28mm',
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
          gap: '0.55mm',
          minHeight: '3.3mm',
          paddingTop: '0.1mm',
        }}
      >
        <div
          style={{
            fontSize: '2.7mm',
            lineHeight: 0.9,
            fontWeight: 800,
            letterSpacing: '0.03mm',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            padding: '0.28mm 0.75mm 0.18mm',
            border: '0.22mm solid #000000',
            borderRadius: '99mm',
          }}
        >
          {`DUE ${tag.dueText}`}
        </div>
        <div
          style={{
            fontSize: '3.25mm',
            lineHeight: 0.9,
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

// ============================================================
// BAG TAGS — Separate tags for physical garment bags
// ============================================================

export const BAG_TAG_HEIGHT_MM = 32;

export interface BagTagSource {
  orderNumber: string;
  customerName?: string;
  franchiseId?: string | null;
  storeCode?: string;
  billDate?: string;
  dueDate?: string;
  totalItems: number;
  totalServices: number;
  bagCount: number;
  coverType?: OrderCoverType | string;
}

export interface PreparedBagTag {
  id: string;
  shortOrderId: string;
  shortOrderFontMm: number;
  branchText: string;
  branchFontMm: number;
  customerText: string;
  customerFontMm: number;
  billText: string;
  dueText: string;
  totalItemsText: string;
  totalServicesText: string;
  bagTypeText: string;
  bagLabel: string;
  bagLabelFontMm: number;
}

const normalizeCoverType = (value?: OrderCoverType | string): OrderCoverType => {
  if (value === 'cover' || value === 'coat_cover') return value;
  return 'bag';
};

const getBagTypeLabel = (value?: OrderCoverType | string) => {
  switch (normalizeCoverType(value)) {
    case 'cover':
      return 'COVER';
    case 'coat_cover':
      return 'COAT COVER';
    default:
      return 'BAG';
  }
};

export const prepareBagTags = ({
  orderNumber,
  customerName,
  franchiseId,
  storeCode,
  billDate,
  dueDate,
  totalItems,
  totalServices,
  bagCount,
  coverType,
}: BagTagSource): PreparedBagTag[] => {
  const shortOrderId = formatShortOrderId(orderNumber);
  const shortOrderFit = fitUppercaseText(shortOrderId, shortOrderId, {
    baseFontMm: 2.8,
    minFontMm: 2.3,
    shrinkStart: 8,
    shrinkStepChars: 1,
    shrinkFactor: 0.1,
    maxCharsAtMin: 12,
  });
  const branchText = resolveBranchText(franchiseId, storeCode);
  const branchFit = fitUppercaseText(branchText, branchText, {
    baseFontMm: 2.15,
    minFontMm: 1.75,
    shrinkStart: 11,
    shrinkStepChars: 3,
    shrinkFactor: 0.12,
    maxCharsAtMin: 18,
  });
  const customerFit = fitText(formatCustomerDisplay(customerName), 'CUSTOMER', {
    baseFontMm: 3.75,
    minFontMm: 2.45,
    shrinkStart: 10,
    shrinkStepChars: 2,
    shrinkFactor: 0.12,
    maxCharsAtMin: 24,
  });
  const billText = formatTagDate(billDate);
  const dueText = formatTagDate(dueDate);
  const count = Math.max(1, bagCount);
  const bagTypeText = getBagTypeLabel(coverType);

  return Array.from({ length: count }, (_, i) => {
    const bagLabel = `${bagTypeText} ${i + 1}/${count}`;
    const bagLabelFit = fitUppercaseText(bagLabel, bagLabel, {
      baseFontMm: 6.5,
      minFontMm: 4.5,
      shrinkStart: 10,
      shrinkStepChars: 2,
      shrinkFactor: 0.3,
      maxCharsAtMin: 16,
    });

    return {
      id: `${orderNumber}-bag-${i}`,
      shortOrderId,
      shortOrderFontMm: shortOrderFit.fontSizeMm,
      branchText: branchFit.text,
      branchFontMm: branchFit.fontSizeMm,
      customerText: customerFit.text,
      customerFontMm: customerFit.fontSizeMm,
      billText,
      dueText,
      totalItemsText: `${totalItems} ITEMS`,
      totalServicesText: `${totalServices} SVC`,
      bagTypeText,
      bagLabel: bagLabelFit.text,
      bagLabelFontMm: bagLabelFit.fontSizeMm,
    };
  });
};

export const getBagTagStripHeightMm = (tagCount: number) =>
  Math.max(
    BAG_TAG_HEIGHT_MM,
    (Math.max(1, tagCount) * BAG_TAG_HEIGHT_MM) +
      (Math.max(0, tagCount - 1) * 0.8) + 0.2
  );

const getBagTagPrintStyles = (pageHeightMm: number) => `
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; background: #fff; color: #000;
    width: ${THERMAL_TAG_WIDTH_MM}mm; min-width: ${THERMAL_TAG_WIDTH_MM}mm;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  body { font-family: Arial, Helvetica, sans-serif; }
  .no-print { display: block; }
  .bag-page {
    width: ${THERMAL_TAG_WIDTH_MM}mm;
    min-height: ${pageHeightMm}mm;
    display: flex; flex-direction: column; gap: 0.8mm;
  }
  .bag-tag {
    width: ${THERMAL_TAG_WIDTH_MM}mm;
    height: ${BAG_TAG_HEIGHT_MM}mm;
    min-height: ${BAG_TAG_HEIGHT_MM}mm;
    max-height: ${BAG_TAG_HEIGHT_MM}mm;
    border-top: 0.4mm dashed #000; border-bottom: 0.4mm dashed #000;
    display: flex; flex-direction: column; gap: 0.3mm;
    break-inside: avoid; page-break-inside: avoid;
    overflow: hidden; background: #fff;
    padding: 0.7mm 0.85mm 0.6mm;
  }
  .bag-branch { line-height: 0.9; font-weight: 700; letter-spacing: 0.025mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; padding-bottom: 0.2mm; border-bottom: 0.2mm solid #000; }
  .bag-head { display: grid; grid-template-columns: max-content minmax(0,1fr); align-items: end; gap: 0.55mm; min-height: 4mm; padding-bottom: 0.2mm; border-bottom: 0.2mm solid #000; }
  .bag-id { line-height: 0.8; font-weight: 900; letter-spacing: 0.015mm; white-space: nowrap; }
  .bag-date-pill { line-height: 0.9; font-weight: 800; letter-spacing: 0.03mm; white-space: nowrap; padding: 0.2mm 0.5mm 0.1mm; border: 0.22mm solid #000; border-radius: 99mm; justify-self: end; font-size: 2.2mm; }
  .bag-customer { font-weight: 900; line-height: 0.88; letter-spacing: 0.02mm; padding-top: 0.12mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; }
  .bag-body { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 0.5mm; border: 0.3mm solid #000; border-radius: 1mm; padding: 0.5mm; }
  .bag-type { font-size: 2.2mm; line-height: 0.9; font-weight: 800; letter-spacing: 0.08mm; text-transform: uppercase; text-align: center; }
  .bag-label { font-weight: 900; line-height: 0.85; letter-spacing: 0.04mm; text-transform: uppercase; text-align: center; }
  .bag-info { display: flex; justify-content: center; gap: 2mm; font-size: 2.4mm; font-weight: 700; line-height: 1; }
  .bag-footer { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 0.55mm; min-height: 3mm; padding-top: 0.1mm; }
  .bag-due { font-size: 2.7mm; line-height: 0.9; font-weight: 800; letter-spacing: 0.03mm; white-space: nowrap; padding: 0.28mm 0.75mm 0.18mm; border: 0.22mm solid #000; border-radius: 99mm; }
  @media print {
    @page { size: ${THERMAL_TAG_WIDTH_MM}mm ${pageHeightMm}mm; margin: 0; }
    .no-print { display: none !important; }
    html, body { margin: 0 !important; padding: 0 !important; width: ${THERMAL_TAG_WIDTH_MM}mm !important; }
  }
`;

export const buildBagTagPrintHtml = (tags: PreparedBagTag[], title: string) => {
  const pageHeightMm = getBagTagStripHeightMm(tags.length);
  const tagsHtml = tags.map((tag) => `
    <div class="bag-tag">
      <div class="bag-branch" style="font-size:${tag.branchFontMm}mm;">${escapeHtml(tag.branchText)}</div>
      <div class="bag-head">
        <div class="bag-id" style="font-size:${tag.shortOrderFontMm}mm;">${escapeHtml(tag.shortOrderId)}</div>
        <div class="bag-date-pill">ORD ${escapeHtml(tag.billText)}</div>
      </div>
      <div class="bag-customer" style="font-size:${tag.customerFontMm}mm;">${escapeHtml(tag.customerText)}</div>
      <div class="bag-body">
        <div class="bag-type">${escapeHtml(tag.bagTypeText)}</div>
        <div class="bag-label" style="font-size:${tag.bagLabelFontMm}mm;">${escapeHtml(tag.bagLabel)}</div>
        <div class="bag-info">
          <span>${escapeHtml(tag.totalItemsText)}</span>
          <span>•</span>
          <span>${escapeHtml(tag.totalServicesText)}</span>
        </div>
      </div>
      <div class="bag-footer">
        <div class="bag-due">DUE ${escapeHtml(tag.dueText)}</div>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
      <style>${getBagTagPrintStyles(pageHeightMm)}</style>
    </head>
    <body>
      <div class="no-print" style="padding:4mm 0;text-align:center;width:${THERMAL_TAG_WIDTH_MM}mm;">
        <button onclick="window.print()" style="font:900 12px Arial,sans-serif;padding:8px 12px;border:1px solid #000;background:#fff;color:#000;cursor:pointer;">
          PRINT BAG TAGS
        </button>
      </div>
      <div class="bag-page">
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

export function BagTagLabel({ tag }: { tag: PreparedBagTag }) {
  return (
    <div
      className="bg-white text-black overflow-hidden"
      style={{
        width: `${THERMAL_TAG_WIDTH_MM}mm`,
        height: `${BAG_TAG_HEIGHT_MM}mm`,
        minHeight: `${BAG_TAG_HEIGHT_MM}mm`,
        maxHeight: `${BAG_TAG_HEIGHT_MM}mm`,
        borderTop: '0.4mm dashed #000000',
        borderBottom: '0.4mm dashed #000000',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3mm',
        padding: '0.7mm 0.85mm 0.6mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      {/* Branch bar */}
      <div
        style={{
          fontSize: `${tag.branchFontMm}mm`,
          lineHeight: 0.9,
          fontWeight: 700,
          letterSpacing: '0.025mm',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'left',
          paddingBottom: '0.2mm',
          borderBottom: '0.2mm solid #000000',
        }}
      >
        {tag.branchText}
      </div>
      {/* Header: Order ID + date pill */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'max-content minmax(0, 1fr)',
          alignItems: 'end',
          gap: '0.55mm',
          minHeight: '4mm',
          paddingBottom: '0.2mm',
          borderBottom: '0.2mm solid #000000',
        }}
      >
        <div
          style={{
            fontSize: `${tag.shortOrderFontMm}mm`,
            lineHeight: 0.8,
            fontWeight: 900,
            letterSpacing: '0.015mm',
            whiteSpace: 'nowrap',
          }}
        >
          {tag.shortOrderId}
        </div>
        <div
          style={{
            fontSize: '2.2mm',
            lineHeight: 0.9,
            fontWeight: 800,
            letterSpacing: '0.03mm',
            whiteSpace: 'nowrap',
            padding: '0.2mm 0.5mm 0.1mm',
            border: '0.22mm solid #000000',
            borderRadius: '99mm',
            justifySelf: 'end',
          }}
        >
          {`ORD ${tag.billText}`}
        </div>
      </div>
      {/* Customer name */}
      <div
        style={{
          fontSize: `${tag.customerFontMm}mm`,
          fontWeight: 900,
          lineHeight: 0.88,
          letterSpacing: '0.02mm',
          paddingTop: '0.12mm',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textTransform: 'uppercase',
        }}
      >
        {tag.customerText}
      </div>
      {/* Bag body — big bag label + item/service info */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5mm',
          border: '0.3mm solid #000000',
          borderRadius: '1mm',
          padding: '0.5mm',
        }}
      >
        <div
          style={{
            fontSize: `${tag.bagLabelFontMm}mm`,
            fontWeight: 900,
            lineHeight: 0.85,
            letterSpacing: '0.04mm',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {tag.bagLabel}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2mm',
            fontSize: '2.4mm',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          <span>{tag.totalItemsText}</span>
          <span>•</span>
          <span>{tag.totalServicesText}</span>
        </div>
      </div>
      {/* Footer — due date */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          alignItems: 'end',
          gap: '0.55mm',
          minHeight: '3mm',
          paddingTop: '0.1mm',
        }}
      >
        <div
          style={{
            fontSize: '2.7mm',
            lineHeight: 0.9,
            fontWeight: 800,
            letterSpacing: '0.03mm',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            padding: '0.28mm 0.75mm 0.18mm',
            border: '0.22mm solid #000000',
            borderRadius: '99mm',
          }}
        >
          {`DUE ${tag.dueText}`}
        </div>
      </div>
    </div>
  );
}
