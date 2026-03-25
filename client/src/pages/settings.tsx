import { useEffect } from 'react';
import { useSettings, Theme, LandingPage, AVAILABLE_QUICK_ACTIONS } from '@/contexts/settings-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Moon, Sun, Laptop, Zap, 
  LayoutDashboard, Plus, Search, Receipt, 
  FileText, Users, Settings, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon map for quick actions
const ICON_MAP: Record<string, React.ElementType> = {
  'new-order': Plus,
  'active-orders': Receipt,
  'customer-search': Search,
  'services': Settings,
  'print-queue': FileText,
};

export default function SettingsPage() {
  useEffect(() => {
    document.title = "Settings | FabzClean";
  }, []);

  const { settings, updateSetting, isLoading } = useSettings();

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container-desktop min-h-screen py-8 pb-20 sm:pb-8 gradient-mesh">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Personal Settings
          </h1>
          <p className="text-muted-foreground">
            Customize your workspace. These settings are saved to your account and sync across all your devices.
          </p>
        </div>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="appearance" className="gap-2">
              <Laptop className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="workflow" className="gap-2">
              <Zap className="h-4 w-4" />
              Workflow
            </TabsTrigger>
          </TabsList>

          {/* === APPEARANCE TAB === */}
          <TabsContent value="appearance" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="glass border-none shadow-xl overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-500" />
                  Theme & Visuals
                </CardTitle>
                <CardDescription>Choose how FabZClean looks on your screen.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Theme Selection */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-base">Color Theme</Label>
                    <p className="text-sm text-muted-foreground">Switch between light, dark, or follow your system.</p>
                  </div>
                  <div className="flex bg-muted p-1 rounded-xl w-fit">
                    {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                      <Button
                        key={t}
                        variant={settings.theme === t ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => updateSetting('theme', t)}
                        className={cn(
                          "rounded-lg capitalize px-4 h-9",
                          settings.theme === t && "shadow-lg bg-primary text-primary-foreground"
                        )}
                      >
                        {t === 'light' && <Sun className="h-4 w-4 mr-2" />}
                        {t === 'dark' && <Moon className="h-4 w-4 mr-2" />}
                        {t === 'system' && <Laptop className="h-4 w-4 mr-2" />}
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator className="bg-white/5" />

                {/* Compact Mode */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-base">Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">Reduce spacing to fit more information on the screen.</p>
                  </div>
                  <Switch
                    checked={settings.compactMode}
                    onCheckedChange={(c) => updateSetting('compactMode', c)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === WORKFLOW TAB === */}
          <TabsContent value="workflow" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="glass border-none shadow-xl overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-indigo-500" />
                  Navigation & Shortcuts
                </CardTitle>
                <CardDescription>Optimize your daily workflow with custom shortcuts.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Default Landing Page */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-base">Default Landing Page</Label>
                    <p className="text-sm text-muted-foreground">The first page you see after logging in.</p>
                  </div>
                  <Select
                    value={settings.landingPage}
                    onValueChange={(v: LandingPage) => updateSetting('landingPage', v)}
                  >
                    <SelectTrigger className="w-full sm:w-[220px] rounded-xl glass border-white/10 shadow-inner">
                      <SelectValue placeholder="Select page" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-white/10 glass shadow-2xl">
                      <SelectItem value="/dashboard">Dashboard Overview</SelectItem>
                      <SelectItem value="/orders">Orders Management</SelectItem>
                      <SelectItem value="/create-order">New Order Creation</SelectItem>
                      <SelectItem value="/customers">Customer Database</SelectItem>
                      <SelectItem value="/services">Services & Pricing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="bg-white/5" />

                {/* Quick Actions Selector */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <Label className="text-base">Dashboard Quick Actions</Label>
                      <p className="text-sm text-muted-foreground">
                        Select up to 4 shortcuts for your main dashboard.
                      </p>
                    </div>
                    <Badge variant="outline" className="w-fit py-1 px-3 border-primary/20 bg-primary/5 text-primary">
                      {settings.quickActions.length} / 4 Selected
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {AVAILABLE_QUICK_ACTIONS.map((action) => {
                      const isSelected = settings.quickActions.includes(action.id);
                      const IconComponent = ICON_MAP[action.id] || Plus;
                      const isMaxed = settings.quickActions.length >= 4 && !isSelected;

                      return (
                        <button
                          key={action.id}
                          onClick={() => {
                            if (isSelected) {
                              updateSetting('quickActions', settings.quickActions.filter(id => id !== action.id));
                            } else if (!isMaxed) {
                              updateSetting('quickActions', [...settings.quickActions, action.id]);
                            }
                          }}
                          disabled={isMaxed}
                          className={cn(
                            "group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-lg shadow-primary/5"
                              : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10",
                            isMaxed && "opacity-40 cursor-not-allowed grayscale"
                          )}
                        >
                          <div className={cn(
                            "p-2.5 rounded-xl transition-colors",
                            isSelected ? "bg-primary text-primary-foreground shadow-md" : "bg-white/5 text-muted-foreground group-hover:text-primary"
                          )}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className={cn(
                              "text-sm font-semibold transition-colors",
                              isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                            )}>
                              {action.label}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
