import { useSettings, Theme, LandingPage, AVAILABLE_QUICK_ACTIONS, QuickActionId } from '@/contexts/settings-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Moon, Sun, Printer, Bell, Database, Laptop, Zap, Gauge,
  ScanLine, LayoutDashboard, Plus, Search, Receipt, Truck,
  FileText, Vibrate, Volume2, Image, Sparkles, Info, RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Icon map for quick actions
const ICON_MAP: Record<string, React.ElementType> = {
  Plus, ScanLine, Receipt, Search, Truck, FileText
};

export default function SettingsPage() {
  const { settings, updateSetting, resetSettings, toggleQuickAction } = useSettings();
  const { toast } = useToast();

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
      resetSettings();
      toast({ title: "Settings Reset", description: "All preferences have been restored to defaults." });
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your workspace for maximum productivity.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleReset}
          className="text-destructive border-destructive/50 hover:bg-destructive/10"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset All
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="general" className="gap-1">
            <Laptop className="h-4 w-4 hidden sm:block" />
            General
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-1">
            <Zap className="h-4 w-4 hidden sm:block" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="printing" className="gap-1">
            <Printer className="h-4 w-4 hidden sm:block" />
            Print
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1">
            <Gauge className="h-4 w-4 hidden sm:block" />
            Speed
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-1">
            <Database className="h-4 w-4 hidden sm:block" />
            System
          </TabsTrigger>
        </TabsList>

        {/* === GENERAL TAB === */}
        <TabsContent value="general" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Laptop className="h-5 w-5" /> Appearance
              </CardTitle>
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
                    <SelectItem value="light">
                      <div className="flex items-center gap-2"><Sun className="h-4 w-4" /> Light</div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2"><Moon className="h-4 w-4" /> Dark</div>
                    </SelectItem>
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

          {/* Feedback Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> Feedback
              </CardTitle>
              <CardDescription>Control how the app responds to your actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Vibrate className="h-4 w-4" /> Haptic Feedback
                  </Label>
                  <p className="text-sm text-muted-foreground">Vibrate on successful scans and actions.</p>
                </div>
                <Switch
                  checked={settings.hapticFeedback}
                  onCheckedChange={(c) => updateSetting('hapticFeedback', c)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" /> Sound Effects
                  </Label>
                  <p className="text-sm text-muted-foreground">Play sounds on successful actions.</p>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(c) => updateSetting('soundEnabled', c)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === WORKFLOW TAB === */}
        <TabsContent value="workflow" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="h-5 w-5" /> Scanner Behavior
              </CardTitle>
              <CardDescription>Optimize barcode and QR code scanning for speed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Process Scanned Items</Label>
                  <p className="text-sm text-muted-foreground">
                    Instantly submit items after scanning. Perfect for fast-paced environments.
                  </p>
                </div>
                <Switch
                  checked={settings.autoSubmitOnScan}
                  onCheckedChange={(c) => updateSetting('autoSubmitOnScan', c)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" /> Navigation
              </CardTitle>
              <CardDescription>Customize your starting point and shortcuts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Default Landing Page</Label>
                  <p className="text-sm text-muted-foreground">Where to go after logging in.</p>
                </div>
                <Select
                  value={settings.defaultLandingPage}
                  onValueChange={(v: LandingPage) => updateSetting('defaultLandingPage', v)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/dashboard">Dashboard</SelectItem>
                    <SelectItem value="/orders">Orders List</SelectItem>
                    <SelectItem value="/create-order">New Order Screen</SelectItem>
                    <SelectItem value="/transit-orders">Transit Orders</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Quick Actions Selector */}
              <div className="space-y-4">
                <div>
                  <Label>Quick Actions</Label>
                  <p className="text-sm text-muted-foreground">
                    Select up to 4 shortcuts to display on your dashboard. Click to toggle.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {AVAILABLE_QUICK_ACTIONS.map((action) => {
                    const isSelected = settings.quickActionSlots.includes(action.id);
                    const IconComponent = ICON_MAP[action.icon] || Plus;
                    const isMaxed = settings.quickActionSlots.length >= 4 && !isSelected;

                    return (
                      <button
                        key={action.id}
                        onClick={() => toggleQuickAction(action.id)}
                        disabled={isMaxed}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-muted-foreground/50",
                          isMaxed && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <IconComponent className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-medium">{action.label}</span>
                        {isSelected && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {settings.quickActionSlots.indexOf(action.id) + 1}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {settings.quickActionSlots.length}/4 slots used
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === PRINTING TAB === */}
        <TabsContent value="printing" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" /> Print Configuration
              </CardTitle>
              <CardDescription>Setup your POS or office printer settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Default Printer Format</Label>
                  <p className="text-sm text-muted-foreground">Choose between thermal receipt or A4 invoice.</p>
                </div>
                <Select
                  value={settings.defaultPrinterType}
                  onValueChange={(v: any) => updateSetting('defaultPrinterType', v)}
                >
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Shop Address</Label>
                  <Input
                    value={settings.shopAddress}
                    onChange={(e) => updateSetting('shopAddress', e.target.value)}
                    placeholder="Address for receipts"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shop Phone</Label>
                  <Input
                    value={settings.shopPhone}
                    onChange={(e) => updateSetting('shopPhone', e.target.value)}
                    placeholder="Phone for receipts"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> Customer Communication
              </CardTitle>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* === PERFORMANCE TAB === */}
        <TabsContent value="performance" className="space-y-4 mt-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              These settings are ideal for <strong>field drivers</strong> with poor network connectivity
              or <strong>older devices</strong> that need faster navigation.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" /> Data Usage
              </CardTitle>
              <CardDescription>Reduce bandwidth consumption when on mobile data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Data Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduces image quality and disables avatars to save bandwidth.
                    Useful for 2G/3G connections.
                  </p>
                </div>
                <Switch
                  checked={settings.lowDataMode}
                  onCheckedChange={(c) => updateSetting('lowDataMode', c)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" /> Animation & Motion
              </CardTitle>
              <CardDescription>Speed up navigation by reducing visual effects.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reduce Motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Disables heavy animations for faster navigation on older devices.
                    Also helps users who are sensitive to motion.
                  </p>
                </div>
                <Switch
                  checked={settings.reduceMotion}
                  onCheckedChange={(c) => updateSetting('reduceMotion', c)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === SYSTEM TAB === */}
        <TabsContent value="system" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" /> System Data
              </CardTitle>
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

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Debug Mode</Label>
                  <p className="text-sm text-muted-foreground">Show additional logging and developer tools.</p>
                </div>
                <Switch
                  checked={settings.debugMode}
                  onCheckedChange={(c) => updateSetting('debugMode', c)}
                />
              </div>
            </CardContent>
          </Card>

          <Alert variant="default" className="bg-muted/50">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Settings are saved locally on this device.
              Clearing your browser cache will reset these preferences.
              They do not sync across devices.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
