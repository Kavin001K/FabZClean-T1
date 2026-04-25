import { Router } from "express";
import multer from "multer";
import { jwtRequired, requireRole } from "../middleware/auth";
import { storage } from "../storage";
import { businessConfigService } from "../services/business-config-service";
import {
  businessProfileSchema,
  storeConfigSchema,
  invoiceTemplateProfileSchema,
  tagTemplateProfileSchema,
} from "../../shared/business-config";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed"));
      return;
    }
    cb(null, true);
  },
});

function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    default:
      return "bin";
  }
}

async function uploadBrandingAsset(file: Express.Multer.File): Promise<string> {
  const supabase = (storage as any)?.supabase;
  if (!supabase) {
    throw new Error("Storage backend is not available");
  }

  const ext = extensionForMime(file.mimetype);
  const key = `logos/bill-logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("branding")
    .upload(key, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload logo to storage");
  }

  const { data } = supabase.storage.from("branding").getPublicUrl(key);
  if (!data?.publicUrl) {
    throw new Error("Failed to resolve uploaded logo URL");
  }

  return data.publicUrl;
}

// All routes require authentication
router.use(jwtRequired);

// --- Business Profile ---

router.get("/business-profile", async (_req, res) => {
  try {
    const profile = await businessConfigService.getBusinessProfile();
    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/business-profile", requireRole(["admin"]), async (req, res) => {
  try {
    const payload = businessProfileSchema.parse(req.body);
    const profile = await (storage as any).upsertBusinessProfile(payload);
    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post(
  "/business-profile/logo",
  requireRole(["admin"]),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No image uploaded" });
      }

      const logoUrl = await uploadBrandingAsset(req.file);
      const current = await businessConfigService.getBusinessProfile();
      const merged = businessProfileSchema.parse({
        ...current,
        invoiceDefaults: {
          ...(current?.invoiceDefaults || {}),
          logoUrl,
        },
      });

      const profile = await (storage as any).upsertBusinessProfile(merged);
      res.json({ success: true, profile });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Logo upload failed" });
    }
  }
);

// --- Stores ---

router.get("/stores", async (req, res) => {
  try {
    const activeOnly = req.query.activeOnly === "true";
    const stores = await (storage as any).listStores({ isActive: activeOnly ? true : undefined });
    res.json({ success: true, stores });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/stores", requireRole(["admin"]), async (req, res) => {
  try {
    const payload = storeConfigSchema.parse(req.body);
    const store = await (storage as any).createStore(payload);
    res.json({ success: true, store });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put("/stores/:id", requireRole(["admin"]), async (req, res) => {
  try {
    const payload = storeConfigSchema.partial().parse(req.body);
    const store = await (storage as any).updateStore(req.params.id, payload);
    res.json({ success: true, store });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// --- Invoice Templates ---

router.get("/invoice-templates", async (req, res) => {
  try {
    const storeId = req.query.storeId === "global" ? null : (req.query.storeId as string);
    const activeOnly = req.query.activeOnly === "true";
    const templates = await (storage as any).listInvoiceTemplates({
      storeId,
      isActive: activeOnly ? true : undefined,
    });
    res.json({ success: true, templates });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/invoice-templates/resolve", async (req, res) => {
  try {
    const params = {
      storeId: req.query.storeId as string,
      storeCode: req.query.storeCode as string,
      templateId: req.query.templateId as string,
      templateKey: req.query.templateKey as string,
    };
    const context = await businessConfigService.resolveInvoiceContext(params);
    res.json({ success: true, ...context });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/invoice-templates", requireRole(["admin"]), async (req, res) => {
  try {
    const payload = invoiceTemplateProfileSchema.parse(req.body);
    const template = await (storage as any).createInvoiceTemplate(payload);
    res.json({ success: true, template });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put("/invoice-templates/:id", requireRole(["admin"]), async (req, res) => {
  try {
    const payload = invoiceTemplateProfileSchema.partial().parse(req.body);
    const template = await (storage as any).updateInvoiceTemplate(req.params.id, payload);
    res.json({ success: true, template });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// --- Tag Templates ---

router.get("/tag-templates", async (req, res) => {
  try {
    const storeId = req.query.storeId === "global" ? null : (req.query.storeId as string);
    const activeOnly = req.query.activeOnly === "true";
    const templates = await (storage as any).listTagTemplates({
      storeId,
      isActive: activeOnly ? true : undefined,
    });
    res.json({ success: true, templates });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/tag-templates/resolve", async (req, res) => {
  try {
    const storeId = req.query.storeId === "global" ? null : (req.query.storeId as string);
    const templateId = req.query.templateId as string;
    const templateKey = req.query.templateKey as string;

    const store = storeId ? await (storage as any).getStore(storeId) : null;
    const templates = await (storage as any).listTagTemplates({ storeId, isActive: true });

    let template = null;
    if (templateId) {
      template = await (storage as any).getTagTemplate(templateId);
    } else if (templateKey) {
      template = templates.find((t: any) => t.templateKey === templateKey);
    } else {
      template = templates.find((t: any) => t.isDefault) || templates[0];
    }

    res.json({
      success: true,
      store: store ? storeConfigSchema.parse(store) : null,
      template: template ? tagTemplateProfileSchema.parse(template) : null,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/tag-templates", requireRole(["admin"]), async (req, res) => {
  try {
    const payload = tagTemplateProfileSchema.parse(req.body);
    const template = await (storage as any).createTagTemplate(payload);
    res.json({ success: true, template });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put("/tag-templates/:id", requireRole(["admin"]), async (req, res) => {
  try {
    const payload = tagTemplateProfileSchema.partial().parse(req.body);
    const template = await (storage as any).updateTagTemplate(req.params.id, payload);
    res.json({ success: true, template });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
