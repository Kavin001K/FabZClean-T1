import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, Copy, QrCode, Barcode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { printDriver, BarcodePrintData } from '@/lib/print-driver';

interface BarcodeDisplayProps {
  barcode: {
    id: string;
    code: string;
    type: string;
    entityType: string;
    entityId: string;
    imagePath?: string;
    imageData?: string;
    createdAt: string;
  };
  onPrint?: (barcode: any) => void;
  onDownload?: (barcode: any) => void;
}

export default function BarcodeDisplay({ barcode, onPrint, onDownload }: BarcodeDisplayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(barcode.code);
      toast({
        title: "Copied",
        description: "Barcode code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload(barcode);
      return;
    }

    if (barcode.imageData) {
      try {
        setIsLoading(true);
        const link = document.createElement('a');
        link.href = barcode.imageData;
        link.download = `${barcode.code}.${barcode.type === 'qr' ? 'png' : 'svg'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Downloaded",
          description: "Barcode image downloaded successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to download image",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePrint = async () => {
    if (onPrint) {
      onPrint(barcode);
      return;
    }

    try {
      const barcodeData: BarcodePrintData = {
        code: barcode.code,
        type: barcode.type as 'qr' | 'barcode' | 'ean13' | 'code128',
        entityType: barcode.entityType,
        entityId: barcode.entityId,
        entityData: {
          generated: barcode.createdAt,
          id: barcode.id
        },
        imageData: barcode.imageData || '',
        imagePath: barcode.imagePath
      };

      await printDriver.printBarcode(barcodeData, 'barcode-label');
      
      toast({
        title: "Print Successful",
        description: "Barcode has been sent to printer",
      });
    } catch (error) {
      toast({
        title: "Print Failed",
        description: "Failed to print barcode. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = () => {
    switch (barcode.type) {
      case 'qr':
        return <QrCode className="h-4 w-4" />;
      case 'barcode':
      case 'code128':
      case 'ean13':
        return <Barcode className="h-4 w-4" />;
      default:
        return <QrCode className="h-4 w-4" />;
    }
  };

  const getTypeColor = () => {
    switch (barcode.type) {
      case 'qr':
        return 'bg-blue-100 text-blue-800';
      case 'barcode':
        return 'bg-green-100 text-green-800';
      case 'code128':
        return 'bg-purple-100 text-purple-800';
      case 'ean13':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {getTypeIcon()}
            Barcode
          </CardTitle>
          <Badge className={getTypeColor()}>
            {barcode.type.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barcode Image */}
        {barcode.imageData && (
          <div className="flex justify-center">
            <img
              src={barcode.imageData}
              alt={barcode.code}
              className="max-w-full h-auto border rounded"
              style={{ maxHeight: '200px' }}
            />
          </div>
        )}

        {/* Barcode Info */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Code:</span>
            <span className="font-mono text-xs break-all">{barcode.code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entity:</span>
            <span className="capitalize">{barcode.entityType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID:</span>
            <span className="font-mono text-xs">{barcode.entityId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span className="text-xs">{new Date(barcode.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isLoading}
            className="flex-1"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex-1"
          >
            <Printer className="h-3 w-3 mr-1" />
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
