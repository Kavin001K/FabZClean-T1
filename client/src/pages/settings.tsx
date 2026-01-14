import React from 'react';
import { useSettings, Theme, PrinterType } from '@/contexts/settings-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, Printer, Bell, Database, Laptop } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const { toast } = useToast();

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      resetSettings();
      toast({ title: "Settings Reset", description: "All preferences have been restored." });
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your workspace preferences and device configurations.</p>
        </div>
        <Button variant="outline" onClick={handleReset} className="text-destructive border-destructive hover:bg-destructive/10">
          Reset to Defaults
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="printing">Printing</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* --- GENERAL SETTINGS --- */}
        <TabsContent value="general" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Laptop className="h-5 w-5" /> Appearance</CardTitle>
              <CardDescription>Customize how the application looks on your device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Theme */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme Mode</Label>
                  <p className="text-sm text-muted-foreground">Select your preferred color scheme.</p>
                </div>
                <Select value={settings.theme} onValueChange={(v: Theme) => updateSetting('theme', v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light"><div className="flex items-center gap-2"><Sun className="h-4 w-4" /> Light</div></SelectItem>
                    <SelectItem value="dark"><div className="flex items-center gap-2"><Moon className="h-4 w-4" /> Dark</div></SelectItem>
                    <SelectItem value="system">System Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Density */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Information Density</Label>
                  <p className="text-sm text-muted-foreground">Compact mode fits more data on screen.</p>
                </div>
                <Select value={settings.density} onValueChange={(v: any) => updateSetting('density', v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- PRINTING SETTINGS --- */}
        <TabsContent value="printing" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Printer className="h-5 w-5" /> Print Configuration</CardTitle>
              <CardDescription>Setup your POS or Office printer settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Default Printer Format</Label>
                  <p className="text-sm text-muted-foreground">Choose between thermal receipt or A4 invoice.</p>
                </div>
                <Select value={settings.defaultPrinterType} onValueChange={(v: PrinterType) => updateSetting('defaultPrinterType', v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thermal">Thermal (80mm)</SelectItem>
                    <SelectItem value="a4">Standard A4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Print on Creation</Label>
                  <p className="text-sm text-muted-foreground">Automatically open print dialog when order is created.</p>
                </div>
                <Switch
                  checked={settings.autoPrintInvoice}
                  onCheckedChange={(c) => updateSetting('autoPrintInvoice', c)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Print Preview</Label>
                  <p className="text-sm text-muted-foreground">Preview invoice before printing.</p>
                </div>
                <Switch
                  checked={settings.showPrintPreview}
                  onCheckedChange={(c) => updateSetting('showPrintPreview', c)}
                />
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label>Header Address (Offline Fallback)</Label>
                <Input
                  value={settings.shopAddress}
                  onChange={(e) => updateSetting('shopAddress', e.target.value)}
                  placeholder="Enter shop address for receipts"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- NOTIFICATIONS --- */}
        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Communication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>WhatsApp Integration</Label>
                  <p className="text-sm text-muted-foreground">Send automated bills and status updates via WhatsApp.</p>
                </div>
                <Switch
                  checked={settings.enableWhatsApp}
                  onCheckedChange={(c) => updateSetting('enableWhatsApp', c)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">Play sounds on successful actions (Scan, Save).</p>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(c) => updateSetting('soundEnabled', c)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- SYSTEM --- */}
        <TabsContent value="system" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> System Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Offline Mode</Label>
                  <p className="text-sm text-muted-foreground">Force application to use local database only.</p>
                </div>
                <Switch
                  checked={settings.offlineMode}
                  onCheckedChange={(c) => updateSetting('offlineMode', c)}
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border text-sm">
                <p><strong>Note:</strong> Settings are saved locally on this device. Clearing your browser cache will reset these preferences.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
