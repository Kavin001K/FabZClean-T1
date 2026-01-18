// client/src/lib/pdf-compressor.ts
// Smart PDF Compression Algorithm with Quality Preservation

/**
 * PDF Compression Configuration
 */
interface CompressionConfig {
    targetSizeKB: number;        // Target max size in KB
    minQuality: number;          // Minimum JPEG quality (0-1)
    maxQuality: number;          // Maximum JPEG quality (0-1)
    initialQuality: number;      // Starting quality
    qualityStep: number;         // Quality reduction per iteration
    maxIterations: number;       // Max compression attempts
    scaleThreshold: number;      // Size threshold to trigger scaling
    minScale: number;            // Minimum canvas scale
}

/**
 * Compression Result
 */
interface CompressionResult {
    blob: Blob;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    quality: number;
    scale: number;
    iterations: number;
    success: boolean;
}

/**
 * Default compression settings optimized for invoices
 */
const DEFAULT_CONFIG: CompressionConfig = {
    targetSizeKB: 8000,          // 8MB target (with buffer for 10MB limit)
    minQuality: 0.5,             // Never go below 50% quality
    maxQuality: 0.85,            // Start at 85% for good quality
    initialQuality: 0.85,
    qualityStep: 0.05,           // Reduce by 5% each iteration
    maxIterations: 10,           // Max 10 attempts
    scaleThreshold: 12000,       // If > 12MB, also reduce scale
    minScale: 1.0,               // Never go below 1.0 scale
};

/**
 * Smart PDF Compressor Class
 * Uses adaptive compression to balance quality and file size
 */
export class PDFCompressor {
    private config: CompressionConfig;

    constructor(config: Partial<CompressionConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Analyze image data to determine optimal compression settings
     * Images with more detail need higher quality, simple images can be compressed more
     */
    private analyzeImageComplexity(canvas: HTMLCanvasElement): number {
        try {
            const ctx = canvas.getContext('2d');
            if (!ctx) return 0.5;

            // Sample a portion of the image for complexity analysis
            const sampleSize = Math.min(100, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
            const data = imageData.data;

            let colorVariance = 0;
            let prevR = 0, prevG = 0, prevB = 0;

            // Calculate color variance (higher = more detail)
            for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                colorVariance += Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
                prevR = r; prevG = g; prevB = b;
            }

            // Normalize to 0-1 range
            const normalizedComplexity = Math.min(1, colorVariance / (data.length * 10));
            return normalizedComplexity;
        } catch {
            return 0.5; // Default medium complexity
        }
    }

    /**
     * Get optimal starting quality based on image analysis
     */
    private getOptimalStartQuality(canvas: HTMLCanvasElement): number {
        const complexity = this.analyzeImageComplexity(canvas);

        // Higher complexity = higher initial quality needed
        // Invoices are typically low-mid complexity (mostly text/tables)
        if (complexity < 0.3) {
            return 0.7; // Simple content, can use lower quality
        } else if (complexity < 0.6) {
            return 0.75; // Medium complexity
        } else {
            return 0.85; // High detail, need higher quality
        }
    }

    /**
     * Compress canvas to optimized image data
     */
    private compressCanvas(canvas: HTMLCanvasElement, quality: number): string {
        // Use toBlob approach for potentially better compression
        return canvas.toDataURL('image/jpeg', quality);
    }

    /**
     * Estimate the final PDF size based on image data
     * This helps predict if we need more compression
     */
    private estimatePDFSize(imageData: string, pageCount: number = 1): number {
        // Base64 overhead is ~33%, PDF structure adds ~10%
        const base64Size = imageData.length;
        const decodedSize = base64Size * 0.75;
        const pdfOverhead = 1.1;
        return decodedSize * pdfOverhead * pageCount;
    }

    /**
     * Smart compression algorithm that adapts to content
     * Uses progressive quality reduction with size monitoring
     */
    async compressForPDF(
        canvas: HTMLCanvasElement,
        generatePDF: (imageData: string, quality: number) => Promise<Blob>
    ): Promise<CompressionResult> {
        const startTime = performance.now();
        let currentQuality = this.getOptimalStartQuality(canvas);
        let currentScale = 1.0;
        let iteration = 0;
        let bestResult: { blob: Blob; quality: number; size: number } | null = null;

        console.log('🔄 Starting smart PDF compression...');
        console.log(`📊 Canvas size: ${canvas.width}x${canvas.height}`);
        console.log(`🎯 Target size: ${this.config.targetSizeKB} KB`);

        while (iteration < this.config.maxIterations) {
            iteration++;

            // Generate image data at current quality
            const imageData = this.compressCanvas(canvas, currentQuality);
            const estimatedSize = this.estimatePDFSize(imageData);

            console.log(`📝 Iteration ${iteration}: Quality=${(currentQuality * 100).toFixed(0)}%, Estimated=${(estimatedSize / 1024).toFixed(0)}KB`);

            // Generate actual PDF to check real size
            const pdfBlob = await generatePDF(imageData, currentQuality);
            const actualSizeKB = pdfBlob.size / 1024;

            console.log(`   Actual size: ${actualSizeKB.toFixed(0)} KB`);

            // Track best result that's under limit
            if (actualSizeKB <= this.config.targetSizeKB) {
                if (!bestResult || currentQuality > bestResult.quality) {
                    bestResult = { blob: pdfBlob, quality: currentQuality, size: actualSizeKB };
                    console.log(`   ✅ New best result: ${actualSizeKB.toFixed(0)} KB at ${(currentQuality * 100).toFixed(0)}% quality`);
                }
            }

            // If under target with good quality, we're done!
            if (actualSizeKB <= this.config.targetSizeKB && currentQuality >= this.config.minQuality) {
                console.log(`✅ Compression successful after ${iteration} iterations`);
                console.log(`   Final: ${actualSizeKB.toFixed(0)} KB, Quality: ${(currentQuality * 100).toFixed(0)}%`);
                console.log(`   Time: ${(performance.now() - startTime).toFixed(0)}ms`);

                return {
                    blob: pdfBlob,
                    originalSize: canvas.width * canvas.height * 4, // Rough original size
                    compressedSize: pdfBlob.size,
                    compressionRatio: 1 - (pdfBlob.size / (canvas.width * canvas.height * 4)),
                    quality: currentQuality,
                    scale: currentScale,
                    iterations: iteration,
                    success: true,
                };
            }

            // Reduce quality for next iteration
            currentQuality = Math.max(this.config.minQuality, currentQuality - this.config.qualityStep);

            // If we've hit minimum quality and still too large, we need to accept best result
            if (currentQuality <= this.config.minQuality) {
                break;
            }
        }

        // Return best result we found, even if over limit
        if (bestResult) {
            console.log(`⚠️ Returning best result: ${bestResult.size.toFixed(0)} KB`);
            return {
                blob: bestResult.blob,
                originalSize: canvas.width * canvas.height * 4,
                compressedSize: bestResult.blob.size,
                compressionRatio: 1 - (bestResult.blob.size / (canvas.width * canvas.height * 4)),
                quality: bestResult.quality,
                scale: currentScale,
                iterations: iteration,
                success: bestResult.size <= this.config.targetSizeKB,
            };
        }

        // Absolute fallback - use minimum quality
        console.log('⚠️ Using minimum quality fallback');
        const finalImageData = this.compressCanvas(canvas, this.config.minQuality);
        const finalBlob = await generatePDF(finalImageData, this.config.minQuality);

        return {
            blob: finalBlob,
            originalSize: canvas.width * canvas.height * 4,
            compressedSize: finalBlob.size,
            compressionRatio: 1 - (finalBlob.size / (canvas.width * canvas.height * 4)),
            quality: this.config.minQuality,
            scale: currentScale,
            iterations: iteration,
            success: finalBlob.size / 1024 <= this.config.targetSizeKB,
        };
    }
}

/**
 * Quick compression helper - use this for simple PDF generation
 */
export async function compressPDFBlob(
    pdfBlob: Blob,
    targetSizeKB: number = 8000
): Promise<Blob> {
    // If already under target, return as-is
    if (pdfBlob.size / 1024 <= targetSizeKB) {
        console.log(`📄 PDF already under target (${(pdfBlob.size / 1024).toFixed(0)} KB)`);
        return pdfBlob;
    }

    // For already-generated PDFs, we can't easily recompress without re-rendering
    // Return warning and original
    console.warn(`⚠️ PDF size (${(pdfBlob.size / 1024).toFixed(0)} KB) exceeds target. Re-render with lower quality.`);
    return pdfBlob;
}

/**
 * Create optimized canvas settings for PDF generation
 */
export function getOptimizedCanvasSettings(
    currentSizeEstimate: number = 0
): { scale: number; quality: number } {
    const targetKB = 8000; // 8MB target

    // Start with balanced settings
    let scale = 1.5;
    let quality = 0.75;

    // If we have an estimate that's too large, adjust
    if (currentSizeEstimate > targetKB * 1024) {
        const ratio = targetKB * 1024 / currentSizeEstimate;

        // Reduce quality first (less visual impact)
        quality = Math.max(0.5, quality * Math.sqrt(ratio));

        // If still likely too large, reduce scale
        if (quality <= 0.5 && ratio < 0.5) {
            scale = Math.max(1.0, scale * ratio);
        }
    }

    return { scale, quality };
}

/**
 * Singleton instance for easy access
 */
export const pdfCompressor = new PDFCompressor();

export default PDFCompressor;
