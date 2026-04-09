import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSettings, Theme, LandingPage, AVAILABLE_QUICK_ACTIONS } from '@/contexts/settings-context';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Moon, Sun, Laptop, Plus, Search, Receipt,
  FileText, Settings, Loader2, Building2, Store, Tags, Sparkles, Save, Upload, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  businessConfigApi,
  getBillingCache,
} from '@/lib/business-config-service';
import {
  DEFAULT_INVOICE_TEMPLATE_CONFIG,
  DEFAULT_TAG_TEMPLATE_CONFIG,
  invoiceTemplateProfileSchema,
  storeConfigSchema,
  tagTemplateProfileSchema,
  type BusinessProfile,
  type InvoiceTemplateProfile,
  type StoreConfig,
  type TagTemplateProfile,
} from '@shared/business-config';
import InvoiceTemplateIN from '@/components/print/invoice-template-in';
import { ThermalTagLabel, prepareThermalTags } from '@/lib/garment-tag-layout';
import { useToast } from '@/hooks/use-toast';

const ICON_MAP: Record<string, React.ElementType> = {
  'new-order': Plus,
  'active-orders': Receipt,
  'customer-search': Search,
  'services': Settings,
  'print-queue': FileText,
};

const SAMPLE_INVOICE_DATA = {
  invoiceNumber: 'POL-FZC-2026POL0001A',
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: new Date().toISOString().split('T')[0],
  company: {
    name: 'FabZClean',
    address: '#16, Venkatramana Round Road, Pollachi',
    phone: '+91 93630 59595',
    email: 'support@myfabclean.com',
    taxId: '33AITPD3522F1ZK',
    logo: '/assets/logo.webp',
  },
  customer: {
    name: 'Sample Customer',
    address: '12 Market Street, Pollachi',
    phone: '+91 90000 11111',
    email: 'sample@customer.com',
  },
  items: [
    { description: 'Shirt / Dry Clean', quantity: 3, unitPrice: 80, total: 240, note: 'Collar stain check', hsn: '998314' },
    { description: 'Silk Saree', quantity: 1, unitPrice: 180, total: 180, hsn: '998314' },
  ],
  subtotal: 420,
  taxAmount: 75.6,
  total: 495.6,
  paymentTerms: 'Collect on pickup',
  notes: 'Ready after quality check',
  qrCode: '',
  fulfillmentType: 'pickup',
};

export default function SettingsPage() {
  useEffect(() => {
    document.title = "Settings | FabzClean";
  }, []);

  const { settings, updateSetting, isLoading, isSaving } = useSettings();
  const { employee, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const businessLogoInputRef = useRef<HTMLInputElement>(null);
  const storeLogoInputRef = useRef<HTMLInputElement>(null);

  const { data: businessProfile } = useQuery({
    queryKey: ['business-profile'],
    queryFn: () => businessConfigApi.getBusinessProfile(),
    enabled: isAdmin,
    initialData: getBillingCache().businessProfile,
  });

  const { data: stores = [] } = useQuery<StoreConfig[]>({
    queryKey: ['stores-admin'],
    queryFn: () => businessConfigApi.listStores(false),
    enabled: isAdmin,
    initialData: getBillingCache().stores || [],
  });

  const { data: invoiceTemplates = [] } = useQuery<InvoiceTemplateProfile[]>({
    queryKey: ['invoice-templates-admin'],
    queryFn: () => businessConfigApi.listInvoiceTemplates(undefined, false),
    enabled: isAdmin,
    initialData: getBillingCache().invoiceTemplates || [],
  });

  const { data: tagTemplates = [] } = useQuery<TagTemplateProfile[]>({
    queryKey: ['tag-templates-admin'],
    queryFn: () => businessConfigApi.listTagTemplates(undefined, false),
    enabled: isAdmin,
    initialData: getBillingCache().tagTemplates || [],
  });

  const [profileDraft, setProfileDraft] = useState<BusinessProfile | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('new');
  const [storeDraft, setStoreDraft] = useState<Partial<StoreConfig>>({
    code: '',
    name: '',
    shortName: '',
    isActive: true,
    isDefault: false,
    sortOrder: 0,
    address: {},
    contactDetails: {},
    legalDetails: {},
    invoiceOverrides: {},
    tagOverrides: {},
  });
  const [selectedInvoiceTemplateId, setSelectedInvoiceTemplateId] = useState<string>('new');
  const [invoiceTemplateDraft, setInvoiceTemplateDraft] = useState<Partial<InvoiceTemplateProfile>>({
    templateKey: '',
    name: '',
    description: '',
    presetKey: 'classic',
    storeId: null,
    isActive: true,
    isDefault: false,
    sortOrder: 0,
    config: { ...DEFAULT_INVOICE_TEMPLATE_CONFIG },
  });
  const [selectedTagTemplateId, setSelectedTagTemplateId] = useState<string>('new');
  const [tagTemplateDraft, setTagTemplateDraft] = useState<Partial<TagTemplateProfile>>({
    templateKey: '',
    name: '',
    description: '',
    layoutKey: 'thermal_compact',
    storeId: null,
    isActive: true,
    isDefault: false,
    sortOrder: 0,
    config: { ...DEFAULT_TAG_TEMPLATE_CONFIG },
  });

  useEffect(() => {
    if (businessProfile) {
      setProfileDraft(businessProfile);
    }
  }, [businessProfile]);

  useEffect(() => {
    if (selectedStoreId === 'new') {
      setStoreDraft({
        code: '',
        name: '',
        shortName: '',
        isActive: true,
        isDefault: false,
        sortOrder: stores.length + 1,
        address: {},
        contactDetails: {},
        legalDetails: {},
        invoiceOverrides: {},
        tagOverrides: {},
      });
      return;
    }

    const current = stores.find((store) => store.id === selectedStoreId);
    if (current) {
      setStoreDraft(current);
    }
  }, [selectedStoreId, stores]);

  useEffect(() => {
    if (selectedInvoiceTemplateId === 'new') {
      setInvoiceTemplateDraft({
        templateKey: '',
        name: '',
        description: '',
        presetKey: 'classic',
        storeId: null,
        isActive: true,
        isDefault: false,
        sortOrder: invoiceTemplates.length + 1,
        config: { ...DEFAULT_INVOICE_TEMPLATE_CONFIG },
      });
      return;
    }

    const current = invoiceTemplates.find((template) => template.id === selectedInvoiceTemplateId);
    if (current) {
      setInvoiceTemplateDraft({
        ...current,
        config: { ...DEFAULT_INVOICE_TEMPLATE_CONFIG, ...(current.config || {}) },
      });
    }
  }, [selectedInvoiceTemplateId, invoiceTemplates]);

  useEffect(() => {
    if (selectedTagTemplateId === 'new') {
      setTagTemplateDraft({
        templateKey: '',
        name: '',
        description: '',
        layoutKey: 'thermal_compact',
        storeId: null,
        isActive: true,
        isDefault: false,
        sortOrder: tagTemplates.length + 1,
        config: { ...DEFAULT_TAG_TEMPLATE_CONFIG },
      });
      return;
    }

    const current = tagTemplates.find((template) => template.id === selectedTagTemplateId);
    if (current) {
      setTagTemplateDraft({
        ...current,
        config: { ...DEFAULT_TAG_TEMPLATE_CONFIG, ...(current.config || {}) },
      });
    }
  }, [selectedTagTemplateId, tagTemplates]);

  const saveBusinessProfile = useMutation({
    mutationFn: (payload: Partial<BusinessProfile>) => businessConfigApi.updateBusinessProfile(payload),
    onSuccess: (profile) => {
      setProfileDraft(profile);
      queryClient.invalidateQueries({ queryKey: ['business-profile'] });
    },
  });

  const uploadBusinessLogo = useMutation({
    mutationFn: (file: File) => businessConfigApi.uploadBusinessLogo(file),
    onSuccess: async (profile) => {
      setProfileDraft(profile);
      await queryClient.invalidateQueries({ queryKey: ['business-profile'] });
      toast({
        title: 'Business Logo Updated',
        description: 'The next generated invoice will use the uploaded logo.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Logo Upload Failed',
        description: error.message || 'Could not upload the business logo.',
        variant: 'destructive',
      });
    },
  });

  const saveStore = useMutation({
    mutationFn: async (payload: Partial<StoreConfig>) => {
      return selectedStoreId === 'new'
        ? businessConfigApi.createStore(payload)
        : businessConfigApi.updateStore(selectedStoreId, payload);
    },
    onSuccess: async (store) => {
      setSelectedStoreId(store.id || 'new');
      await queryClient.invalidateQueries({ queryKey: ['stores-admin'] });
      await queryClient.invalidateQueries({ queryKey: ['active-stores'] });
    },
  });

  const uploadStoreLogo = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => businessConfigApi.uploadStoreLogo(id, file),
    onSuccess: async (store) => {
      setStoreDraft(store);
      setSelectedStoreId(store.id || 'new');
      await queryClient.invalidateQueries({ queryKey: ['stores-admin'] });
      await queryClient.invalidateQueries({ queryKey: ['active-stores'] });
      toast({
        title: 'Store Logo Updated',
        description: 'Store-specific bills will now use the uploaded logo.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Store Logo Upload Failed',
        description: error.message || 'Could not upload the store logo.',
        variant: 'destructive',
      });
    },
  });

  const saveInvoiceTemplate = useMutation({
    mutationFn: async (payload: Partial<InvoiceTemplateProfile>) => {
      return selectedInvoiceTemplateId === 'new'
        ? businessConfigApi.createInvoiceTemplate(payload)
        : businessConfigApi.updateInvoiceTemplate(selectedInvoiceTemplateId, payload);
    },
    onSuccess: async (template) => {
      setSelectedInvoiceTemplateId(template.id || 'new');
      await queryClient.invalidateQueries({ queryKey: ['invoice-templates-admin'] });
    },
  });

  const saveTagTemplate = useMutation({
    mutationFn: async (payload: Partial<TagTemplateProfile>) => {
      return selectedTagTemplateId === 'new'
        ? businessConfigApi.createTagTemplate(payload)
        : businessConfigApi.updateTagTemplate(selectedTagTemplateId, payload);
    },
    onSuccess: async (template) => {
      setSelectedTagTemplateId(template.id || 'new');
      await queryClient.invalidateQueries({ queryKey: ['tag-templates-admin'] });
    },
  });

  const sampleTag = useMemo(
    () =>
      prepareThermalTags({
        orderNumber: 'FZC-2026POL0001A',
        customerName: 'Sample Customer',
        storeCode: 'POL',
        billDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        templateConfig: tagTemplateDraft.config,
        items: [
          {
            orderNumber: 'FZC-2026POL0001A',
            serviceName: 'Silk Saree',
            quantity: 1,
            tagNote: 'Handle gently',
          },
        ],
      })[0],
    [tagTemplateDraft.config]
  );

  const invoicePreviewData = useMemo(() => {
    const scopedStore = stores.find((store) => store.id === invoiceTemplateDraft.storeId);
    const resolvedLogoUrl =
      String((scopedStore?.invoiceOverrides as any)?.logoUrl || '') ||
      profileDraft?.invoiceDefaults.logoUrl ||
      SAMPLE_INVOICE_DATA.company.logo;

    return {
      ...SAMPLE_INVOICE_DATA,
      company: {
        ...SAMPLE_INVOICE_DATA.company,
        name: scopedStore?.name || profileDraft?.companyName || SAMPLE_INVOICE_DATA.company.name,
        address: scopedStore?.address?.line1
          ? [scopedStore.address.line1, scopedStore.address.line2, scopedStore.address.city].filter(Boolean).join(', ')
          : [profileDraft?.companyAddress.line1, profileDraft?.companyAddress.line2, profileDraft?.companyAddress.city].filter(Boolean).join(', ') || SAMPLE_INVOICE_DATA.company.address,
        phone: scopedStore?.contactDetails?.phone || profileDraft?.contactDetails.phone || SAMPLE_INVOICE_DATA.company.phone,
        email: scopedStore?.contactDetails?.email || profileDraft?.contactDetails.email || SAMPLE_INVOICE_DATA.company.email,
        logo: resolvedLogoUrl,
      },
      qrCode: '',
      isExpressOrder: invoiceTemplateDraft.presetKey === 'express',
      isUpdate: invoiceTemplateDraft.presetKey === 'edited',
      notes: invoiceTemplateDraft.presetKey === 'edited'
        ? 'This preview shows how revised item notes and updated totals are framed.'
        : SAMPLE_INVOICE_DATA.notes,
    };
  }, [invoiceTemplateDraft.presetKey, invoiceTemplateDraft.storeId, profileDraft, stores]);

  const triggerLogoSelection = (target: 'business' | 'store') => {
    if (target === 'business') {
      businessLogoInputRef.current?.click();
      return;
    }
    storeLogoInputRef.current?.click();
  };

  const handleBusinessLogoSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadBusinessLogo.mutate(file);
    event.target.value = '';
  };

  const handleStoreLogoSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !storeDraft.id) return;
    uploadStoreLogo.mutate({ id: storeDraft.id, file });
    event.target.value = '';
  };

  const selectedStoreLabel = (storeId?: string | null) => {
    if (!storeId) return 'Global';
    const store = stores.find((entry) => entry.id === storeId);
    return store ? `${store.code} · ${store.name}` : 'Store';
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container-desktop min-h-screen py-8 pb-20 sm:pb-8 gradient-mesh">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings Studio</h1>
            <Badge variant="outline" className={cn("px-3 py-1 text-xs", isSaving ? "border-primary/30 text-primary" : "border-emerald-200 text-emerald-600")}>
              {isSaving ? "Saving..." : "Saved"}
            </Badge>
            {isAdmin && <Badge className="bg-primary/10 text-primary border-primary/20">Admin</Badge>}
          </div>
          <p className="text-muted-foreground">
            Personal workspace settings stay instant. Business, store, invoice, and tag settings update what the next generated bill will use.
          </p>
        </div>

        <Tabs defaultValue="workspace" className="w-full">
          <TabsList className={cn("grid w-full lg:w-full", isAdmin ? "grid-cols-5" : "grid-cols-1")}>
            <TabsTrigger value="workspace" className="gap-2">
              <Laptop className="h-4 w-4" />
              Workspace
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="business" className="gap-2">
                <Building2 className="h-4 w-4" />
                Business Profile
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="stores" className="gap-2">
                <Store className="h-4 w-4" />
                Stores
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="invoice" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Invoice Studio
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="tags" className="gap-2">
                <Tags className="h-4 w-4" />
                Tag Studio
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="workspace" className="space-y-6 mt-6">
            <Card className="glass border-none shadow-xl overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-500" />
                  Theme & Workflow
                </CardTitle>
                <CardDescription>Per-user preferences stored against {employee?.username || 'your account'}.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-base">Color Theme</Label>
                    <p className="text-sm text-muted-foreground">Switch between light, dark, or system.</p>
                  </div>
                  <div className="flex bg-muted p-1 rounded-xl w-fit">
                    {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                      <Button
                        key={t}
                        variant={settings.theme === t ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => updateSetting('theme', t)}
                        className={cn("rounded-lg capitalize px-4 h-9", settings.theme === t && "shadow-lg bg-primary text-primary-foreground")}
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

                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-base">Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">Reduce spacing to fit more information on screen.</p>
                  </div>
                  <Switch checked={settings.compactMode} onCheckedChange={(c) => updateSetting('compactMode', c)} className="data-[state=checked]:bg-primary" />
                </div>

                <Separator className="bg-white/5" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-base">Default Landing Page</Label>
                    <p className="text-sm text-muted-foreground">First screen after login.</p>
                  </div>
                  <Select value={settings.landingPage} onValueChange={(v: LandingPage) => updateSetting('landingPage', v)}>
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

                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <Label className="text-base">Dashboard Quick Actions</Label>
                      <p className="text-sm text-muted-foreground">Pick up to 4 shortcuts for your dashboard.</p>
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
                            isSelected ? "border-primary bg-primary/10 shadow-lg shadow-primary/5" : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10",
                            isMaxed && "opacity-40 cursor-not-allowed grayscale"
                          )}
                        >
                          <div className={cn("p-2.5 rounded-xl transition-colors", isSelected ? "bg-primary text-primary-foreground shadow-md" : "bg-white/5 text-muted-foreground group-hover:text-primary")}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className={cn("text-sm font-semibold transition-colors", isSelected ? "text-primary" : "text-foreground group-hover:text-primary")}>
                              {action.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && profileDraft && (
            <TabsContent value="business" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Profile</CardTitle>
                  <CardDescription>Global defaults used when a store does not override invoice content.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input value={profileDraft.companyName} onChange={(e) => setProfileDraft({ ...profileDraft, companyName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Legal Name</Label>
                    <Input value={profileDraft.legalName || ''} onChange={(e) => setProfileDraft({ ...profileDraft, legalName: e.target.value })} />
                  </div>
                  <div className="space-y-3 md:col-span-2 rounded-2xl border p-4">
                    <input ref={businessLogoInputRef} type="file" accept="image/*" className="hidden" onChange={handleBusinessLogoSelected} />
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <Label>Bill Logo</Label>
                        <p className="text-sm text-muted-foreground">Upload a PNG, JPG, or WebP logo for invoices. You can also paste a hosted URL below.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => triggerLogoSelection('business')} disabled={uploadBusinessLogo.isPending}>
                          {uploadBusinessLogo.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          Upload Logo
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={!profileDraft.invoiceDefaults.logoUrl}
                          onClick={() => setProfileDraft({ ...profileDraft, invoiceDefaults: { ...profileDraft.invoiceDefaults, logoUrl: '' } })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                      <div className="flex h-28 items-center justify-center rounded-xl border bg-muted/30 p-4">
                        {profileDraft.invoiceDefaults.logoUrl ? (
                          <img src={profileDraft.invoiceDefaults.logoUrl} alt="Business logo preview" className="max-h-20 w-full object-contain" />
                        ) : (
                          <p className="text-xs text-muted-foreground">No logo uploaded</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Logo URL</Label>
                        <Input
                          value={profileDraft.invoiceDefaults.logoUrl || ''}
                          onChange={(e) => setProfileDraft({ ...profileDraft, invoiceDefaults: { ...profileDraft.invoiceDefaults, logoUrl: e.target.value } })}
                          placeholder="https://example.com/logo.webp"
                        />
                        <p className="text-xs text-muted-foreground">Saved logo uploads populate this field automatically and are used for the next generated invoice only.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={profileDraft.contactDetails.phone || ''} onChange={(e) => setProfileDraft({ ...profileDraft, contactDetails: { ...profileDraft.contactDetails, phone: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp Number</Label>
                    <Input value={profileDraft.contactDetails.whatsappNumber || ''} onChange={(e) => setProfileDraft({ ...profileDraft, contactDetails: { ...profileDraft.contactDetails, whatsappNumber: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={profileDraft.contactDetails.email || ''} onChange={(e) => setProfileDraft({ ...profileDraft, contactDetails: { ...profileDraft.contactDetails, email: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input value={profileDraft.contactDetails.website || ''} onChange={(e) => setProfileDraft({ ...profileDraft, contactDetails: { ...profileDraft.contactDetails, website: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp Bill Message</Label>
                    <Input value={profileDraft.invoiceDefaults.whatsappBillMessage || ''} onChange={(e) => setProfileDraft({ ...profileDraft, invoiceDefaults: { ...profileDraft.invoiceDefaults, whatsappBillMessage: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Address Line 1</Label>
                    <Input value={profileDraft.companyAddress.line1 || ''} onChange={(e) => setProfileDraft({ ...profileDraft, companyAddress: { ...profileDraft.companyAddress, line1: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Address Line 2</Label>
                    <Input value={profileDraft.companyAddress.line2 || ''} onChange={(e) => setProfileDraft({ ...profileDraft, companyAddress: { ...profileDraft.companyAddress, line2: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={profileDraft.companyAddress.city || ''} onChange={(e) => setProfileDraft({ ...profileDraft, companyAddress: { ...profileDraft.companyAddress, city: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input value={profileDraft.companyAddress.state || ''} onChange={(e) => setProfileDraft({ ...profileDraft, companyAddress: { ...profileDraft.companyAddress, state: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input value={profileDraft.companyAddress.pincode || ''} onChange={(e) => setProfileDraft({ ...profileDraft, companyAddress: { ...profileDraft.companyAddress, pincode: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input value={profileDraft.companyAddress.country || ''} onChange={(e) => setProfileDraft({ ...profileDraft, companyAddress: { ...profileDraft.companyAddress, country: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>GSTIN</Label>
                    <Input value={profileDraft.taxDetails.gstin || ''} onChange={(e) => setProfileDraft({ ...profileDraft, taxDetails: { ...profileDraft.taxDetails, gstin: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>PAN</Label>
                    <Input value={profileDraft.taxDetails.pan || ''} onChange={(e) => setProfileDraft({ ...profileDraft, taxDetails: { ...profileDraft.taxDetails, pan: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>UPI ID</Label>
                    <Input value={profileDraft.paymentDetails.upiId || ''} onChange={(e) => setProfileDraft({ ...profileDraft, paymentDetails: { ...profileDraft.paymentDetails, upiId: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>UPI Display Name</Label>
                    <Input value={profileDraft.paymentDetails.upiName || ''} onChange={(e) => setProfileDraft({ ...profileDraft, paymentDetails: { ...profileDraft.paymentDetails, upiName: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input value={profileDraft.paymentDetails.bankName || ''} onChange={(e) => setProfileDraft({ ...profileDraft, paymentDetails: { ...profileDraft.paymentDetails, bankName: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Name</Label>
                    <Input value={profileDraft.paymentDetails.bankAccountName || ''} onChange={(e) => setProfileDraft({ ...profileDraft, paymentDetails: { ...profileDraft.paymentDetails, bankAccountName: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input value={profileDraft.paymentDetails.bankAccountNumber || ''} onChange={(e) => setProfileDraft({ ...profileDraft, paymentDetails: { ...profileDraft.paymentDetails, bankAccountNumber: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC</Label>
                    <Input value={profileDraft.paymentDetails.bankIfsc || ''} onChange={(e) => setProfileDraft({ ...profileDraft, paymentDetails: { ...profileDraft.paymentDetails, bankIfsc: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Branch</Label>
                    <Input value={profileDraft.paymentDetails.bankBranch || ''} onChange={(e) => setProfileDraft({ ...profileDraft, paymentDetails: { ...profileDraft.paymentDetails, bankBranch: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Due Days</Label>
                    <Input type="number" value={profileDraft.invoiceDefaults.defaultDueDays || 2} onChange={(e) => setProfileDraft({ ...profileDraft, invoiceDefaults: { ...profileDraft.invoiceDefaults, defaultDueDays: Number(e.target.value) || 0 } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pickup Wording</Label>
                    <Input value={profileDraft.invoiceDefaults.defaultPickupWording || ''} onChange={(e) => setProfileDraft({ ...profileDraft, invoiceDefaults: { ...profileDraft.invoiceDefaults, defaultPickupWording: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Print Copies</Label>
                    <Input type="number" value={profileDraft.invoiceDefaults.defaultPrintCopies || 1} onChange={(e) => setProfileDraft({ ...profileDraft, invoiceDefaults: { ...profileDraft.invoiceDefaults, defaultPrintCopies: Number(e.target.value) || 1 } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment QR Label</Label>
                    <Input value={profileDraft.invoiceDefaults.paymentQrLabel || ''} onChange={(e) => setProfileDraft({ ...profileDraft, invoiceDefaults: { ...profileDraft.invoiceDefaults, paymentQrLabel: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Invoice Template</Label>
                    <Select value={profileDraft.invoiceDefaults.defaultInvoiceTemplateKey || '__none'} onValueChange={(value) => setProfileDraft({ ...profileDraft, invoiceDefaults: { ...profileDraft.invoiceDefaults, defaultInvoiceTemplateKey: value === '__none' ? '' : value } })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">None</SelectItem>
                        {invoiceTemplates.filter((template) => !template.storeId).map((template) => (
                          <SelectItem key={template.id} value={template.templateKey}>{template.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Tag Template</Label>
                    <Select value={profileDraft.invoiceDefaults.defaultTagTemplateKey || '__none'} onValueChange={(value) => setProfileDraft({ ...profileDraft, invoiceDefaults: { ...profileDraft.invoiceDefaults, defaultTagTemplateKey: value === '__none' ? '' : value } })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">None</SelectItem>
                        {tagTemplates.filter((template) => !template.storeId).map((template) => (
                          <SelectItem key={template.id} value={template.templateKey}>{template.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-2 gap-3">
                    {[
                      ['showLogo', 'Show Logo'],
                      ['showStoreAddress', 'Store Address'],
                      ['showCustomerAddress', 'Customer Address'],
                      ['showItemNotes', 'Item Notes'],
                      ['showTerms', 'Terms Block'],
                      ['showPaymentQr', 'Payment QR'],
                      ['showPaymentBreakdown', 'Payment Breakdown'],
                      ['showGstBreakup', 'GST Breakup'],
                      ['showDeliveryBlock', 'Delivery Block'],
                      ['showSignature', 'Signature Footer'],
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between rounded-xl border p-3">
                        <Label>{label}</Label>
                        <Switch checked={Boolean((profileDraft.invoiceDefaults as any)?.[key])} onCheckedChange={(checked) => setProfileDraft({ ...profileDraft, invoiceDefaults: { ...profileDraft.invoiceDefaults, [key]: checked } })} />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Default Terms</Label>
                    <Textarea rows={3} value={profileDraft.invoiceDefaults.termsAndConditions || ''} onChange={(e) => setProfileDraft({ ...profileDraft, invoiceDefaults: { ...profileDraft.invoiceDefaults, termsAndConditions: e.target.value } })} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Footer Note</Label>
                    <Textarea rows={3} value={profileDraft.invoiceDefaults.footerNote || ''} onChange={(e) => setProfileDraft({ ...profileDraft, invoiceDefaults: { ...profileDraft.invoiceDefaults, footerNote: e.target.value } })} />
                  </div>
                  <div className="flex justify-end md:col-span-2">
                    <Button onClick={() => profileDraft && saveBusinessProfile.mutate(profileDraft)} disabled={saveBusinessProfile.isPending}>
                      {saveBusinessProfile.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Business Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="stores" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Stores</CardTitle>
                    <CardDescription>Pick a store to edit or create a new one.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant={selectedStoreId === 'new' ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setSelectedStoreId('new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Store
                    </Button>
                    {stores.map((store) => (
                      <button
                        key={store.id}
                        onClick={() => setSelectedStoreId(store.id || 'new')}
                        className={cn("w-full rounded-xl border p-3 text-left transition-colors", selectedStoreId === store.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{store.code} · {store.name}</p>
                          {store.isDefault && <Badge variant="secondary">Default</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{store.contactDetails.phone || 'No phone set'}</p>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{selectedStoreId === 'new' ? 'Create Store' : 'Edit Store'}</CardTitle>
                    <CardDescription>Store data appears on order selection and invoice output.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Code</Label>
                      <Input value={storeDraft.code || ''} onChange={(e) => setStoreDraft({ ...storeDraft, code: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={storeDraft.name || ''} onChange={(e) => setStoreDraft({ ...storeDraft, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Short Name</Label>
                      <Input value={storeDraft.shortName || ''} onChange={(e) => setStoreDraft({ ...storeDraft, shortName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={storeDraft.contactDetails?.phone || ''} onChange={(e) => setStoreDraft({ ...storeDraft, contactDetails: { ...storeDraft.contactDetails, phone: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={storeDraft.contactDetails?.email || ''} onChange={(e) => setStoreDraft({ ...storeDraft, contactDetails: { ...storeDraft.contactDetails, email: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Address Line 1</Label>
                      <Input value={storeDraft.address?.line1 || ''} onChange={(e) => setStoreDraft({ ...storeDraft, address: { ...storeDraft.address, line1: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Address Line 2</Label>
                      <Input value={storeDraft.address?.line2 || ''} onChange={(e) => setStoreDraft({ ...storeDraft, address: { ...storeDraft.address, line2: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input value={storeDraft.address?.city || ''} onChange={(e) => setStoreDraft({ ...storeDraft, address: { ...storeDraft.address, city: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input value={storeDraft.address?.state || ''} onChange={(e) => setStoreDraft({ ...storeDraft, address: { ...storeDraft.address, state: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Pincode</Label>
                      <Input value={storeDraft.address?.pincode || ''} onChange={(e) => setStoreDraft({ ...storeDraft, address: { ...storeDraft.address, pincode: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input value={storeDraft.address?.country || ''} onChange={(e) => setStoreDraft({ ...storeDraft, address: { ...storeDraft.address, country: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>GSTIN</Label>
                      <Input value={String(storeDraft.legalDetails?.gstin || '')} onChange={(e) => setStoreDraft({ ...storeDraft, legalDetails: { ...storeDraft.legalDetails, gstin: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>PAN</Label>
                      <Input value={String(storeDraft.legalDetails?.pan || '')} onChange={(e) => setStoreDraft({ ...storeDraft, legalDetails: { ...storeDraft.legalDetails, pan: e.target.value } })} />
                    </div>
                    <div className="space-y-3 md:col-span-2 rounded-2xl border p-4">
                      <input ref={storeLogoInputRef} type="file" accept="image/*" className="hidden" onChange={handleStoreLogoSelected} />
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <Label>Store Bill Logo</Label>
                          <p className="text-sm text-muted-foreground">Optional per-store override. If blank, the business logo is used.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => triggerLogoSelection('store')}
                            disabled={selectedStoreId === 'new' || uploadStoreLogo.isPending}
                          >
                            {uploadStoreLogo.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Upload Store Logo
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={!String(storeDraft.invoiceOverrides?.logoUrl || '')}
                            onClick={() => setStoreDraft({ ...storeDraft, invoiceOverrides: { ...storeDraft.invoiceOverrides, logoUrl: '' } })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                        <div className="flex h-28 items-center justify-center rounded-xl border bg-muted/30 p-4">
                          {String(storeDraft.invoiceOverrides?.logoUrl || '') ? (
                            <img src={String(storeDraft.invoiceOverrides?.logoUrl || '')} alt="Store logo preview" className="max-h-20 w-full object-contain" />
                          ) : (
                            <p className="text-xs text-muted-foreground">Using business logo</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Store Logo URL</Label>
                          <Input
                            value={String(storeDraft.invoiceOverrides?.logoUrl || '')}
                            onChange={(e) => setStoreDraft({ ...storeDraft, invoiceOverrides: { ...storeDraft.invoiceOverrides, logoUrl: e.target.value } })}
                            placeholder="https://example.com/store-logo.webp"
                          />
                          <p className="text-xs text-muted-foreground">
                            {selectedStoreId === 'new'
                              ? 'Create the store first if you want to upload an image file. URL-based override can be added now.'
                              : 'Uploaded logos save immediately for this store and are used on the next generated invoice.'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Store Footer Note</Label>
                      <Textarea rows={2} value={String(storeDraft.invoiceOverrides?.footerNote || '')} onChange={(e) => setStoreDraft({ ...storeDraft, invoiceOverrides: { ...storeDraft.invoiceOverrides, footerNote: e.target.value } })} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Pickup Instructions</Label>
                      <Textarea rows={2} value={String(storeDraft.invoiceOverrides?.pickupInstructions || '')} onChange={(e) => setStoreDraft({ ...storeDraft, invoiceOverrides: { ...storeDraft.invoiceOverrides, pickupInstructions: e.target.value } })} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>WhatsApp Bill Message</Label>
                      <Textarea rows={2} value={String(storeDraft.invoiceOverrides?.whatsappBillMessage || '')} onChange={(e) => setStoreDraft({ ...storeDraft, invoiceOverrides: { ...storeDraft.invoiceOverrides, whatsappBillMessage: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Default Invoice Template</Label>
                      <Select value={String(storeDraft.invoiceOverrides?.defaultInvoiceTemplateKey || '__none')} onValueChange={(value) => setStoreDraft({ ...storeDraft, invoiceOverrides: { ...storeDraft.invoiceOverrides, defaultInvoiceTemplateKey: value === '__none' ? '' : value } })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {invoiceTemplates.filter((template) => !template.storeId || template.storeId === storeDraft.id).map((template) => (
                            <SelectItem key={template.id} value={template.templateKey}>{template.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Default Tag Template</Label>
                      <Select value={String(storeDraft.invoiceOverrides?.defaultTagTemplateKey || storeDraft.tagOverrides?.defaultTagTemplateKey || '__none')} onValueChange={(value) => setStoreDraft({ ...storeDraft, tagOverrides: { ...storeDraft.tagOverrides, defaultTagTemplateKey: value === '__none' ? '' : value } })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {tagTemplates.filter((template) => !template.storeId || template.storeId === storeDraft.id).map((template) => (
                            <SelectItem key={template.id} value={template.templateKey}>{template.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Default Print Copies</Label>
                      <Input type="number" value={String(storeDraft.invoiceOverrides?.defaultPrintCopies || 1)} onChange={(e) => setStoreDraft({ ...storeDraft, invoiceOverrides: { ...storeDraft.invoiceOverrides, defaultPrintCopies: Number(e.target.value) || 1 } })} />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border p-3">
                      <div>
                        <p className="font-medium">Active</p>
                        <p className="text-xs text-muted-foreground">Hide inactive stores from order creation.</p>
                      </div>
                      <Switch checked={storeDraft.isActive ?? true} onCheckedChange={(checked) => setStoreDraft({ ...storeDraft, isActive: checked })} />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border p-3">
                      <div>
                        <p className="font-medium">Default Store</p>
                        <p className="text-xs text-muted-foreground">Used when user-specific store resolution fails.</p>
                      </div>
                      <Switch checked={storeDraft.isDefault ?? false} onCheckedChange={(checked) => setStoreDraft({ ...storeDraft, isDefault: checked })} />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <Button onClick={() => saveStore.mutate(storeDraft)} disabled={saveStore.isPending}>
                        {saveStore.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Store
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="invoice" className="mt-6">
              <div className="grid gap-6 xl:grid-cols-[340px_1fr_1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Templates</CardTitle>
                    <CardDescription>Preset-based templates with safe switches and per-store defaults.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant={selectedInvoiceTemplateId === 'new' ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setSelectedInvoiceTemplateId('new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Template
                    </Button>
                    {invoiceTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedInvoiceTemplateId(template.id || 'new')}
                        className={cn("w-full rounded-xl border p-3 text-left transition-colors", selectedInvoiceTemplateId === template.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">{template.name}</p>
                          {template.isDefault && <Badge variant="secondary">Default</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{template.presetKey} · {selectedStoreLabel(template.storeId)}</p>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Template Settings</CardTitle>
                    <CardDescription>What to show on the next generated invoice.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={invoiceTemplateDraft.name || ''} onChange={(e) => setInvoiceTemplateDraft({ ...invoiceTemplateDraft, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Template Key</Label>
                      <Input value={invoiceTemplateDraft.templateKey || ''} onChange={(e) => setInvoiceTemplateDraft({ ...invoiceTemplateDraft, templateKey: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={invoiceTemplateDraft.description || ''} onChange={(e) => setInvoiceTemplateDraft({ ...invoiceTemplateDraft, description: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Preset</Label>
                      <Select value={invoiceTemplateDraft.presetKey || 'classic'} onValueChange={(value) => setInvoiceTemplateDraft({ ...invoiceTemplateDraft, presetKey: value as InvoiceTemplateProfile['presetKey'] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="classic">Classic</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="compact">Compact</SelectItem>
                          <SelectItem value="express">Express</SelectItem>
                          <SelectItem value="edited">Edited Order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Scope</Label>
                      <Select value={invoiceTemplateDraft.storeId || 'global'} onValueChange={(value) => setInvoiceTemplateDraft({ ...invoiceTemplateDraft, storeId: value === 'global' ? null : value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">Global</SelectItem>
                          {stores.map((store) => <SelectItem key={store.id} value={store.id || ''}>{store.code} · {store.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ['showLogo', 'Show Logo'],
                        ['showStoreAddress', 'Store Address'],
                        ['showCustomerAddress', 'Customer Address'],
                        ['showItemNotes', 'Item Notes'],
                        ['showTerms', 'Terms'],
                        ['showPaymentQr', 'Payment QR'],
                        ['showPaymentBreakdown', 'Payment Breakdown'],
                        ['showGstBreakup', 'GST Breakup'],
                        ['showDeliveryBlock', 'Delivery Block'],
                        ['showSignature', 'Signature Footer'],
                      ].map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between rounded-xl border p-3">
                          <Label>{label}</Label>
                          <Switch
                            checked={Boolean((invoiceTemplateDraft.config || DEFAULT_INVOICE_TEMPLATE_CONFIG)[key as keyof typeof DEFAULT_INVOICE_TEMPLATE_CONFIG])}
                            onCheckedChange={(checked) => setInvoiceTemplateDraft({
                              ...invoiceTemplateDraft,
                              config: { ...DEFAULT_INVOICE_TEMPLATE_CONFIG, ...invoiceTemplateDraft.config, [key]: checked },
                            })}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label>Payment QR Label</Label>
                      <Input value={invoiceTemplateDraft.config?.paymentQrLabel || ''} onChange={(e) => setInvoiceTemplateDraft({ ...invoiceTemplateDraft, config: { ...DEFAULT_INVOICE_TEMPLATE_CONFIG, ...invoiceTemplateDraft.config, paymentQrLabel: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Footer Note</Label>
                      <Textarea rows={2} value={invoiceTemplateDraft.config?.footerNote || ''} onChange={(e) => setInvoiceTemplateDraft({ ...invoiceTemplateDraft, config: { ...DEFAULT_INVOICE_TEMPLATE_CONFIG, ...invoiceTemplateDraft.config, footerNote: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Terms</Label>
                      <Textarea rows={3} value={invoiceTemplateDraft.config?.termsAndConditions || ''} onChange={(e) => setInvoiceTemplateDraft({ ...invoiceTemplateDraft, config: { ...DEFAULT_INVOICE_TEMPLATE_CONFIG, ...invoiceTemplateDraft.config, termsAndConditions: e.target.value } })} />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border p-3">
                      <Label>Default Template</Label>
                      <Switch checked={invoiceTemplateDraft.isDefault ?? false} onCheckedChange={(checked) => setInvoiceTemplateDraft({ ...invoiceTemplateDraft, isDefault: checked })} />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => saveInvoiceTemplate.mutate(invoiceTemplateProfileSchema.parse(invoiceTemplateDraft))} disabled={saveInvoiceTemplate.isPending}>
                        {saveInvoiceTemplate.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Invoice Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                    <CardDescription>Preview scales down here, but the generated PDF keeps full size.</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-auto">
                    <div className="origin-top-left scale-[0.52] w-[190%]">
                      <InvoiceTemplateIN
                        data={invoicePreviewData as any}
                        preset={(invoiceTemplateDraft.presetKey || 'classic') as any}
                        config={invoiceTemplateDraft.config}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="tags" className="mt-6">
              <div className="grid gap-6 xl:grid-cols-[340px_1fr_320px]">
                <Card>
                  <CardHeader>
                    <CardTitle>Tag Templates</CardTitle>
                    <CardDescription>Safe thermal-tag toggles and note length rules.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant={selectedTagTemplateId === 'new' ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setSelectedTagTemplateId('new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Tag Template
                    </Button>
                    {tagTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTagTemplateId(template.id || 'new')}
                        className={cn("w-full rounded-xl border p-3 text-left transition-colors", selectedTagTemplateId === template.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">{template.name}</p>
                          {template.isDefault && <Badge variant="secondary">Default</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{selectedStoreLabel(template.storeId)}</p>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tag Rules</CardTitle>
                    <CardDescription>Control what shows on garment tags without allowing custom HTML/CSS.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={tagTemplateDraft.name || ''} onChange={(e) => setTagTemplateDraft({ ...tagTemplateDraft, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Template Key</Label>
                      <Input value={tagTemplateDraft.templateKey || ''} onChange={(e) => setTagTemplateDraft({ ...tagTemplateDraft, templateKey: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={tagTemplateDraft.description || ''} onChange={(e) => setTagTemplateDraft({ ...tagTemplateDraft, description: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Scope</Label>
                      <Select value={tagTemplateDraft.storeId || 'global'} onValueChange={(value) => setTagTemplateDraft({ ...tagTemplateDraft, storeId: value === 'global' ? null : value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">Global</SelectItem>
                          {stores.map((store) => <SelectItem key={store.id} value={store.id || ''}>{store.code} · {store.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ['showStoreCode', 'Store Code'],
                        ['showCustomerName', 'Customer'],
                        ['showOrderNumber', 'Order Number'],
                        ['showServiceName', 'Service'],
                        ['showDueDate', 'Due Date'],
                        ['showQuantity', 'Quantity'],
                        ['showTagNote', 'Tag Note'],
                      ].map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between rounded-xl border p-3">
                          <Label>{label}</Label>
                          <Switch
                            checked={Boolean((tagTemplateDraft.config || DEFAULT_TAG_TEMPLATE_CONFIG)[key as keyof typeof DEFAULT_TAG_TEMPLATE_CONFIG])}
                            onCheckedChange={(checked) => setTagTemplateDraft({
                              ...tagTemplateDraft,
                              config: { ...DEFAULT_TAG_TEMPLATE_CONFIG, ...tagTemplateDraft.config, [key]: checked },
                            })}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label>Max Note Characters</Label>
                      <Input type="number" value={tagTemplateDraft.config?.maxNoteChars || 32} onChange={(e) => setTagTemplateDraft({ ...tagTemplateDraft, config: { ...DEFAULT_TAG_TEMPLATE_CONFIG, ...tagTemplateDraft.config, maxNoteChars: Number(e.target.value) || 0 } })} />
                      <p className="text-xs text-muted-foreground">Notes longer than this are trimmed during preview and print.</p>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border p-3">
                      <Label>Default Template</Label>
                      <Switch checked={tagTemplateDraft.isDefault ?? false} onCheckedChange={(checked) => setTagTemplateDraft({ ...tagTemplateDraft, isDefault: checked })} />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => saveTagTemplate.mutate(tagTemplateProfileSchema.parse(tagTemplateDraft))} disabled={saveTagTemplate.isPending}>
                        {saveTagTemplate.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Tag Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tag Preview</CardTitle>
                    <CardDescription>Preview uses the same thermal layout renderer as printing.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center rounded-xl bg-neutral-900 p-4">
                    <div className="space-y-3">
                      {sampleTag ? <ThermalTagLabel tag={sampleTag} /> : <p className="text-sm text-muted-foreground">No tag preview</p>}
                      <p className="text-xs text-slate-300">Preview warnings: hidden fields are removed, missing optional data falls back safely, and long notes are clipped.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
