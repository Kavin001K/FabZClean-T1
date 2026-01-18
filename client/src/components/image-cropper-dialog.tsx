import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2, ZoomIn, RotateCw, Check, X } from 'lucide-react';

interface ImageCropperDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageSrc: string;
    onCropComplete: (croppedImageBase64: string) => void;
    aspectRatio?: number; // 1 for square/circle, undefined for free
    circularCrop?: boolean;
    title?: string;
    description?: string;
}

function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

export function ImageCropperDialog({
    open,
    onOpenChange,
    imageSrc,
    onCropComplete,
    aspectRatio = 1,
    circularCrop = true,
    title = 'Crop Image',
    description = 'Adjust and crop your image before saving',
}: ImageCropperDialogProps) {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const onImageLoad = useCallback(
        (e: React.SyntheticEvent<HTMLImageElement>) => {
            const { width, height } = e.currentTarget;
            setCrop(centerAspectCrop(width, height, aspectRatio));
        },
        [aspectRatio]
    );

    // Draw preview on canvas whenever crop changes
    useEffect(() => {
        const image = imgRef.current;
        const canvas = canvasRef.current;

        if (!completedCrop || !image || !canvas) {
            return;
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pixelRatio = window.devicePixelRatio;

        // Set canvas size to match the displayed size for sharp rendering
        // or a fixed size for the preview
        const outputSize = 200; // Preview size

        canvas.width = outputSize * pixelRatio;
        canvas.height = outputSize * pixelRatio;

        ctx.scale(pixelRatio, pixelRatio);
        ctx.imageSmoothingQuality = 'high';

        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;
        const cropWidth = completedCrop.width * scaleX;
        const cropHeight = completedCrop.height * scaleY;

        const centerX = outputSize / 2;
        const centerY = outputSize / 2;

        ctx.save();

        // Clear entire canvas
        ctx.clearRect(0, 0, outputSize, outputSize);

        // Circular clipping
        if (circularCrop) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, outputSize / 2, 0, 2 * Math.PI);
            ctx.clip();
        }

        // Handle rotation around center
        ctx.translate(centerX, centerY);
        ctx.rotate((rotate * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);

        // Calculate draw position to center the crop
        // We want the center of the crop to be at the center of the canvas
        // The drawImage takes the *source* coordinates (cropX, cropY, cropWidth, cropHeight)
        // And draws them to *destination* coordinates (dx, dy, dWidth, dHeight)

        ctx.drawImage(
            image,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            outputSize,
            outputSize
        );

        ctx.restore();

    }, [completedCrop, rotate, scale, circularCrop]);

    const getCroppedImage = useCallback(async (): Promise<string> => {
        if (!completedCrop || !canvasRef.current) {
            throw new Error('Crop data not available');
        }
        // Return the current canvas content as high quality JPEG
        return canvasRef.current.toDataURL('image/jpeg', 0.95);
    }, [completedCrop]);

    const handleCropComplete = async () => {
        setIsProcessing(true);
        try {
            const croppedImage = await getCroppedImage();
            onCropComplete(croppedImage);
            onOpenChange(false);
        } catch (error) {
            console.error('Crop failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRotate = () => {
        setRotate((prev) => (prev + 90) % 360);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto py-4">
                    <div className="flex justify-center items-center min-h-[300px] bg-muted/30 rounded-lg p-4">
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={aspectRatio}
                            circularCrop={circularCrop}
                            className="max-h-[400px]"
                        >
                            <img
                                ref={imgRef}
                                src={imageSrc}
                                alt="Crop preview"
                                style={{
                                    transform: `scale(${scale}) rotate(${rotate}deg)`,
                                    maxHeight: '400px',
                                    maxWidth: '100%',
                                }}
                                onLoad={onImageLoad}
                            />
                        </ReactCrop>
                    </div>

                    {/* Controls */}
                    <div className="mt-4 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 flex-1">
                                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                                <Label className="text-sm w-12">Zoom</Label>
                                <Slider
                                    value={[scale]}
                                    onValueChange={([value]) => setScale(value)}
                                    min={0.5}
                                    max={3}
                                    step={0.1}
                                    className="flex-1"
                                />
                                <span className="text-sm text-muted-foreground w-12 text-right">
                                    {Math.round(scale * 100)}%
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleRotate}
                                title="Rotate 90°"
                            >
                                <RotateCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="mt-4 flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">Preview:</div>
                        <div
                            className={`w-16 h-16 bg-muted border-2 border-primary/20 overflow-hidden ${circularCrop ? 'rounded-full' : 'rounded-md'
                                }`}
                        >
                            {completedCrop && (
                                <canvas
                                    ref={canvasRef}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                            )}
                        </div>
                        <div
                            className={`w-10 h-10 bg-muted border-2 border-primary/20 overflow-hidden ${circularCrop ? 'rounded-full' : 'rounded-md'
                                }`}
                        >
                            {/* Small preview */}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isProcessing}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                    <Button onClick={handleCropComplete} disabled={isProcessing || !completedCrop}>
                        {isProcessing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Check className="mr-2 h-4 w-4" />
                        )}
                        Save Photo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
