import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Printer, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PrintSettings, PrintTemplate } from '@/lib/print-driver';

interface PrintSettingsProps {
  template?: PrintTemplate;
  onSave?: (settings: PrintSettings) => void;
  onReset?: () => void;
  className?: string;
}

export default function PrintSettingsComponent({ 
  template, 
  onSave, 
  onReset,
  className 
}: PrintSettingsProps) {
  const [settings, setSettings] = useState<PrintSettings>(
    template?.settings || {
      pageSize: 'A4',
      orientation: 'portrait',
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      fontSize: 12,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: '#FFFFFF'
    }
  );
  
  const [layout, setLayout] = useState(
    template?.layout || {
      header: true,
      footer: true,
      logo: true,
      companyInfo: true,
      barcode: true,
      qrCode: true,
      table: true,
      signature: false
    }
  );

  const { toast } = useToast();

  const handleSave = () => {
    if (onSave) {
      onSave(settings);
    }
    toast({
      title: "Settings Saved",
      description: "Print settings have been saved successfully",
    });
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    setSettings({
      pageSize: 'A4',
      orientation: 'portrait',
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      fontSize: 12,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: '#FFFFFF'
    });
    setLayout({
      header: true,
      footer: true,
      logo: true,
      companyInfo: true,
      barcode: true,
      qrCode: true,
      table: true,
      signature: false
    });
    toast({
      title: "Settings Reset",
      description: "Print settings have been reset to defaults",
    });
  };

  const updateMargin = (side: keyof typeof settings.margin, value: string) => {
    setSettings(prev => ({
      ...prev,
      margin: {
        ...prev.margin,
        [side]: parseFloat(value) || 0
      }
    }));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Print Settings
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Page Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Page Settings</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pageSize">Page Size</Label>
              <Select
                value={settings.pageSize}
                onValueChange={(value: any) => setSettings(prev => ({ ...prev, pageSize: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="A5">A5</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orientation">Orientation</Label>
              <Select
                value={settings.orientation}
                onValueChange={(value: any) => setSettings(prev => ({ ...prev, orientation: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                type="number"
                value={settings.fontSize}
                onChange={(e) => setSettings(prev => ({ ...prev, fontSize: parseFloat(e.target.value) || 12 }))}
                min="8"
                max="24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select
                value={settings.fontFamily}
                onValueChange={(value) => setSettings(prev => ({ ...prev, fontFamily: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times">Times</SelectItem>
                  <SelectItem value="Courier">Courier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Margins */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Margins (mm)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marginTop">Top</Label>
              <Input
                id="marginTop"
                type="number"
                value={settings.margin.top}
                onChange={(e) => updateMargin('top', e.target.value)}
                min="0"
                max="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marginBottom">Bottom</Label>
              <Input
                id="marginBottom"
                type="number"
                value={settings.margin.bottom}
                onChange={(e) => updateMargin('bottom', e.target.value)}
                min="0"
                max="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marginLeft">Left</Label>
              <Input
                id="marginLeft"
                type="number"
                value={settings.margin.left}
                onChange={(e) => updateMargin('left', e.target.value)}
                min="0"
                max="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marginRight">Right</Label>
              <Input
                id="marginRight"
                type="number"
                value={settings.margin.right}
                onChange={(e) => updateMargin('right', e.target.value)}
                min="0"
                max="50"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Colors */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Colors</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={settings.color}
                  onChange={(e) => setSettings(prev => ({ ...prev, color: e.target.value }))}
                  className="w-16 h-10"
                />
                <Input
                  value={settings.color}
                  onChange={(e) => setSettings(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-16 h-10"
                />
                <Input
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Layout Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Layout Options</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="header">Header</Label>
              <Switch
                id="header"
                checked={layout.header}
                onCheckedChange={(checked) => setLayout(prev => ({ ...prev, header: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="footer">Footer</Label>
              <Switch
                id="footer"
                checked={layout.footer}
                onCheckedChange={(checked) => setLayout(prev => ({ ...prev, footer: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="logo">Logo</Label>
              <Switch
                id="logo"
                checked={layout.logo}
                onCheckedChange={(checked) => setLayout(prev => ({ ...prev, logo: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="companyInfo">Company Info</Label>
              <Switch
                id="companyInfo"
                checked={layout.companyInfo}
                onCheckedChange={(checked) => setLayout(prev => ({ ...prev, companyInfo: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="barcode">Barcode</Label>
              <Switch
                id="barcode"
                checked={layout.barcode}
                onCheckedChange={(checked) => setLayout(prev => ({ ...prev, barcode: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="qrCode">QR Code</Label>
              <Switch
                id="qrCode"
                checked={layout.qrCode}
                onCheckedChange={(checked) => setLayout(prev => ({ ...prev, qrCode: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="table">Table</Label>
              <Switch
                id="table"
                checked={layout.table}
                onCheckedChange={(checked) => setLayout(prev => ({ ...prev, table: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="signature">Signature</Label>
              <Switch
                id="signature"
                checked={layout.signature}
                onCheckedChange={(checked) => setLayout(prev => ({ ...prev, signature: checked }))}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Preview</h3>
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Page:</strong> {settings.pageSize} {settings.orientation}</p>
              <p><strong>Font:</strong> {settings.fontFamily} {settings.fontSize}pt</p>
              <p><strong>Margins:</strong> {settings.margin.top}mm top, {settings.margin.bottom}mm bottom</p>
              <p><strong>Colors:</strong> Text: {settings.color}, Background: {settings.backgroundColor}</p>
              <div className="flex gap-2 mt-2">
                {Object.entries(layout).map(([key, value]) => (
                  <Badge key={key} variant={value ? "default" : "secondary"}>
                    {key}: {value ? "On" : "Off"}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
