import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFGenerationOptions {
    filename?: string;
    format?: 'a4' | 'letter';
    orientation?: 'portrait' | 'landscape';
    quality?: number;
}

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

                        // Capture the content as canvas
                        const canvas = await html2canvas(content, {
                            scale: 2,
                            useCORS: true,
                            logging: false,
                            backgroundColor: '#ffffff',
                        });

                        // Create PDF
                        const imgWidth = 210; // A4 width in mm
                        const pageHeight = 297; // A4 height in mm
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        let heightLeft = imgHeight;

                        const pdf = new jsPDF({
                            orientation: options.orientation || 'portrait',
                            unit: 'mm',
                            format: options.format || 'a4',
                        });

                        let position = 0;

                        // Add image to PDF
                        const imgData = canvas.toDataURL('image/jpeg', options.quality || 0.95);
                        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;

                        // Add more pages if content is longer than one page
                        while (heightLeft >= 0) {
                            position = heightLeft - imgHeight;
                            pdf.addPage();
                            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                            heightLeft -= pageHeight;
                        }

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
            // Capture element as canvas
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });

            // Create PDF
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            const pdf = new jsPDF({
                orientation: options.orientation || 'portrait',
                unit: 'mm',
                format: options.format || 'a4',
            });

            const imgData = canvas.toDataURL('image/jpeg', options.quality || 0.95);
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

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
            const billUrl = `${window.location.origin}/bill/${orderNumber}?enableGST=${enableGST}`;
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
