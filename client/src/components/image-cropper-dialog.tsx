import { useState, useRef, useCallback } from 'react';
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

    const getCroppedImage = useCallback(async (): Promise<string> => {
        const image = imgRef.current;
        const canvas = canvasRef.current;

        if (!image || !canvas || !completedCrop) {
            throw new Error('Crop data not available');
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Set canvas size to the desired output size (e.g., 400x400 for profile)
        const outputSize = 400;
        canvas.width = outputSize;
        canvas.height = outputSize;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply circular mask if needed
        if (circularCrop) {
            ctx.beginPath();
            ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
        }

        // Calculate source and destination dimensions
        const sourceX = completedCrop.x * scaleX;
        const sourceY = completedCrop.y * scaleY;
        const sourceWidth = completedCrop.width * scaleX;
        const sourceHeight = completedCrop.height * scaleY;

        // Save context state
        ctx.save();

        // Apply rotation if needed
        if (rotate !== 0) {
            ctx.translate(outputSize / 2, outputSize / 2);
            ctx.rotate((rotate * Math.PI) / 180);
            ctx.translate(-outputSize / 2, -outputSize / 2);
        }

        // Draw the cropped image
        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            outputSize,
            outputSize
        );

        // Restore context state
        ctx.restore();

        // Convert canvas to base64
        return canvas.toDataURL('image/jpeg', 0.9);
    }, [completedCrop, circularCrop, rotate]);

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
