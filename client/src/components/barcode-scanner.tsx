import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, Camera, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose?: () => void;
  placeholder?: string;
  title?: string;
}

export default function BarcodeScanner({ 
  onScan, 
  onClose, 
  placeholder = "Scan or enter barcode/QR code",
  title = "Barcode Scanner"
}: BarcodeScannerProps) {
  const [scannedCode, setScannedCode] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualInput = (value: string) => {
    if (value.trim()) {
      setScannedCode(value.trim());
      onScan(value.trim());
      setScanHistory(prev => [value.trim(), ...prev.slice(0, 4)]); // Keep last 5 scans
    }
  };

  const handleScanFromHistory = (code: string) => {
    setScannedCode(code);
    onScan(code);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualInput(scannedCode);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera Preview */}
        {isScanning && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-48 bg-gray-100 rounded-lg object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border-2 border-white rounded-lg opacity-75"></div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={stopCamera}
            >
              Stop Camera
            </Button>
          </div>
        )}

        {/* Manual Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={placeholder}
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={() => handleManualInput(scannedCode)}
              disabled={!scannedCode.trim()}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {!isScanning && (
            <Button 
              onClick={startCamera}
              variant="outline"
              className="w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              Start Camera Scan
            </Button>
          )}
        </div>

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Scans</h4>
            <div className="flex flex-wrap gap-2">
              {scanHistory.map((code, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleScanFromHistory(code)}
                >
                  <QrCode className="h-3 w-3 mr-1" />
                  {code.length > 20 ? `${code.substring(0, 20)}...` : code}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Use camera to scan QR codes or barcodes</p>
          <p>• Manually enter codes in the input field</p>
          <p>• Click recent scans to reuse them</p>
        </div>
      </CardContent>
    </Card>
  );
}
