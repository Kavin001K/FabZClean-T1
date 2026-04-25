import { Router } from "express";
import { z } from "zod";
import { db as storage } from "../db";
import { jwtRequired } from "../middleware/auth";
import { createErrorResponse, createSuccessResponse } from "../services/serialization";
import { normalizePhoneForComparison, sanitizePhoneForStorage } from "../../shared/customer-phone";

const protectedBookingsRouter = Router();
const publicBookingsRouter = Router();
let bookingSchemaCapabilitiesCache: { hasBookingId: boolean; hasCustomerId: boolean; checkedAt: number } | null = null;

protectedBookingsRouter.use(jwtRequired);

const STORE_CODES = ["POL", "KIN", "MCET", "UDM"] as const;

const bookingItemSchema = z.object({
  serviceName: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0).optional(),
  note: z.string().optional().nullable(),
});

const publicBookingSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  customerEmail: z.string().email().optional().nullable(),
  source: z.string().default("website"),
  channel: z.string().default("web"),
  storeCode: z.enum(STORE_CODES).optional().nullable(),
  preferredDate: z.string().optional().nullable(),
  preferredSlot: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  pickupAddress: z.union([z.string(), z.record(z.any())]).optional().nullable(),
  weatherSnapshot: z.record(z.any()).optional().nullable(),
  operationalSuggestionSnapshot: z.union([z.array(z.string()), z.record(z.any())]).optional().nullable(),
  items: z.array(bookingItemSchema).optional().default([]),
});

const bookingPatchSchema = z.object({
  status: z.enum(["new", "confirmed", "converted", "cancelled", "processing", "assigned"]).optional(),
  storeCode: z.enum(STORE_CODES).optional().nullable(),
  notes: z.string().optional().nullable(),
  conversionNote: z.string().optional().nullable(),
});

function normalizeStoreCode(value?: string | null): string | null {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) return null;
  return STORE_CODES.includes(raw as any) ? raw : null;
}

function toDateIsoString(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function formatBookingForClient(row: any) {
  return {
    id: row.id,
    bookingId: row.booking_id || row.request_number || null,
    requestNumber: row.request_number || null,
    source: row.source || "website",
    channel: row.channel || "web",
    storeCode: row.store_code || null,
    customerId: row.customer_id || null,
    customerName: row.customer_name || "",
    customerPhone: row.customer_phone || "",
    customerEmail: row.customer_email || null,
    pickupAddress: row.pickup_address || null,
    preferredDate: row.preferred_date || null,
    preferredSlot: row.preferred_slot || null,
    notes: row.notes || null,
    status: row.status || "new",
    convertedOrderId: row.converted_order_id || null,
    convertedAt: row.converted_at || null,
    conversionNote: row.conversion_note || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

async function getBookingSchemaCapabilities(supabase: any) {
  const now = Date.now();
  if (bookingSchemaCapabilitiesCache && now - bookingSchemaCapabilitiesCache.checkedAt < 60_000) {
    return bookingSchemaCapabilitiesCache;
  }

  const fallback = {
    hasBookingId: false,
    hasCustomerId: false,
    checkedAt: now,
  };

  try {
    const [bookingIdProbe, customerIdProbe] = await Promise.all([
      supabase.from("booking_requests").select("booking_id").limit(1),
      supabase.from("booking_requests").select("customer_id").limit(1),
    ]);

    const bookingIdError = String(bookingIdProbe?.error?.message || "").toLowerCase();
    const customerIdError = String(customerIdProbe?.error?.message || "").toLowerCase();
    bookingSchemaCapabilitiesCache = {
      hasBookingId: !bookingIdError.includes("does not exist"),
      hasCustomerId: !customerIdError.includes("does not exist"),
      checkedAt: now,
    };
    return bookingSchemaCapabilitiesCache;
  } catch {
    bookingSchemaCapabilitiesCache = fallback;
    return fallback;
  }
}

async function resolveOrCreateCustomerId(input: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  pickupAddress?: any;
}) {
  const phoneNormalized = normalizePhoneForComparison(input.customerPhone);
  if (!phoneNormalized) return null;

  const queryResult = await (storage as any).listCustomers(undefined, {
    search: phoneNormalized,
    limit: 200,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const candidates = Array.isArray(queryResult?.data) ? queryResult.data : [];
  const exact = candidates.find((customer: any) => {
    const primary = normalizePhoneForComparison(customer.phone);
    const secondary = normalizePhoneForComparison(customer.secondaryPhone);
    return primary === phoneNormalized || secondary === phoneNormalized;
  });

  if (exact?.id) return exact.id;

  const created = await (storage as any).createCustomer({
    name: input.customerName,
    phone: sanitizePhoneForStorage(input.customerPhone),
    email: input.customerEmail || null,
    address: typeof input.pickupAddress === "object" && input.pickupAddress ? input.pickupAddress : {},
    status: "active",
    creditLimit: "1000",
    totalOrders: 0,
    totalSpent: "0",
  });

  return created?.id || null;
}

async function nextBookingId(supabase: any, options?: { skipRpc?: boolean }): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);

  if (!options?.skipRpc) {
    try {
      const { data, error } = await supabase.rpc("next_booking_request_id");
      if (!error && typeof data === "string" && data.trim()) return data.trim();
    } catch {
      // fallback below
    }
  }

  const prefix = `${year}FAB`;
  const schema = await getBookingSchemaCapabilities(supabase);
  const selectColumns = schema.hasBookingId ? "booking_id, request_number" : "request_number";
  const searchPredicate = schema.hasBookingId
    ? `booking_id.ilike.${prefix}%,request_number.ilike.${prefix}%`
    : `request_number.ilike.${prefix}%`;
  const { data: rows } = await supabase
    .from("booking_requests")
    .select(selectColumns)
    .or(searchPredicate)
    .order("created_at", { ascending: false })
    .limit(500);

  let max = 0;
  for (const row of rows || []) {
    const code = String(row.booking_id || row.request_number || "").toUpperCase();
    const match = code.match(/^\d{2}FAB(\d{3,})([A-Z])$/);
    if (!match) continue;
    max = Math.max(max, Number(match[1] || 0));
  }

  const next = max + 1;
  const suffix = String.fromCharCode(65 + ((next - 1) % 26));
  return `${year}FAB${String(next).padStart(3, "0")}${suffix}`;
}

function bumpBookingId(current: string): string {
  const code = String(current || "").trim().toUpperCase();
  const match = code.match(/^(\d{2}FAB)(\d+)([A-Z])$/);
  if (!match) {
    const year = new Date().getFullYear().toString().slice(-2);
    return `${year}FAB001A`;
  }

  const prefix = match[1];
  const runningNo = Number(match[2] || 0);
  const nextNo = Math.max(1, runningNo + 1);
  const suffix = String.fromCharCode(65 + ((nextNo - 1) % 26));
  return `${prefix}${String(nextNo).padStart(3, "0")}${suffix}`;
}

function buildTimeBasedBookingId(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const runningNo = Math.floor(Date.now() / 1000) % 1_000_000;
  const safeNo = Math.max(1, runningNo);
  const suffix = String.fromCharCode(65 + ((safeNo - 1) % 26));
  return `${year}FAB${String(safeNo).padStart(3, "0")}${suffix}`;
}

function isDuplicateBookingCodeError(error: any): boolean {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("booking_requests_request_number_key")
    || message.includes("booking_requests_booking_id_unique")
    || message.includes("duplicate key value");
}

async function getBookingByIdentifier(supabase: any, identifier: string) {
  const id = String(identifier || "").trim();
  if (!id) return null;

  const byId = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!byId.error && byId.data) return byId.data;

  const byRequestNumber = await supabase
    .from("booking_requests")
    .select("*")
    .eq("request_number", id)
    .maybeSingle();
  if (!byRequestNumber.error && byRequestNumber.data) return byRequestNumber.data;

  const schema = await getBookingSchemaCapabilities(supabase);
  if (schema.hasBookingId) {
    const byBookingId = await supabase
      .from("booking_requests")
      .select("*")
      .eq("booking_id", id)
      .maybeSingle();
    if (!byBookingId.error && byBookingId.data) return byBookingId.data;
  }

  return null;
}

async function upsertBookingItems(supabase: any, bookingRequestId: string, items: Array<z.infer<typeof bookingItemSchema>>) {
  if (!Array.isArray(items) || items.length === 0) return;

  const rows = items.map((item, index) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    const unitPrice = Number(item.unitPrice || 0);
    return {
      booking_request_id: bookingRequestId,
      line_no: index + 1,
      service_name: item.serviceName,
      quantity,
      unit_price: Number.isFinite(unitPrice) ? unitPrice : 0,
      total_price: Number.isFinite(unitPrice) ? unitPrice * quantity : 0,
      remarks: item.note || null,
    };
  });

  await supabase.from("booking_request_items").insert(rows);
}

publicBookingsRouter.post("/bookings", async (req, res) => {
  try {
    const parsed = publicBookingSchema.parse(req.body || {});
    const supabase = (storage as any).supabase;

    if (!supabase) {
      return res.status(500).json(createErrorResponse("Database unavailable", 500));
    }

    const customerId = await resolveOrCreateCustomerId({
      customerName: parsed.customerName,
      customerPhone: parsed.customerPhone,
      customerEmail: parsed.customerEmail || null,
      pickupAddress: parsed.pickupAddress,
    });

    const basePayload: any = {
      source: parsed.source,
      channel: parsed.channel,
      store_code: normalizeStoreCode(parsed.storeCode) || undefined,
      customer_id: customerId || undefined,
      customer_name: parsed.customerName,
      customer_phone: sanitizePhoneForStorage(parsed.customerPhone),
      customer_email: parsed.customerEmail || null,
      pickup_address: typeof parsed.pickupAddress === "string"
        ? { line1: parsed.pickupAddress }
        : parsed.pickupAddress || null,
      preferred_date: toDateIsoString(parsed.preferredDate),
      preferred_slot: parsed.preferredSlot || null,
      notes: parsed.notes || null,
      weather_snapshot: parsed.weatherSnapshot || {},
      ai_suggestions: parsed.operationalSuggestionSnapshot || [],
      status: "new",
      created_by: "public_api",
      updated_by: "public_api",
    };
    const schema = await getBookingSchemaCapabilities(supabase);

    let insertedRow: any = null;
    let finalBookingId = "";
    let generatedId = await nextBookingId(supabase);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (attempt === 1) {
        generatedId = buildTimeBasedBookingId();
      } else if (attempt > 1) {
        generatedId = bumpBookingId(generatedId);
      }

      const payload = {
        ...basePayload,
        request_number: generatedId,
      };
      if (schema.hasBookingId) {
        payload.booking_id = generatedId;
      }

      const insertResult = await supabase
        .from("booking_requests")
        .insert(payload)
        .select("*")
        .single();

      if (!insertResult.error) {
        insertedRow = insertResult.data;
        finalBookingId = generatedId;
        break;
      }

      if (isDuplicateBookingCodeError(insertResult.error)) {
        continue;
      }

      const fallbackPayload = { ...payload };
      if (schema.hasBookingId) {
        delete (fallbackPayload as any).booking_id;
      }
      delete (fallbackPayload as any).customer_id;

      const fallbackInsert = await supabase
        .from("booking_requests")
        .insert(fallbackPayload)
        .select("*")
        .single();

      if (fallbackInsert.error) {
        if (isDuplicateBookingCodeError(fallbackInsert.error)) {
          continue;
        }
        throw new Error(fallbackInsert.error.message || "Failed to create booking");
      }

      insertedRow = fallbackInsert.data;
      finalBookingId = insertedRow?.request_number || generatedId;
      break;
    }

    if (!insertedRow) {
      throw new Error("Failed to create booking after retries");
    }

    if (schema.hasCustomerId && customerId && insertedRow?.id && !insertedRow?.customer_id) {
      try {
        const patchResult = await supabase
          .from("booking_requests")
          .update({ customer_id: customerId })
          .eq("id", insertedRow.id)
          .select("id, customer_id")
          .single();
        if (!patchResult.error && patchResult.data?.customer_id) {
          insertedRow = {
            ...insertedRow,
            customer_id: patchResult.data.customer_id,
          };
        }
      } catch {
        // ignore when the schema does not support customer_id yet
      }
    }

    try {
      await upsertBookingItems(supabase, insertedRow.id, parsed.items || []);
    } catch {
      // Table may not exist yet in old DB versions.
    }

    return res.status(201).json(createSuccessResponse({
      bookingId: finalBookingId || insertedRow.booking_id || insertedRow.request_number,
      id: insertedRow.id,
      status: insertedRow.status || "new",
      customerId: customerId || null,
      booking: formatBookingForClient({
        ...insertedRow,
        booking_id: insertedRow.booking_id || finalBookingId || insertedRow.request_number,
      }),
    }, "Booking created successfully"));
  } catch (error: any) {
    return res.status(400).json(createErrorResponse(error?.message || "Invalid booking payload", 400));
  }
});

publicBookingsRouter.get("/bookings/:id", async (req, res) => {
  try {
    const supabase = (storage as any).supabase;
    const row = await getBookingByIdentifier(supabase, req.params.id);
    if (!row) {
      return res.status(404).json(createErrorResponse("Booking not found", 404));
    }

    return res.json(createSuccessResponse(formatBookingForClient(row)));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error?.message || "Failed to fetch booking", 500));
  }
});

protectedBookingsRouter.get("/", async (req, res) => {
  try {
    const supabase = (storage as any).supabase;
    let query = supabase.from("booking_requests").select("*").order("created_at", { ascending: false });

    const status = String(req.query.status || "").trim();
    const storeCode = normalizeStoreCode(String(req.query.storeCode || "").trim()) || null;
    const source = String(req.query.source || "").trim();
    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();
    const search = String(req.query.search || "").trim();
    const limit = Math.min(500, Math.max(1, Number(req.query.limit || 100)));

    if (status) query = query.eq("status", status);
    if (storeCode) query = query.eq("store_code", storeCode);
    if (source) query = query.eq("source", source);
    if (from) query = query.gte("created_at", new Date(from).toISOString());
    if (to) query = query.lte("created_at", new Date(to).toISOString());
    if (search) {
      const schema = await getBookingSchemaCapabilities(supabase);
      const predicates = [
        `customer_name.ilike.%${search}%`,
        `customer_phone.ilike.%${search}%`,
        `request_number.ilike.%${search}%`,
      ];
      if (schema.hasBookingId) {
        predicates.push(`booking_id.ilike.%${search}%`);
      }
      query = query.or([
        ...predicates,
      ].join(","));
    }

    const { data, error } = await query.limit(limit);

    if (error) throw new Error(error.message);

    const rows = Array.isArray(data) ? data : [];

    return res.json(createSuccessResponse({
      rows: rows.map(formatBookingForClient),
      total: rows.length,
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error?.message || "Failed to load bookings", 500));
  }
});

protectedBookingsRouter.get("/:id", async (req, res) => {
  try {
    const supabase = (storage as any).supabase;
    const row = await getBookingByIdentifier(supabase, req.params.id);

    if (!row) {
      return res.status(404).json(createErrorResponse("Booking not found", 404));
    }

    let items: any[] = [];
    try {
      const itemResult = await supabase
        .from("booking_request_items")
        .select("*")
        .eq("booking_request_id", row.id)
        .order("line_no", { ascending: true });
      items = itemResult.data || [];
    } catch {
      items = [];
    }

    return res.json(createSuccessResponse({
      ...formatBookingForClient(row),
      items,
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error?.message || "Failed to load booking", 500));
  }
});

protectedBookingsRouter.patch("/:id", async (req, res) => {
  try {
    const supabase = (storage as any).supabase;
    const row = await getBookingByIdentifier(supabase, req.params.id);
    if (!row) {
      return res.status(404).json(createErrorResponse("Booking not found", 404));
    }

    const payload = bookingPatchSchema.parse(req.body || {});

    const updatePayload: any = {
      updated_by: req.employee?.username || "system",
    };

    if (payload.status) updatePayload.status = payload.status;
    if (payload.storeCode !== undefined) updatePayload.store_code = normalizeStoreCode(payload.storeCode);
    if (payload.notes !== undefined) updatePayload.notes = payload.notes;
    if (payload.conversionNote !== undefined) updatePayload.conversion_note = payload.conversionNote;

    const { data, error } = await supabase
      .from("booking_requests")
      .update(updatePayload)
      .eq("id", row.id)
      .select("*")
      .single();

    if (error) {
      delete updatePayload.conversion_note;
      const fallback = await supabase
        .from("booking_requests")
        .update(updatePayload)
        .eq("id", row.id)
        .select("*")
        .single();
      if (fallback.error) throw new Error(fallback.error.message);
      return res.json(createSuccessResponse(formatBookingForClient(fallback.data), "Booking updated"));
    }

    return res.json(createSuccessResponse(formatBookingForClient(data), "Booking updated"));
  } catch (error: any) {
    return res.status(400).json(createErrorResponse(error?.message || "Failed to update booking", 400));
  }
});

protectedBookingsRouter.post("/:id/convert-to-order", async (req, res) => {
  try {
    const supabase = (storage as any).supabase;
    const booking = await getBookingByIdentifier(supabase, req.params.id);

    if (!booking) {
      return res.status(404).json(createErrorResponse("Booking not found", 404));
    }

    if (booking.converted_order_id) {
      const existingOrder = await (storage as any).getOrder(booking.converted_order_id);
      return res.json(createSuccessResponse({
        booking: formatBookingForClient(booking),
        order: existingOrder || null,
      }, "Booking already converted"));
    }

    let bookingItems: any[] = [];
    try {
      const itemResult = await supabase
        .from("booking_request_items")
        .select("*")
        .eq("booking_request_id", booking.id)
        .order("line_no", { ascending: true });
      bookingItems = itemResult.data || [];
    } catch {
      bookingItems = [];
    }

    let customerId = booking.customer_id || null;

    if (!customerId) {
      customerId = await resolveOrCreateCustomerId({
        customerName: booking.customer_name,
        customerPhone: booking.customer_phone,
        customerEmail: booking.customer_email,
        pickupAddress: booking.pickup_address,
      });
    }

    const orderItems = (bookingItems.length > 0 ? bookingItems : [{ service_name: "Laundry Service", quantity: 1, unit_price: 0, total_price: 0 }])
      .map((item: any, index: number) => {
        const quantity = Math.max(1, Number(item.quantity || 1));
        const unitPrice = Number(item.unit_price ?? item.unitPrice ?? 0);
        const subtotal = Number(item.total_price ?? unitPrice * quantity ?? 0);
        return {
          serviceId: `booking-${booking.id}-${index + 1}`,
          serviceName: String(item.service_name || item.serviceName || "Laundry Service"),
          quantity,
          price: String(Number.isFinite(unitPrice) ? unitPrice : 0),
          subtotal: String(Number.isFinite(subtotal) ? subtotal : 0),
          customName: String(item.service_name || item.serviceName || "Laundry Service"),
          tagNote: item.remarks || item.note || undefined,
        };
      });

    const totalAmount = orderItems.reduce((sum: number, item: any) => sum + Number(item.subtotal || 0), 0);

    const bookingId = booking.booking_id || booking.request_number || null;

    const createdOrder = await (storage as any).createOrder({
      customerId,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email || null,
      customerPhone: sanitizePhoneForStorage(booking.customer_phone),
      status: "pending",
      paymentStatus: "pending",
      totalAmount: String(totalAmount),
      items: orderItems,
      storeCode: normalizeStoreCode(booking.store_code) || "POL",
      pickupDate: booking.preferred_date ? new Date(booking.preferred_date) : new Date(),
      fulfillmentType: "pickup",
      deliveryAddress: booking.pickup_address || null,
      specialInstructions: booking.notes || null,
      bookingSource: booking.source || "website",
      bookingChannel: booking.channel || "web",
      bookingSlot: booking.preferred_slot || null,
      bookingContext: {
        bookingRequestId: booking.id,
        bookingId,
        source: booking.source || "website",
        channel: booking.channel || "web",
      },
    });

    const convertedAt = new Date().toISOString();

    let bookingUpdate: any = {
      status: "converted",
      converted_order_id: createdOrder.id,
      converted_at: convertedAt,
      conversion_note: String(req.body?.note || "Converted from booking inbox"),
      customer_id: customerId || null,
      updated_by: req.employee?.username || "system",
    };

    const conversionResult = await supabase
      .from("booking_requests")
      .update(bookingUpdate)
      .eq("id", booking.id)
      .select("*")
      .single();

    if (conversionResult.error) {
      bookingUpdate = {
        status: "converted",
        converted_order_id: createdOrder.id,
        updated_by: req.employee?.username || "system",
      };
      const fallback = await supabase
        .from("booking_requests")
        .update(bookingUpdate)
        .eq("id", booking.id)
        .select("*")
        .single();
      if (fallback.error) throw new Error(fallback.error.message);
    }

    try {
      await supabase
        .from("orders")
        .update({
          booking_request_id: booking.id,
          booking_id: bookingId,
        })
        .eq("id", createdOrder.id);
    } catch {
      // optional columns may not exist yet
    }

    return res.status(201).json(createSuccessResponse({
      bookingId,
      booking: formatBookingForClient({ ...booking, status: "converted", converted_order_id: createdOrder.id }),
      order: createdOrder,
    }, "Booking converted to order"));
  } catch (error: any) {
    return res.status(400).json(createErrorResponse(error?.message || "Failed to convert booking", 400));
  }
});

export { publicBookingsRouter };
export default protectedBookingsRouter;
