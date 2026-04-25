import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, RefreshCcw, Loader2 } from "lucide-react";

const STORE_CODES = ["POL", "KIN", "MCET", "UDM"] as const;

type BookingRow = {
  id: string;
  bookingId: string | null;
  source: string;
  channel: string;
  storeCode: string | null;
  customerName: string;
  customerPhone: string;
  preferredDate: string | null;
  preferredSlot: string | null;
  status: string;
  convertedOrderId: string | null;
  createdAt: string | null;
};

type BookingListResponse = {
  rows: BookingRow[];
  total: number;
};

async function getBookings(params: { status?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.search?.trim()) query.set("search", params.search.trim());

  const response = await fetch(`/api/v1/bookings?${query.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to load bookings");
  }
  const payload = await response.json();
  return payload.data as BookingListResponse;
}

async function patchBooking(id: string, payload: { status?: string; storeCode?: string | null }) {
  const response = await fetch(`/api/v1/bookings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message || "Failed to update booking");
  }

  return response.json();
}

async function convertBookingToOrder(id: string) {
  const response = await fetch(`/api/v1/bookings/${encodeURIComponent(id)}/convert-to-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message || "Failed to convert booking");
  }

  const payload = await response.json();
  return payload.data;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const key = String(status || "").toLowerCase();
  if (key === "converted") return "default";
  if (key === "cancelled") return "destructive";
  if (key === "confirmed") return "secondary";
  return "outline";
}

export default function BookingPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const bookingsQuery = useQuery({
    queryKey: ["booking-inbox", statusFilter, search],
    queryFn: () => getBookings({ status: statusFilter, search }),
    staleTime: 10_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: string; storeCode?: string | null } }) => patchBooking(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["booking-inbox"] });
    },
    onError: (error: any) => {
      toast({
        title: "Booking update failed",
        description: error?.message || "Unable to update booking",
        variant: "destructive",
      });
    },
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => convertBookingToOrder(id),
    onSuccess: (data: any) => {
      void queryClient.invalidateQueries({ queryKey: ["booking-inbox"] });
      toast({
        title: "Order created from booking",
        description: data?.order?.orderNumber
          ? `Converted successfully: ${data.order.orderNumber}`
          : "Booking converted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Conversion failed",
        description: error?.message || "Unable to convert booking",
        variant: "destructive",
      });
    },
  });

  const rows = bookingsQuery.data?.rows || [];

  const metrics = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((item) => String(item.status).toLowerCase() === "new").length;
    const confirmed = rows.filter((item) => String(item.status).toLowerCase() === "confirmed").length;
    const converted = rows.filter((item) => String(item.status).toLowerCase() === "converted").length;
    return { total, pending, confirmed, converted };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Booking Inbox</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            All website and mobile pickup bookings are listed here. Assign store, update status, and convert directly to ERP orders.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => bookingsQuery.refetch()} disabled={bookingsQuery.isFetching}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button asChild variant="outline">
            <Link href="/create-order">Create Manual Order</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total Bookings</p><p className="text-2xl font-bold">{metrics.total}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">New</p><p className="text-2xl font-bold">{metrics.pending}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Confirmed</p><p className="text-2xl font-bold">{metrics.confirmed}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Converted</p><p className="text-2xl font-bold">{metrics.converted}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Booking Queue
          </CardTitle>
          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search by name, phone, booking ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {bookingsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading bookings...
            </div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No bookings found for this filter.</div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{row.bookingId || row.id}</span>
                        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                        <Badge variant="outline">{row.source} / {row.channel}</Badge>
                        {row.convertedOrderId && <Badge variant="default">Order linked</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {row.customerName} • {row.customerPhone}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.preferredDate || "No date"} {row.preferredSlot ? `• ${row.preferredSlot}` : ""}
                        {row.createdAt ? ` • ${new Date(row.createdAt).toLocaleString()}` : ""}
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <Select
                        value={row.storeCode || ""}
                        onValueChange={(value) => updateMutation.mutate({ id: row.id, payload: { storeCode: value || null } })}
                        disabled={updateMutation.isPending}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Store" />
                        </SelectTrigger>
                        <SelectContent>
                          {STORE_CODES.map((storeCode) => (
                            <SelectItem key={storeCode} value={storeCode}>{storeCode}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={row.status}
                        onValueChange={(value) => updateMutation.mutate({ id: row.id, payload: { status: value } })}
                        disabled={updateMutation.isPending}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">new</SelectItem>
                          <SelectItem value="confirmed">confirmed</SelectItem>
                          <SelectItem value="processing">processing</SelectItem>
                          <SelectItem value="cancelled">cancelled</SelectItem>
                          <SelectItem value="converted">converted</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={() => convertMutation.mutate(row.id)}
                        disabled={convertMutation.isPending || row.status === "converted" || Boolean(row.convertedOrderId)}
                      >
                        {convertMutation.isPending ? "Converting..." : "Convert to Order"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
