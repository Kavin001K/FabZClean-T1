/**
 * Enhanced Print Templates
 * Advanced print templates with professional styling for all document types
 */

export interface EnhancedPrintConfig {
  title: string;
  subtitle?: string;
  documentType?: 'invoice' | 'report' | 'statement' | 'manifest' | 'catalog' | 'list';
  data: any[];
  columns?: string[];
  stats?: { label: string; value: string | number; icon?: string }[];
  footer?: string;
  additionalInfo?: { label: string; value: string }[];
  headerContent?: string; // Custom HTML for header
  showCompanyInfo?: boolean;
  showPrintDate?: boolean;
  showPageNumbers?: boolean;
  watermark?: string;
}

const BRAND_COLORS = {
  primary: '#84cc16',
  primaryDark: '#65a30d',
  secondary: '#fb923c',
  dark: '#1f2937',
  light: '#f3f4f6',
  border: '#e5e7eb',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

const generateEnhancedStyles = (config: EnhancedPrintConfig) => `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    @page {
      size: A4;
      margin: 20mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: ${BRAND_COLORS.dark};
      background: white;
    }

    .print-container {
      position: relative;
      max-width: 100%;
      margin: 0 auto;
    }

    ${config.watermark ? `
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      font-weight: 900;
      color: rgba(0, 0, 0, 0.03);
      z-index: -1;
      pointer-events: none;
      white-space: nowrap;
    }
    ` : ''}

    /* Header Styles */
    .print-header {
      position: relative;
      border-bottom: 4px solid ${BRAND_COLORS.primary};
      padding-bottom: 20px;
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    .company-branding {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .logo-circle {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.primaryDark});
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 28px;
      font-weight: 800;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .company-name {
      font-size: 32px;
      font-weight: 800;
      color: ${BRAND_COLORS.dark};
      letter-spacing: -0.5px;
    }

    .company-tagline {
      font-size: 11px;
      color: #6b7280;
      margin-top: 2px;
    }

    .document-badge {
      display: inline-block;
      padding: 8px 16px;
      background: ${BRAND_COLORS.primary};
      color: white;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-radius: 6px;
    }

    .report-title {
      font-size: 28px;
      font-weight: 800;
      color: ${BRAND_COLORS.dark};
      margin: 15px 0 8px 0;
      letter-spacing: -0.5px;
    }

    .report-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 15px;
    }

    .report-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid ${BRAND_COLORS.border};
      font-size: 10px;
      color: #6b7280;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .meta-label {
      font-weight: 600;
      color: ${BRAND_COLORS.dark};
    }

    /* Statistics Grid */
    .stats-section {
      margin: 30px 0;
      page-break-inside: avoid;
    }

    .stats-title {
      font-size: 14px;
      font-weight: 700;
      color: ${BRAND_COLORS.dark};
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: linear-gradient(135deg, #ffffff, ${BRAND_COLORS.light});
      border: 2px solid ${BRAND_COLORS.border};
      border-left: 4px solid ${BRAND_COLORS.primary};
      padding: 16px;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .stat-label {
      font-size: 9px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 800;
      color: ${BRAND_COLORS.dark};
      line-height: 1;
    }

    .stat-icon {
      width: 32px;
      height: 32px;
      background: ${BRAND_COLORS.primary};
      color: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      font-size: 16px;
    }

    /* Section Styles */
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: ${BRAND_COLORS.dark};
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 3px solid ${BRAND_COLORS.primary};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Table Styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      page-break-inside: auto;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      overflow: hidden;
    }

    thead {
      background: linear-gradient(135deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.primaryDark});
      color: white;
    }

    thead tr {
      page-break-inside: avoid;
      page-break-after: avoid;
    }

    th {
      padding: 14px 12px;
      text-align: left;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }

    th:last-child {
      border-right: none;
    }

    tbody tr {
      page-break-inside: avoid;
      page-break-after: auto;
      border-bottom: 1px solid ${BRAND_COLORS.border};
    }

    tbody tr:nth-child(even) {
      background: ${BRAND_COLORS.light};
    }

    tbody tr:hover {
      background: #fef3c7;
    }

    td {
      padding: 12px;
      font-size: 10pt;
      color: ${BRAND_COLORS.dark};
    }

    td:first-child {
      font-weight: 600;
    }

    /* Badge Styles */
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-success {
      background: ${BRAND_COLORS.success};
      color: white;
    }

    .badge-warning {
      background: ${BRAND_COLORS.warning};
      color: white;
    }

    .badge-danger {
      background: ${BRAND_COLORS.danger};
      color: white;
    }

    .badge-info {
      background: ${BRAND_COLORS.info};
      color: white;
    }

    .badge-default {
      background: ${BRAND_COLORS.light};
      color: ${BRAND_COLORS.dark};
      border: 1px solid ${BRAND_COLORS.border};
    }

    /* Additional Info Section */
    .additional-info {
      margin: 25px 0;
      padding: 20px;
      background: ${BRAND_COLORS.light};
      border-left: 4px solid ${BRAND_COLORS.secondary};
      border-radius: 8px;
      page-break-inside: avoid;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 9px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .info-value {
      font-size: 12px;
      color: ${BRAND_COLORS.dark};
      font-weight: 600;
    }

    /* Footer Styles */
    .print-footer {
      position: relative;
      margin-top: 50px;
      padding-top: 25px;
      border-top: 3px solid ${BRAND_COLORS.primary};
      page-break-inside: avoid;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #6b7280;
    }

    .footer-logo {
      font-size: 11px;
      font-weight: 700;
      color: ${BRAND_COLORS.primary};
    }

    .footer-text {
      text-align: center;
      flex: 1;
      padding: 0 20px;
    }

    .footer-meta {
      text-align: right;
    }

    /* Print-specific styles */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .no-print {
        display: none !important;
      }

      .page-break {
        page-break-after: always;
      }

      .avoid-break {
        page-break-inside: avoid;
      }

      thead {
        display: table-header-group;
      }

      tfoot {
        display: table-footer-group;
      }
    }

    /* Screen-only styles */
    @media screen {
      body {
        padding: 40px;
        background: #f9fafb;
      }

      .print-container {
        max-width: 1200px;
        background: white;
        padding: 60px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        border-radius: 12px;
      }

      .print-actions {
        position: fixed;
        top: 30px;
        right: 30px;
        display: flex;
        gap: 12px;
        z-index: 1000;
      }

      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .btn-primary {
        background: linear-gradient(135deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.primaryDark});
        color: white;
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

      .btn-secondary {
        background: white;
        color: ${BRAND_COLORS.dark};
        border: 2px solid ${BRAND_COLORS.border};
      }

      .btn-secondary:hover {
        background: ${BRAND_COLORS.light};
        border-color: ${BRAND_COLORS.primary};
      }
    }
  </style>
`;

export function generateEnhancedPrintHTML(config: EnhancedPrintConfig): string {
  const {
    title,
    subtitle,
    documentType = 'report',
    data,
    columns,
    stats,
    footer = 'This document is confidential and intended for internal use only.',
    additionalInfo,
    headerContent,
    showCompanyInfo = true,
    showPrintDate = true,
    showPageNumbers = true,
    watermark,
  } = config;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const documentTypeLabels: Record<string, string> = {
    invoice: 'INVOICE',
    report: 'REPORT',
    statement: 'STATEMENT',
    manifest: 'MANIFEST',
    catalog: 'CATALOG',
    list: 'LIST',
  };

  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - FabzClean</title>
      ${generateEnhancedStyles(config)}
    </head>
    <body>
      ${watermark ? `<div class="watermark">${watermark}</div>` : ''}

      <div class="print-actions no-print">
        <button class="btn btn-primary" onclick="window.print()">🖨️ Print Document</button>
        <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
      </div>

      <div class="print-container">
        <!-- Header -->
        <div class="print-header">
          ${showCompanyInfo ? `
          <div class="company-branding">
            <div class="brand-logo">
              <div class="logo-circle">FC</div>
              <div>
                <div class="company-name">FabzClean</div>
                <div class="company-tagline">Professional Cleaning Services</div>
              </div>
            </div>
            <div class="document-badge">${documentTypeLabels[documentType]}</div>
          </div>
          ` : ''}

          ${headerContent || ''}

          <h1 class="report-title">${title}</h1>
          ${subtitle ? `<p class="report-subtitle">${subtitle}</p>` : ''}

          <div class="report-meta">
            <div class="meta-item">
              ${showPrintDate ? `
              <span class="meta-label">Generated:</span>
              <span>${dateStr} at ${timeStr}</span>
              ` : ''}
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Records:</span>
              <span>${data.length}</span>
            </div>
            ${showPageNumbers ? `
            <div class="meta-item">
              <span class="meta-label">Document ID:</span>
              <span>DOC-${Date.now()}</span>
            </div>
            ` : ''}
          </div>
        </div>
  `;

  // Add statistics if provided
  if (stats && stats.length > 0) {
    html += `
        <!-- Statistics -->
        <div class="stats-section avoid-break">
          <h2 class="stats-title">Key Metrics</h2>
          <div class="stats-grid">
    `;
    for (const stat of stats) {
      html += `
            <div class="stat-card">
              ${stat.icon ? `<div class="stat-icon">${stat.icon}</div>` : ''}
              <div class="stat-label">${stat.label}</div>
              <div class="stat-value">${stat.value}</div>
            </div>
      `;
    }
    html += `
          </div>
        </div>
    `;
  }

  // Add additional info if provided
  if (additionalInfo && additionalInfo.length > 0) {
    html += `
        <!-- Additional Information -->
        <div class="additional-info avoid-break">
          <div class="info-grid">
    `;
    for (const info of additionalInfo) {
      html += `
            <div class="info-item">
              <div class="info-label">${info.label}</div>
              <div class="info-value">${info.value}</div>
            </div>
      `;
    }
    html += `
          </div>
        </div>
    `;
  }

  // Add data table
  if (data.length > 0) {
    html += `
        <!-- Data Table -->
        <div class="section">
          <h2 class="section-title">Detailed Information</h2>
          <table>
            <thead>
              <tr>
    `;

    // Generate headers
    const headers = columns || Object.keys(data[0]);
    for (const header of headers) {
      html += `<th>${header}</th>`;
    }

    html += `
              </tr>
            </thead>
            <tbody>
    `;

    // Generate rows
    for (const row of data) {
      html += '<tr>';
      for (const header of headers) {
        let value = row[header] || '';

        // Auto-detect and apply badges to status-like fields
        if (
          (header.toLowerCase().includes('status') ||
            header.toLowerCase().includes('payment')) &&
          typeof value === 'string'
        ) {
          const statusLower = value.toLowerCase();
          let badgeClass = 'badge-default';

          if (
            statusLower.includes('completed') ||
            statusLower.includes('paid') ||
            statusLower.includes('delivered') ||
            statusLower.includes('active')
          ) {
            badgeClass = 'badge-success';
          } else if (
            statusLower.includes('pending') ||
            statusLower.includes('processing') ||
            statusLower.includes('transit')
          ) {
            badgeClass = 'badge-warning';
          } else if (
            statusLower.includes('cancelled') ||
            statusLower.includes('failed') ||
            statusLower.includes('rejected')
          ) {
            badgeClass = 'badge-danger';
          }

          value = `<span class="badge ${badgeClass}">${value}</span>`;
        }

        html += `<td>${value}</td>`;
      }
      html += '</tr>';
    }

    html += `
            </tbody>
          </table>
        </div>
    `;
  }

  // Footer
  html += `
        <!-- Footer -->
        <div class="print-footer">
          <div class="footer-content">
            <div class="footer-logo">FabzClean</div>
            <div class="footer-text">${footer}</div>
            <div class="footer-meta">
              ${showPageNumbers ? 'Page 1 of 1' : ''}
            </div>
          </div>
        </div>
      </div>

      <script>
        // Optional: Auto-print on load
        // window.onload = () => { setTimeout(() => window.print(), 500); };
      </script>
    </body>
    </html>
  `;

  return html;
}

export function enhancedPrint(config: EnhancedPrintConfig, title: string = 'Print Document') {
  const html = generateEnhancedPrintHTML(config);
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    throw new Error('Pop-up blocker prevented print window. Please allow pop-ups for this site.');
  }

  printWindow.document.write(html);
  printWindow.document.title = title;
  printWindow.document.close();
}

export default {
  generateEnhancedPrintHTML,
  enhancedPrint,
};
