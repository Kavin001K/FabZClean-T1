/**
 * Print Configuration Component
 * Settings panel for managing print preferences
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  getPrintSettings,
  savePrintSettings,
  getCompanyInfo,
  saveCompanyInfo,
  PrintSettings,
  CompanyInfo,
} from '@/lib/print-service';
import { Settings, Building2, FileText, Save, RotateCcw } from 'lucide-react';

export default function PrintConfiguration() {
  const { toast } = useToast();
  const [printSettings, setPrintSettings] = useState<PrintSettings>(getPrintSettings());
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(getCompanyInfo());

  useEffect(() => {
    setPrintSettings(getPrintSettings());
    setCompanyInfo(getCompanyInfo());
  }, []);

  const handleSavePrintSettings = () => {
    savePrintSettings(printSettings);
    toast({
      title: 'Settings Saved',
      description: 'Print settings have been saved successfully.',
    });
  };

  const handleSaveCompanyInfo = () => {
    saveCompanyInfo(companyInfo);
    toast({
      title: 'Company Info Saved',
      description: 'Company information has been saved successfully.',
    });
  };

  const handleResetPrintSettings = () => {
    const defaultSettings: PrintSettings = {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      includeHeader: true,
      includeFooter: true,
      includeLogo: true,
      colorPrint: true,
    };
    setPrintSettings(defaultSettings);
    savePrintSettings(defaultSettings);
    toast({
      title: 'Settings Reset',
      description: 'Print settings have been reset to defaults.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Print Configuration</h2>
        <p className="text-muted-foreground">
          Configure print settings and company information for all printed documents
        </p>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Print Settings
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building2 className="h-4 w-4 mr-2" />
            Company Info
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Print Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Print Settings</CardTitle>
              <CardDescription>
                Configure default settings for all printed documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Page Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Page Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pageSize">Page Size</Label>
                    <Select
                      value={printSettings.pageSize}
                      onValueChange={(value: any) =>
                        setPrintSettings({ ...printSettings, pageSize: value })
                      }
                    >
                      <SelectTrigger id="pageSize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4 (210 x 297 mm)</SelectItem>
                        <SelectItem value="A5">A5 (148 x 210 mm)</SelectItem>
                        <SelectItem value="Letter">Letter (8.5 x 11 in)</SelectItem>
                        <SelectItem value="Legal">Legal (8.5 x 14 in)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orientation">Orientation</Label>
                    <Select
                      value={printSettings.orientation}
                      onValueChange={(value: any) =>
                        setPrintSettings({ ...printSettings, orientation: value })
                      }
                    >
                      <SelectTrigger id="orientation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
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
                      value={printSettings.margins.top}
                      onChange={(e) =>
                        setPrintSettings({
                          ...printSettings,
                          margins: {
                            ...printSettings.margins,
                            top: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="marginBottom">Bottom</Label>
                    <Input
                      id="marginBottom"
                      type="number"
                      value={printSettings.margins.bottom}
                      onChange={(e) =>
                        setPrintSettings({
                          ...printSettings,
                          margins: {
                            ...printSettings.margins,
                            bottom: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="marginLeft">Left</Label>
                    <Input
                      id="marginLeft"
                      type="number"
                      value={printSettings.margins.left}
                      onChange={(e) =>
                        setPrintSettings({
                          ...printSettings,
                          margins: {
                            ...printSettings.margins,
                            left: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="marginRight">Right</Label>
                    <Input
                      id="marginRight"
                      type="number"
                      value={printSettings.margins.right}
                      onChange={(e) =>
                        setPrintSettings({
                          ...printSettings,
                          margins: {
                            ...printSettings.margins,
                            right: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Display Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Display Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="includeHeader">Include Header</Label>
                      <p className="text-sm text-muted-foreground">
                        Show company logo and document title
                      </p>
                    </div>
                    <Switch
                      id="includeHeader"
                      checked={printSettings.includeHeader}
                      onCheckedChange={(checked) =>
                        setPrintSettings({ ...printSettings, includeHeader: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="includeFooter">Include Footer</Label>
                      <p className="text-sm text-muted-foreground">
                        Show print date and page numbers
                      </p>
                    </div>
                    <Switch
                      id="includeFooter"
                      checked={printSettings.includeFooter}
                      onCheckedChange={(checked) =>
                        setPrintSettings({ ...printSettings, includeFooter: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="includeLogo">Include Logo</Label>
                      <p className="text-sm text-muted-foreground">
                        Display company logo in header
                      </p>
                    </div>
                    <Switch
                      id="includeLogo"
                      checked={printSettings.includeLogo}
                      onCheckedChange={(checked) =>
                        setPrintSettings({ ...printSettings, includeLogo: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="colorPrint">Color Printing</Label>
                      <p className="text-sm text-muted-foreground">
                        Use colors in printed documents
                      </p>
                    </div>
                    <Switch
                      id="colorPrint"
                      checked={printSettings.colorPrint}
                      onCheckedChange={(checked) =>
                        setPrintSettings({ ...printSettings, colorPrint: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button onClick={handleSavePrintSettings} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
                <Button variant="outline" onClick={handleResetPrintSettings}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Info Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                This information will appear on all printed documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyInfo.name}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, name: e.target.value })
                    }
                    placeholder="FabzClean Services"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={companyInfo.address}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, address: e.target.value })
                    }
                    placeholder="123 Business Street, City, State 12345"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={companyInfo.phone}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, phone: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyInfo.email}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, email: e.target.value })
                      }
                      placeholder="info@fabzclean.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      value={companyInfo.website || ''}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, website: e.target.value })
                      }
                      placeholder="www.fabzclean.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID (Optional)</Label>
                    <Input
                      id="taxId"
                      value={companyInfo.taxId || ''}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, taxId: e.target.value })
                      }
                      placeholder="TAX-123456789"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL (Optional)</Label>
                  <Input
                    id="logo"
                    value={companyInfo.logo || ''}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, logo: e.target.value })
                    }
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a URL to your company logo. Recommended size: 200x80px
                  </p>
                </div>
              </div>

              <Separator />

              <Button onClick={handleSaveCompanyInfo} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Company Information
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Print Templates</CardTitle>
              <CardDescription>
                Available print templates for different document types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {[
                  {
                    name: 'Invoice',
                    description: 'Professional invoice with itemized billing',
                    icon: '📄',
                  },
                  {
                    name: 'Receipt',
                    description: 'Simple receipt for point of sale',
                    icon: '🧾',
                  },
                  {
                    name: 'Customer Report',
                    description: 'Detailed customer activity report',
                    icon: '👥',
                  },
                  {
                    name: 'Service Catalog',
                    description: 'Complete listing of available services',
                    icon: '📋',
                  },
                  {
                    name: 'Inventory Report',
                    description: 'Stock levels and inventory valuation',
                    icon: '📦',
                  },
                  {
                    name: 'Financial Statement',
                    description: 'Profit & loss and balance sheet',
                    icon: '💰',
                  },
                ].map((template, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{template.icon}</div>
                      <div>
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Preview
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
