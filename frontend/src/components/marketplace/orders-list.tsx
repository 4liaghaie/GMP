"use client";

import * as React from "react";
import Link from "next/link";
import { SlidersHorizontal, Check, ChevronsUpDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { authFetch } from "@/lib/auth-api";
import { cn } from "@/lib/utils";
import { countries } from "@/lib/countryList";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

import OrderDetails from "@/components/marketplace/order-details";

/* ---------------- Types ---------------- */

export type OrderGood = {
  uuid: string;
  description: string;
  hs_code: string;
  quantity: string;
  origin: string;
  unit_price: string;
  unit: string;
  nw_kg: string;
  gw_kg: string;
  line_total: string;
};

export type MarketplaceOrder = {
  uuid: string;
  order_number: string;
  user: string;

  total_value: string;
  freight_price: string;
  sub_total: string;

  currency_type: string;
  seller_country: string;
  date: string;
  expire_date: string;

  terms_of_delivery: string;
  terms_of_payment: string;

  partial_shipment: boolean;
  means_of_transport: string;

  country_of_origin: string;
  standard: string;

  total_gw: string;
  total_nw: string;
  total_qty: string;

  goods: OrderGood[];
};

type SortKey = "newest" | "oldest";

/* ---------------- Options (same style as AddRegisteredOrderPage) ---------------- */

const deliveryTerms = [
  { value: "EXW", label: "EXW (تحویل درب کارخانه)" },
  { value: "FOB", label: "FOB (تحویل روی عرشه)" },
  { value: "CFR", label: "CFR (هزینه و کرایه)" },
  { value: "CIF", label: "CIF (هزینه، بیمه و کرایه)" },
  { value: "DAP", label: "DAP (تحویل در محل)" },
] as const;

const paymentTerms = [
  { value: "TT", label: "TT (حواله بانکی)" },
  { value: "LC", label: "LC (اعتبار اسنادی)" },
  { value: "CAD", label: "CAD (اسناد در مقابل پرداخت)" },
  { value: "DP", label: "D/P (اسناد در مقابل پرداخت)" },
  { value: "DA", label: "D/A (اسناد در مقابل قبول)" },
] as const;

const transportMeans = [
  { value: "SEA", label: "دریایی" },
  { value: "AIR", label: "هوایی" },
  { value: "ROAD", label: "زمینی" },
  { value: "RAIL", label: "ریلی" },
] as const;

const standards = [
  { value: "STD", label: "استاندارد (STD)" },
  { value: "ISO", label: "ISO" },
  { value: "CE", label: "CE" },
  { value: "FDA", label: "FDA" },
  { value: "OTHER", label: "سایر" },
] as const;

const currencyOptions = [
  { value: "USD", label: "دلار (USD)" },
  { value: "EUR", label: "یورو (EUR)" },
  { value: "AED", label: "درهم (AED)" },
  { value: "CNY", label: "یوان چین (CNY)" },
  { value: "TRY", label: "لیر ترکیه (TRY)" },
] as const;

const partialShipmentOptions = [
  { value: "any", label: "همه" },
  { value: "true", label: "بله" },
  { value: "false", label: "خیر" },
] as const;

/**
 * Since you insisted "all filters are selects", total value range is a select (buckets).
 * You can change these buckets any time; API will receive min/max.
 */
const totalValueRanges = [
  { value: "any", label: "همه" },
  { value: "0-10000", label: "۰ تا ۱۰,۰۰۰" },
  { value: "10000-50000", label: "۱۰,۰۰۰ تا ۵۰,۰۰۰" },
  { value: "50000-200000", label: "۵۰,۰۰۰ تا ۲۰۰,۰۰۰" },
  { value: "200000-1000000", label: "۲۰۰,۰۰۰ تا ۱,۰۰۰,۰۰۰" },
  { value: "1000000+", label: "بیشتر از ۱,۰۰۰,۰۰۰" },
] as const;

/* ---------------- Utils ---------------- */

function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>,
) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

function formatNumLike(x: string | number | null | undefined) {
  if (x === null || x === undefined) return "—";
  const n = Number(x);
  if (!Number.isFinite(n)) return String(x);
  return new Intl.NumberFormat("fa-IR").format(n);
}

function safeText(x: any) {
  if (x === null || x === undefined || x === "") return "—";
  return String(x);
}

function normalizeFa(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ---------------- HS Code (same backend-search pattern) ---------------- */

type HSCodeOption = {
  id: number;
  code: string;
  goods_name_fa?: string | null;
  goods_name_en?: string | null;
};

function safeTrim(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function truncateText(s: string, max = 30) {
  const t = (s ?? "").trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max) + "..." : t;
}

function firstErrorMessage(data: any, fallback: string) {
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data === "object") {
    const keys = Object.keys(data);
    if (keys.length) {
      const v = data[keys[0]];
      if (typeof v === "string") return v;
      if (Array.isArray(v) && typeof v[0] === "string") return v[0];
      try {
        return JSON.stringify(data);
      } catch {
        return fallback;
      }
    }
  }
  return fallback;
}

async function fetchHSCodes(
  query: string = "",
  signal?: AbortSignal,
): Promise<HSCodeOption[]> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
  if (!API_BASE) throw new Error("متغیر NEXT_PUBLIC_API_BASE تنظیم نشده است");

  const url = new URL(`${API_BASE}/hs-codes/`);
  const q = (query ?? "").trim();
  if (q) url.searchParams.set("search", q);

  const res = await authFetch(url.toString(), {
    method: "GET",
    cache: "no-store",
    signal,
  });

  const data = (await res.json().catch(() => ({}))) as any;

  if (!res.ok)
    throw new Error(firstErrorMessage(data, "خطا در دریافت HS Code ها"));

  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];

  return items.map((x: any) => ({
    id: Number(x.id),
    code: String(x.code ?? ""),
    goods_name_fa: x.goods_name_fa ?? null,
    goods_name_en: x.goods_name_en ?? null,
  }));
}

/* ---------------- Generic Searchable Combobox (same style) ---------------- */

function SearchableCombobox<T extends { value: string; label: string }>(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: readonly T[];
  placeholder?: string;
  searchPlaceholder?: string;
  rightAction?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  const selected = React.useMemo(
    () => props.items.find((x) => x.value === props.value),
    [props.items, props.value],
  );

  const filtered = React.useMemo(() => {
    const qq = normalizeFa(q);
    if (!qq) return props.items;
    return props.items.filter((it) =>
      normalizeFa(`${it.label} ${it.value}`).includes(qq),
    );
  }, [props.items, q]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm">{props.label}</Label>
        {props.rightAction ? props.rightAction : null}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between rounded-xl"
          >
            <span
              className={cn("truncate", !selected && "text-muted-foreground")}
            >
              {selected?.label || props.placeholder || "انتخاب..."}
            </span>
            <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={props.searchPlaceholder || "جستجو..."}
              value={q}
              onValueChange={setQ}
            />
            <CommandEmpty>موردی پیدا نشد.</CommandEmpty>

            <CommandGroup className="max-h-[320px] overflow-auto">
              {filtered.map((it) => {
                const isSelected = it.value === props.value;
                return (
                  <CommandItem
                    key={it.value}
                    value={it.value}
                    onSelect={() => {
                      props.onChange(it.value);
                      setOpen(false);
                      setQ("");
                    }}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate">{it.label}</span>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function CountryCombobox(props: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  rightAction?: React.ReactNode;
}) {
  const items = React.useMemo(
    () =>
      (
        countries as Array<{ name: string; code: string; persianName: string }>
      ).map((c) => ({
        value: c.code,
        label: `${c.persianName} (${c.code})`,
      })),
    [],
  );

  return (
    <SearchableCombobox
      label={props.label}
      value={props.value}
      onChange={props.onChange}
      items={items}
      placeholder="انتخاب کشور..."
      searchPlaceholder="جستجو: نام فارسی / انگلیسی / کد..."
      rightAction={props.rightAction}
    />
  );
}

/**
 * HSCode Combobox - returns selected HS code **string** (code)
 * and keeps selected id internally for stable UI.
 */
function HSCodeCombobox(props: {
  label: string;
  valueCode: string; // stored filter value (code)
  onChangeCode: (code: string) => void;
  selectedCache: Map<number, HSCodeOption>;
  rightAction?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const debouncedQ = useDebouncedValue(q, 250);

  const [items, setItems] = React.useState<HSCodeOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");

  // find selected item by code (best-effort)
  const selected = React.useMemo(() => {
    if (!props.valueCode) return null;
    const inItems = items.find((x) => x.code === props.valueCode);
    if (inItems) return inItems;
    for (const v of props.selectedCache.values()) {
      if (v.code === props.valueCode) return v;
    }
    return null;
  }, [props.valueCode, items, props.selectedCache]);

  const selectedLabel = React.useMemo(() => {
    if (!selected) return "";
    const fa = safeTrim(selected.goods_name_fa);
    const en = safeTrim(selected.goods_name_en);
    const name = fa || en;
    const shortName = truncateText(name, 30);
    return shortName ? `${selected.code} — ${shortName}` : selected.code;
  }, [selected]);

  React.useEffect(() => {
    if (!open) return;

    const ac = new AbortController();
    setLoading(true);
    setLoadError("");

    fetchHSCodes(debouncedQ, ac.signal)
      .then((res) => {
        setItems(res);
        res.forEach((x) => props.selectedCache.set(x.id, x));
      })
      .catch((e: any) => {
        if (e?.name === "AbortError") return;
        setLoadError(e?.message || "خطا در جستجوی HS Code");
        setItems([]);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [open, debouncedQ, props.selectedCache]);

  const mergedItems = React.useMemo(() => {
    // ensure selected item appears even if not in current search results
    if (!props.valueCode) return items;
    if (items.some((x) => x.code === props.valueCode)) return items;

    const cached = Array.from(props.selectedCache.values()).find(
      (x) => x.code === props.valueCode,
    );
    return cached ? [cached, ...items] : items;
  }, [items, props.valueCode, props.selectedCache]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm">{props.label}</Label>
        {props.rightAction ? props.rightAction : null}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between rounded-xl"
          >
            <span
              className={cn(
                "truncate",
                !selectedLabel && "text-muted-foreground",
              )}
              title={selectedLabel || undefined}
            >
              {selectedLabel || "جستجو و انتخاب HS Code..."}
            </span>
            <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="جستجو در سرور (کد یا نام)..."
              value={q}
              onValueChange={setQ}
            />

            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">
                در حال جستجو...
              </div>
            ) : loadError ? (
              <div className="p-3 text-sm text-destructive">{loadError}</div>
            ) : null}

            <CommandEmpty>موردی پیدا نشد.</CommandEmpty>

            <CommandGroup className="max-h-[320px] overflow-auto">
              {mergedItems.map((h) => {
                const fa = safeTrim(h.goods_name_fa);
                const en = safeTrim(h.goods_name_en);
                const name = fa || en;
                const shortName = truncateText(name, 30);
                const label = shortName ? `${h.code} — ${shortName}` : h.code;
                const isSelected = h.code === props.valueCode;

                return (
                  <CommandItem
                    key={h.id}
                    value={String(h.id)}
                    onSelect={() => {
                      props.onChangeCode(h.code);
                      setOpen(false);
                      setQ("");
                    }}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate" title={fa || en || h.code}>
                      {label}
                    </span>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ---------------- API Fetch ---------------- */

function parseRange(v: string): { min?: number; max?: number } {
  if (!v || v === "any") return {};
  if (v.endsWith("+")) {
    const min = Number(v.replace("+", ""));
    return Number.isFinite(min) ? { min } : {};
  }
  const m = /^(\d+)-(\d+)$/.exec(v);
  if (!m) return {};
  const min = Number(m[1]);
  const max = Number(m[2]);
  const out: { min?: number; max?: number } = {};
  if (Number.isFinite(min)) out.min = min;
  if (Number.isFinite(max)) out.max = max;
  return out;
}

async function fetchMarketplaceOrders(args: {
  q: string;

  hs_code: string;
  total_value_range: string;

  seller_country: string;
  currency_type: string;

  terms_of_delivery: string;
  terms_of_payment: string;

  partial_shipment: string; // any/true/false
  means_of_transport: string;

  standard: string;
  country_of_origin: string;

  ordering: SortKey;
  page: number;
  page_size: number;
  signal?: AbortSignal;
}) {
  const API = process.env.NEXT_PUBLIC_API_BASE!;
  const {
    q,
    hs_code,
    total_value_range,
    seller_country,
    currency_type,
    terms_of_delivery,
    terms_of_payment,
    partial_shipment,
    means_of_transport,
    standard,
    country_of_origin,
    ordering,
    page,
    page_size,
    signal,
  } = args;

  const r = parseRange(total_value_range);
  const partial =
    partial_shipment === "any" || !partial_shipment
      ? undefined
      : partial_shipment === "true";

  const qs = buildQuery({
    q: q || undefined,

    hs_code: hs_code || undefined,
    total_value_min: r.min ?? undefined,
    total_value_max: r.max ?? undefined,

    seller_country: seller_country || undefined,
    currency_type: currency_type || undefined,

    terms_of_delivery: terms_of_delivery || undefined,
    terms_of_payment: terms_of_payment || undefined,

    partial_shipment: partial ?? undefined,
    means_of_transport: means_of_transport || undefined,

    standard: standard || undefined,
    country_of_origin: country_of_origin || undefined,

    ordering: ordering === "newest" ? "-date" : "date",
    page,
    page_size,
  });

  const res = await authFetch(`${API}/marketplace/orders/${qs}`, {
    method: "GET",
    signal,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      typeof data?.detail === "string"
        ? data.detail
        : "خطا در دریافت لیست مارکت‌پلیس";
    throw new Error(msg);
  }

  // supports both list & DRF pagination
  if (Array.isArray(data)) {
    return {
      items: data as MarketplaceOrder[],
      total: data.length,
      paginated: false,
    };
  }
  if (data && Array.isArray(data.results)) {
    return {
      items: data.results as MarketplaceOrder[],
      total: Number(data.count ?? data.results.length),
      paginated: true,
    };
  }
  return { items: [] as MarketplaceOrder[], total: 0, paginated: false };
}

/* ---------------- UI blocks ---------------- */

function OrdersSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <Card key={i} className="rounded-2xl">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-9 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

function OrderCard({ order }: { order: MarketplaceOrder }) {
  const goodsCount = order.goods?.length ?? 0;

  return (
    <Card className="group rounded-2xl transition hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base leading-7">
              ثبت سفارش{" "}
              <span className="font-bold">{safeText(order.order_number)}</span>
            </CardTitle>
            <CardDescription className="leading-6">
              فروشنده: {safeText(order.user)} • تاریخ: {safeText(order.date)}
            </CardDescription>
          </div>

          <Badge variant="secondary" className="rounded-xl">
            {safeText(order.currency_type)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <StatPill
            label="کشور فروشنده"
            value={safeText(order.seller_country)}
          />
          <StatPill
            label="ارزش کالا"
            value={formatNumLike(order.total_value)}
          />
          <StatPill label="جمع کل" value={formatNumLike(order.sub_total)} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {goodsCount
              ? `${formatNumLike(goodsCount)} ردیف کالا`
              : "بدون کالا"}
          </div>

          <OrderDetails order={order} />
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- Right Drawer Filters ---------------- */

function countActiveFilters(filters: Record<string, any>) {
  const entries = Object.entries(filters);

  let n = 0;
  for (const [k, v] of entries) {
    if (k === "ordering" || k === "pageSize") continue;

    if (typeof v === "string") {
      if (!v || v === "any") continue;
      n += 1;
      continue;
    }
    if (typeof v === "boolean") {
      n += 1;
      continue;
    }
    if (v !== null && v !== undefined) n += 1;
  }
  return n;
}

/* ---------------- Main List Component ---------------- */

export default function OrdersList() {
  // Search "q" stays as a simple chip-selectable value (not in drawer)
  // Drawer is for selects only, per your requirement.
  const [q, setQ] = React.useState<string>("");

  // Filters (all select/combobox)
  const [hsCode, setHsCode] = React.useState<string>(""); // code string
  const [totalValueRange, setTotalValueRange] = React.useState<string>("any");

  const [sellerCountry, setSellerCountry] = React.useState<string>("");
  const [currencyType, setCurrencyType] = React.useState<string>("");

  const [termsDelivery, setTermsDelivery] = React.useState<string>("");
  const [termsPayment, setTermsPayment] = React.useState<string>("");

  const [partialShipment, setPartialShipment] = React.useState<string>("any");
  const [transport, setTransport] = React.useState<string>("");

  const [standard, setStandard] = React.useState<string>("");
  const [originCountry, setOriginCountry] = React.useState<string>("");

  // UI controls
  const [ordering, setOrdering] = React.useState<SortKey>("newest");
  const [pageSize, setPageSize] = React.useState<number>(12);
  const [page, setPage] = React.useState<number>(1);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [items, setItems] = React.useState<MarketplaceOrder[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [serverPaginated, setServerPaginated] = React.useState<boolean>(false);

  const hsSelectedCacheRef = React.useRef<Map<number, HSCodeOption>>(new Map());

  // Debounce q (search)
  const [qDebounced, setQDebounced] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  // reset page when any filter changes
  React.useEffect(() => {
    setPage(1);
  }, [
    qDebounced,
    hsCode,
    totalValueRange,
    sellerCountry,
    currencyType,
    termsDelivery,
    termsPayment,
    partialShipment,
    transport,
    standard,
    originCountry,
    ordering,
    pageSize,
  ]);

  // fetch
  React.useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    fetchMarketplaceOrders({
      q: qDebounced,

      hs_code: hsCode.trim(),
      total_value_range: totalValueRange,

      seller_country: sellerCountry.trim(),
      currency_type: currencyType.trim(),

      terms_of_delivery: termsDelivery.trim(),
      terms_of_payment: termsPayment.trim(),

      partial_shipment: partialShipment,
      means_of_transport: transport.trim(),

      standard: standard.trim(),
      country_of_origin: originCountry.trim(),

      ordering,
      page,
      page_size: pageSize,
      signal: ctrl.signal,
    })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
        setServerPaginated(r.paginated);
      })
      .catch((e: any) => {
        if (e?.name === "AbortError") return;
        setError(
          typeof e?.message === "string" ? e.message : "خطا در دریافت داده‌ها",
        );
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [
    qDebounced,
    hsCode,
    totalValueRange,
    sellerCountry,
    currencyType,
    termsDelivery,
    termsPayment,
    partialShipment,
    transport,
    standard,
    originCountry,
    ordering,
    page,
    pageSize,
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const visibleItems = React.useMemo(() => {
    if (serverPaginated) return items;
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize, serverPaginated]);

  const activeFiltersCount = React.useMemo(() => {
    return countActiveFilters({
      hsCode,
      totalValueRange,
      sellerCountry,
      currencyType,
      termsDelivery,
      termsPayment,
      partialShipment,
      transport,
      standard,
      originCountry,
      q: qDebounced,
      ordering,
      pageSize,
    });
  }, [
    hsCode,
    totalValueRange,
    sellerCountry,
    currencyType,
    termsDelivery,
    termsPayment,
    partialShipment,
    transport,
    standard,
    originCountry,
    qDebounced,
    ordering,
    pageSize,
  ]);

  const hasAnyFilter = activeFiltersCount > 0;

  function resetFilters() {
    setQ("");

    setHsCode("");
    setTotalValueRange("any");

    setSellerCountry("");
    setCurrencyType("");

    setTermsDelivery("");
    setTermsPayment("");

    setPartialShipment("any");
    setTransport("");

    setStandard("");
    setOriginCountry("");

    setOrdering("newest");
    setPageSize(12);
    setPage(1);
  }

  // quick q chips (still allowed; not in drawer)
  const qChips = ["0101", "گندم", "برنج", "چای"];

  return (
    <div>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">مارکت‌پلیس ثبت سفارش‌ها</h1>
            <p className="text-sm text-muted-foreground">
              همه ثبت سفارش‌ها (عمومی) — مشاهده برای همه کاربران
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/my-orders">ثبت سفارش‌های من</Link>
            </Button>
          </div>
        </div>

        {/* Search + Filters Drawer Trigger */}
        <Card className="mt-5 rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="text-base">جستجو و فیلتر</CardTitle>
                <CardDescription>
                  شماره ثبت سفارش، HS Code یا شرح کالا
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {hasAnyFilter && (
                  <Button
                    variant="ghost"
                    className="rounded-xl"
                    onClick={resetFilters}
                  >
                    پاک‌کردن فیلترها
                  </Button>
                )}

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="rounded-xl">
                      <SlidersHorizontal className="ms-2 h-4 w-4" />
                      فیلترها
                      {activeFiltersCount ? (
                        <Badge className="ms-2 rounded-xl" variant="secondary">
                          {new Intl.NumberFormat("fa-IR").format(
                            activeFiltersCount,
                          )}
                        </Badge>
                      ) : null}
                    </Button>
                  </SheetTrigger>

                  <SheetContent
                    side="right"
                    className={cn(
                      "w-[92vw] max-w-[420px] p-0",
                      // RTL: move built-in X to left
                      "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
                    )}
                  >
                    <SheetHeader className="p-4 text-right">
                      <SheetTitle className="text-right">
                        فیلترهای مارکت‌پلیس
                      </SheetTitle>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="text-xs text-muted-foreground">
                          {activeFiltersCount ? (
                            <>
                              {new Intl.NumberFormat("fa-IR").format(
                                activeFiltersCount,
                              )}{" "}
                              فیلتر فعال
                            </>
                          ) : (
                            "بدون فیلتر"
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {hasAnyFilter && (
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 rounded-xl px-3"
                              onClick={resetFilters}
                            >
                              پاک‌کردن
                            </Button>
                          )}
                          <SheetClose asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 rounded-xl px-3"
                            >
                              بستن
                            </Button>
                          </SheetClose>
                        </div>
                      </div>
                    </SheetHeader>

                    <Separator />

                    <ScrollArea className="h-[calc(100dvh-140px)]">
                      <div className="p-4">
                        <Accordion
                          type="multiple"
                          defaultValue={[
                            "goods",
                            "trade",
                            "terms",
                            "logistics",
                            "view",
                          ]}
                        >
                          {/* Goods & Value */}
                          <AccordionItem value="goods">
                            <AccordionTrigger className="text-right">
                              کالا و ارزش
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <HSCodeCombobox
                                label="HS Code"
                                valueCode={hsCode}
                                onChangeCode={setHsCode}
                                selectedCache={hsSelectedCacheRef.current}
                                rightAction={
                                  hsCode ? (
                                    <button
                                      type="button"
                                      className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                      onClick={() => setHsCode("")}
                                      aria-label="پاک کردن HS"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  ) : null
                                }
                              />

                              <SearchableCombobox
                                label="بازه ارزش کل"
                                value={totalValueRange}
                                onChange={setTotalValueRange}
                                items={totalValueRanges}
                                placeholder="انتخاب بازه..."
                                searchPlaceholder="جستجو در بازه‌ها..."
                                rightAction={
                                  totalValueRange !== "any" ? (
                                    <button
                                      type="button"
                                      className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                      onClick={() => setTotalValueRange("any")}
                                      aria-label="پاک کردن بازه"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  ) : null
                                }
                              />
                            </AccordionContent>
                          </AccordionItem>

                          {/* Trade parties & currency */}
                          <AccordionItem value="trade">
                            <AccordionTrigger className="text-right">
                              طرفین و ارز
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <CountryCombobox
                                label="کشور فروشنده"
                                value={sellerCountry}
                                onChange={setSellerCountry}
                                rightAction={
                                  sellerCountry ? (
                                    <button
                                      type="button"
                                      className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                      onClick={() => setSellerCountry("")}
                                      aria-label="پاک کردن کشور فروشنده"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  ) : null
                                }
                              />

                              <SearchableCombobox
                                label="نوع ارز"
                                value={currencyType}
                                onChange={setCurrencyType}
                                items={currencyOptions}
                                placeholder="انتخاب ارز..."
                                searchPlaceholder="جستجو در ارزها..."
                                rightAction={
                                  currencyType ? (
                                    <button
                                      type="button"
                                      className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                      onClick={() => setCurrencyType("")}
                                      aria-label="پاک کردن ارز"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  ) : null
                                }
                              />

                              <CountryCombobox
                                label="کشور مبدا"
                                value={originCountry}
                                onChange={setOriginCountry}
                                rightAction={
                                  originCountry ? (
                                    <button
                                      type="button"
                                      className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                      onClick={() => setOriginCountry("")}
                                      aria-label="پاک کردن کشور مبدا"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  ) : null
                                }
                              />
                            </AccordionContent>
                          </AccordionItem>

                          {/* Terms */}
                          <AccordionItem value="terms">
                            <AccordionTrigger className="text-right">
                              شرایط معامله
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <SearchableCombobox
                                label="شرایط تحویل (Incoterms)"
                                value={termsDelivery}
                                onChange={setTermsDelivery}
                                items={deliveryTerms}
                                placeholder="انتخاب شرایط تحویل..."
                                searchPlaceholder="جستجو..."
                                rightAction={
                                  termsDelivery ? (
                                    <button
                                      type="button"
                                      className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                      onClick={() => setTermsDelivery("")}
                                      aria-label="پاک کردن تحویل"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  ) : null
                                }
                              />

                              <SearchableCombobox
                                label="شرایط پرداخت"
                                value={termsPayment}
                                onChange={setTermsPayment}
                                items={paymentTerms}
                                placeholder="انتخاب شرایط پرداخت..."
                                searchPlaceholder="جستجو..."
                                rightAction={
                                  termsPayment ? (
                                    <button
                                      type="button"
                                      className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                      onClick={() => setTermsPayment("")}
                                      aria-label="پاک کردن پرداخت"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  ) : null
                                }
                              />

                              <SearchableCombobox
                                label="ارسال جزئی"
                                value={partialShipment}
                                onChange={setPartialShipment}
                                items={partialShipmentOptions}
                                placeholder="انتخاب..."
                                searchPlaceholder="جستجو..."
                              />
                            </AccordionContent>
                          </AccordionItem>

                          {/* Logistics */}
                          <AccordionItem value="logistics">
                            <AccordionTrigger className="text-right">
                              حمل و استاندارد
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <SearchableCombobox
                                label="روش حمل"
                                value={transport}
                                onChange={setTransport}
                                items={transportMeans}
                                placeholder="انتخاب روش حمل..."
                                searchPlaceholder="جستجو..."
                                rightAction={
                                  transport ? (
                                    <button
                                      type="button"
                                      className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                      onClick={() => setTransport("")}
                                      aria-label="پاک کردن حمل"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  ) : null
                                }
                              />

                              <SearchableCombobox
                                label="استاندارد"
                                value={standard}
                                onChange={setStandard}
                                items={standards}
                                placeholder="انتخاب استاندارد..."
                                searchPlaceholder="جستجو..."
                                rightAction={
                                  standard ? (
                                    <button
                                      type="button"
                                      className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                      onClick={() => setStandard("")}
                                      aria-label="پاک کردن استاندارد"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  ) : null
                                }
                              />
                            </AccordionContent>
                          </AccordionItem>

                          {/* View */}
                          <AccordionItem value="view">
                            <AccordionTrigger className="text-right">
                              نمایش و مرتب‌سازی
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <SearchableCombobox
                                label="مرتب‌سازی"
                                value={ordering}
                                onChange={(v) => setOrdering(v as SortKey)}
                                items={[
                                  { value: "newest", label: "جدیدترین" },
                                  { value: "oldest", label: "قدیمی‌ترین" },
                                ]}
                                placeholder="انتخاب کنید"
                                searchPlaceholder="جستجو..."
                              />

                              <SearchableCombobox
                                label="تعداد در صفحه"
                                value={String(pageSize)}
                                onChange={(v) => setPageSize(Number(v))}
                                items={[
                                  { value: "6", label: "6" },
                                  { value: "12", label: "12" },
                                  { value: "24", label: "24" },
                                  { value: "48", label: "48" },
                                ]}
                                placeholder="انتخاب کنید"
                                searchPlaceholder="جستجو..."
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        <div className="mt-6 rounded-2xl border bg-card p-4 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">نتیجه</span>
                            <span className="font-semibold">
                              {loading
                                ? "..."
                                : new Intl.NumberFormat("fa-IR").format(total)}
                            </span>
                          </div>
                          <Separator className="my-3" />
                          <SheetClose asChild>
                            <Button
                              className="w-full rounded-2xl"
                              variant="outline"
                            >
                              اعمال و بستن
                            </Button>
                          </SheetClose>
                        </div>
                      </div>
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Search is outside drawer (free text is fine; drawer = selects only) */}
            {/* Search is outside drawer (free text) */}
            <div className="space-y-2">
              <Label className="text-right" htmlFor="q">
                جستجو
              </Label>

              {/* ✅ typed search input */}
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="مثلا: 01012100 یا شماره ثبت سفارش یا شرح کالا..."
                  className="rounded-xl pr-10"
                />
                {q.trim() && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label="پاک کردن"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* quick chips */}
              <div className="mt-2 flex flex-wrap gap-2">
                {qChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setQ(chip)}
                    className={cn(
                      "rounded-xl border bg-card px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground",
                      q === chip &&
                        "border-primary/40 bg-accent text-foreground",
                    )}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {q.trim() ? (
                <div className="text-xs text-muted-foreground">
                  مقدار جستجو:{" "}
                  <span className="font-medium text-foreground">{q}</span>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  برای بهترین نتیجه: از شماره ثبت سفارش یا HS یا شرح کالا
                  استفاده کنید.
                </div>
              )}
            </div>

            <Separator className="my-5" />

            {/* Result + pagination */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-muted-foreground">
                {loading ? (
                  "در حال دریافت..."
                ) : (
                  <>
                    نتیجه:{" "}
                    <span className="font-semibold text-foreground">
                      {new Intl.NumberFormat("fa-IR").format(total)}
                    </span>{" "}
                    مورد
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={!canPrev || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  قبلی
                </Button>

                <div className="min-w-28 text-center text-sm">
                  صفحه {new Intl.NumberFormat("fa-IR").format(page)} از{" "}
                  {new Intl.NumberFormat("fa-IR").format(totalPages)}
                </div>

                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={!canNext || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  بعدی
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="mt-6">
          {error ? (
            <Alert variant="destructive" className="rounded-2xl">
              <AlertTitle className="text-right">خطا</AlertTitle>
              <AlertDescription className="text-right">
                {error}
              </AlertDescription>
            </Alert>
          ) : loading ? (
            <OrdersSkeleton />
          ) : visibleItems.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                نتیجه‌ای یافت نشد. فیلترها را تغییر دهید یا پاک کنید.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((o) => (
                <OrderCard key={o.uuid} order={o} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
