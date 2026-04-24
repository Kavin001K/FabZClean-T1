import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFGenerationOptions {
    filename?: string;
    format?: 'a4' | 'letter' | [number, number];
    orientation?: 'portrait' | 'landscape';
    quality?: number;
}

const PX_TO_MM = 25.4 / 96;

const clampMm = (value: number, fallback: number) => {
    if (!Number.isFinite(value) || value <= 0) {
        return fallback;
    }

    return Math.max(10, value);
};

const getDocumentDimensionsPx = (doc: Document) => {
    const body = doc.body;
    const root = doc.documentElement;

    return {
        width: Math.max(
            body?.scrollWidth || 0,
            body?.offsetWidth || 0,
            body?.clientWidth || 0,
            root?.scrollWidth || 0,
            root?.offsetWidth || 0,
            root?.clientWidth || 0
        ),
        height: Math.max(
            body?.scrollHeight || 0,
            body?.offsetHeight || 0,
            body?.clientHeight || 0,
            root?.scrollHeight || 0,
            root?.offsetHeight || 0,
            root?.clientHeight || 0
        ),
    };
};

const getElementDimensionsPx = (element: HTMLElement) => ({
    width: Math.max(
        element.scrollWidth,
        element.offsetWidth,
        element.clientWidth,
        element.getBoundingClientRect().width
    ),
    height: Math.max(
        element.scrollHeight,
        element.offsetHeight,
        element.clientHeight,
        element.getBoundingClientRect().height
    ),
});

const getPdfFormat = (
    options: PDFGenerationOptions,
    widthPx: number,
    heightPx: number,
): 'a4' | 'letter' | [number, number] => {
    if (options.format) {
        return options.format;
    }

    return [
        clampMm(widthPx * PX_TO_MM, 210),
        clampMm(heightPx * PX_TO_MM, 297),
    ];
};

const addCanvasToPdf = (
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    format: 'a4' | 'letter' | [number, number],
    quality: number,
) => {
    const imgData = canvas.toDataURL('image/jpeg', quality);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');

    if (!Array.isArray(format)) {
        let heightLeft = imgHeight - pageHeight;
        let position = pageHeight - imgHeight;

        while (heightLeft > 5) {
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
            position -= pageHeight;
        }
    }
};

/**
 * PDF Generation Service
 * Generates PDFs from HTML elements or URLs
 */
export class PDFService {
    /**
     * Generate PDF from a URL (like bill view page)
     * Opens the URL in hidden iframe, captures it, and generates PDF
     */
    static async generatePDFFromURL(
        url: string,
        options: PDFGenerationOptions = {}
    ): Promise<Blob> {
        return new Promise((resolve, reject) => {
            try {
                // Create hidden iframe
                const iframe = document.createElement('iframe');
                iframe.style.position = 'absolute';
                iframe.style.left = '-10000px';
                iframe.style.width = '210mm'; // A4 width
                iframe.style.height = '297mm'; // A4 height
                document.body.appendChild(iframe);

                iframe.onload = async () => {
                    try {
                        // Wait a bit for content to fully render
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
                        if (!iframeDocument) {
                            throw new Error('Cannot access iframe document');
                        }

                        // Get the content to capture
                        const content = iframeDocument.body;
                        const contentDimensions = getDocumentDimensionsPx(iframeDocument);
                        iframe.style.width = `${Math.ceil(contentDimensions.width)}px`;
                        iframe.style.height = `${Math.ceil(contentDimensions.height)}px`;

                        await new Promise(resolve => setTimeout(resolve, 150));

                        // Capture the content as canvas - OPTIMIZED
                        const canvas = await html2canvas(content, {
                            scale: 1.5,
                            useCORS: true,
                            logging: false,
                            backgroundColor: '#ffffff',
                            imageTimeout: 5000,
                            width: Math.ceil(contentDimensions.width),
                            height: Math.ceil(contentDimensions.height),
                            windowWidth: Math.ceil(contentDimensions.width),
                            windowHeight: Math.ceil(contentDimensions.height),
                        });

                        const format = getPdfFormat(options, contentDimensions.width, contentDimensions.height);

                        const pdf = new jsPDF({
                            orientation: options.orientation || 'portrait',
                            unit: 'mm',
                            format,
                            compress: true,
                        });

                        addCanvasToPdf(pdf, canvas, format, options.quality || 0.7);

                        // Convert to blob
                        const pdfBlob = pdf.output('blob');

                        // Cleanup
                        document.body.removeChild(iframe);

                        resolve(pdfBlob);
                    } catch (error) {
                        document.body.removeChild(iframe);
                        reject(error);
                    }
                };

                iframe.onerror = () => {
                    document.body.removeChild(iframe);
                    reject(new Error('Failed to load iframe'));
                };

                // Load the URL
                iframe.src = url;
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generate PDF from HTML element
     */
    static async generatePDFFromElement(
        element: HTMLElement,
        options: PDFGenerationOptions = {}
    ): Promise<Blob> {
        try {
            const elementDimensions = getElementDimensionsPx(element);

            // Capture element as canvas - OPTIMIZED
            const canvas = await html2canvas(element, {
                scale: 1.5, // Reduced for smaller file
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                imageTimeout: 5000,
                width: Math.ceil(elementDimensions.width),
                height: Math.ceil(elementDimensions.height),
                windowWidth: Math.ceil(elementDimensions.width),
                windowHeight: Math.ceil(elementDimensions.height),
            });

            const format = getPdfFormat(options, elementDimensions.width, elementDimensions.height);

            const pdf = new jsPDF({
                orientation: options.orientation || 'portrait',
                unit: 'mm',
                format,
                compress: true,
            });

            addCanvasToPdf(pdf, canvas, format, options.quality || 0.7);

            // Convert to blob
            return pdf.output('blob');
        } catch (error) {
            console.error('PDF generation error:', error);
            throw error;
        }
    }

    /**
     * Download PDF directly
     */
    static async downloadPDF(
        url: string,
        filename: string = 'document.pdf'
    ): Promise<void> {
        try {
            const pdfBlob = await this.generatePDFFromURL(url);
            const blobUrl = URL.createObjectURL(pdfBlob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('PDF download error:', error);
            throw error;
        }
    }

    /**
     * Upload PDF to server and get public URL
     */
    static async uploadPDFToServer(
        pdfBlob: Blob,
        filename: string
    ): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('pdf', pdfBlob, filename);

            const response = await fetch('/api/upload-pdf', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to upload PDF');
            }

            const data = await response.json();
            return data.url; // Public URL of uploaded PDF
        } catch (error) {
            console.error('PDF upload error:', error);
            throw error;
        }
    }

    /**
     * Generate PDF and upload for WhatsApp sharing
     */
    static async generateAndUploadBillPDF(
        orderNumber: string,
        enableGST: boolean = true
    ): Promise<string> {
        try {
            // Generate PDF from bill URL
            const billUrl = `${window.location.origin}/bill/${orderNumber}?enableGST=${enableGST}${(order as any).isEdited ? '&preset=edited' : ''}`;
            console.log('📄 Generating PDF from:', billUrl);

            const pdfBlob = await this.generatePDFFromURL(billUrl);
            console.log('✅ PDF generated, size:', pdfBlob.size, 'bytes');

            // Upload to server
            const filename = `invoice-${orderNumber}.pdf`;
            const publicUrl = await this.uploadPDFToServer(pdfBlob, filename);
            console.log('✅ PDF uploaded to:', publicUrl);

            return publicUrl;
        } catch (error) {
            console.error('❌ Generate and upload PDF error:', error);
            throw error;
        }
    }
}
