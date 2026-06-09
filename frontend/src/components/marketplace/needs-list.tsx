"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeDollarSign,
  Boxes,
  Check,
  ChevronsUpDown,
  MapPin,
  PackageSearch,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authFetch } from "@/lib/auth-api";
import { borders } from "@/lib/borderList";
import { countries } from "@/lib/countryList";
import { iranCustoms } from "@/lib/customsList";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

type GoodsNeed = {
  uuid: string;
  id: number;
  user: string;
  created_at: string;
  description: string;
  hs_code: string;
  hs_code_id: number;
  status: string;
  goods_status: string;
  quantity: string | number;
  unit: string;
  manufacturer_country: string;
  country_of_origin: string;
  price: string | number;
  currency_type: string;
  fee_type: string;
  fee_amount: string | number;
  entry_border: string;
  customs: string;
  terms_of_delivery: string;
  terms_of_payment: string;
  partial_shipment: boolean;
  means_of_transport: string;
  nw_kg: string | number;
  gw_kg: string | number;
};

type FilterOption = {
  value: string;
  label: string;
};

const goodsStatusOptions: FilterOption[] = [
  { value: "نو", label: "نو" },
  { value: "مستعمل", label: "مستعمل" },
  { value: "بازسازی شده", label: "بازسازی شده" },
];

const needStatusOptions: FilterOption[] = [
  { value: "در کشور مبدا", label: "در کشور مبدا" },
  { value: "قبض انبار دارد", label: "قبض انبار دارد" },
  { value: "بارنامه شده", label: "بارنامه شده" },
];

const currencyOptions: FilterOption[] = [
  { value: "USD", label: "دلار (USD)" },
  { value: "EUR", label: "یورو (EUR)" },
  { value: "AED", label: "درهم (AED)" },
  { value: "CNY", label: "یوان چین (CNY)" },
  { value: "TRY", label: "لیر ترکیه (TRY)" },
];

const deliveryTerms: FilterOption[] = [
  { value: "EXW", label: "EXW" },
  { value: "FOB", label: "FOB" },
  { value: "CFR", label: "CFR" },
  { value: "CIF", label: "CIF" },
  { value: "DAP", label: "DAP" },
  { value: "CPT", label: "CPT" },
  { value: "CIP", label: "CIP" },
  { value: "FCA", label: "FCA" },
  { value: "FAS", label: "FAS" },
  { value: "DDP", label: "DDP" },
  { value: "DPU", label: "DPU" },
];

const paymentTerms: FilterOption[] = [
  { value: "TT", label: "TT" },
  { value: "LC", label: "LC" },
  { value: "CAD", label: "CAD" },
  { value: "DP", label: "D/P" },
  { value: "DA", label: "D/A" },
];

const transportMeans: FilterOption[] = [
  { value: "SEA", label: "دریایی" },
  { value: "AIR", label: "هوایی" },
  { value: "ROAD", label: "زمینی" },
  { value: "RAIL", label: "ریلی" },
];

const partialShipmentOptions: FilterOption[] = [
  { value: "true", label: "بله" },
  { value: "false", label: "خیر" },
];

const borderOptions: FilterOption[] = borders.map((border) => ({
  value: border,
  label: border,
}));

const customsOptions: FilterOption[] = iranCustoms.map((customs) => ({
  value: String(customs.ctmVCodeInt),
  label: `${customs.ctmNameStr} (${customs.ctmVCodeInt})`,
}));
const needCustomsOptions: FilterOption[] = [
  { value: "ALL_CUSTOMS", label: "تمام گمرکات" },
  ...customsOptions,
];

const countryOptions: FilterOption[] = countries.map((country) => ({
  value: country.code,
  label: `${country.persianName} (${country.code})`,
}));

function optionLabel(options: readonly FilterOption[], value: string) {
  return options.find((option) => option.value === value)?.label || value;
}

function fmt(value: string | number | null | undefined) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value ? String(value) : "-";
  return n.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
}

function safeText(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function normalizeFa(value: string) {
  return (value || "")
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

type HSCodeOption = {
  id: number;
  code: string;
  goods_name_fa?: string | null;
  goods_name_en?: string | null;
};

function safeTrim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function truncateText(value: string, max = 30) {
  const text = value.trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function firstErrorMessage(data: any, fallback: string) {
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data === "object") {
    const keys = Object.keys(data);
    if (keys.length) {
      const value = data[keys[0]];
      if (typeof value === "string") return value;
      if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
  }
  return fallback;
}

async function fetchHSCodes(
  query = "",
  signal?: AbortSignal,
): Promise<HSCodeOption[]> {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE is not configured");

  const url = new URL(`${API_BASE}/hs-codes/`);
  const q = query.trim();
  if (q) url.searchParams.set("search", q);

  const res = await authFetch(url.toString(), {
    method: "GET",
    cache: "no-store",
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as any;

  if (!res.ok) {
    throw new Error(firstErrorMessage(data, "خطا در دریافت HS Code ها"));
  }

  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];

  return items.map((item: any) => ({
    id: Number(item.id),
    code: String(item.code ?? ""),
    goods_name_fa: item.goods_name_fa ?? null,
    goods_name_en: item.goods_name_en ?? null,
  }));
}

function HSCodeCombobox(props: {
  label: string;
  valueCode: string;
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

  const selected = React.useMemo(() => {
    if (!props.valueCode) return null;
    const inItems = items.find((item) => item.code === props.valueCode);
    if (inItems) return inItems;
    for (const value of props.selectedCache.values()) {
      if (value.code === props.valueCode) return value;
    }
    return null;
  }, [items, props.selectedCache, props.valueCode]);

  const selectedLabel = React.useMemo(() => {
    if (!selected) return "";
    const fa = safeTrim(selected.goods_name_fa);
    const en = safeTrim(selected.goods_name_en);
    const name = fa || en;
    const shortName = truncateText(name, 30);
    return shortName ? `${selected.code} - ${shortName}` : selected.code;
  }, [selected]);

  React.useEffect(() => {
    if (!open) return;

    const ac = new AbortController();
    setLoading(true);
    setLoadError("");

    fetchHSCodes(debouncedQ, ac.signal)
      .then((results) => {
        setItems(results);
        results.forEach((item) => props.selectedCache.set(item.id, item));
      })
      .catch((err: any) => {
        if (err?.name === "AbortError") return;
        setLoadError(err?.message || "خطا در جستجوی HS Code");
        setItems([]);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [debouncedQ, open, props.selectedCache]);

  const mergedItems = React.useMemo(() => {
    if (!props.valueCode) return items;
    if (items.some((item) => item.code === props.valueCode)) return items;
    const cached = Array.from(props.selectedCache.values()).find(
      (item) => item.code === props.valueCode,
    );
    return cached ? [cached, ...items] : items;
  }, [items, props.selectedCache, props.valueCode]);

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
              placeholder="جستجو در کد یا نام کالا..."
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
              {mergedItems.map((item) => {
                const fa = safeTrim(item.goods_name_fa);
                const en = safeTrim(item.goods_name_en);
                const name = fa || en;
                const shortName = truncateText(name, 30);
                const label = shortName
                  ? `${item.code} - ${shortName}`
                  : item.code;
                const isSelected = item.code === props.valueCode;

                return (
                  <CommandItem
                    key={item.id}
                    value={String(item.id)}
                    onSelect={() => {
                      props.onChangeCode(item.code);
                      setOpen(false);
                      setQ("");
                    }}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate" title={fa || en || item.code}>
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

function SearchableCombobox(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: readonly FilterOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  rightAction?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const selected = React.useMemo(
    () => props.items.find((item) => item.value === props.value),
    [props.items, props.value],
  );
  const filtered = React.useMemo(() => {
    const query = normalizeFa(q);
    if (!query) return props.items;
    return props.items.filter((item) =>
      normalizeFa(`${item.label} ${item.value}`).includes(query),
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
              {filtered.map((item) => {
                const isSelected = item.value === props.value;
                return (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={() => {
                      props.onChange(item.value);
                      setOpen(false);
                      setQ("");
                    }}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate">{item.label}</span>
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

async function fetchNeeds(args: {
  q?: string;
  hsCode?: string;
  status?: string;
  goodsStatus?: string;
  currencyType?: string;
  entryBorder?: string;
  customs?: string;
  manufacturerCountry?: string;
  countryOfOrigin?: string;
  termsOfDelivery?: string;
  termsOfPayment?: string;
  meansOfTransport?: string;
  partialShipment?: string;
  signal?: AbortSignal;
}) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");

  const url = new URL(`${API_BASE}/marketplace/goods-needs/`);
  if (args.q?.trim()) url.searchParams.set("q", args.q.trim());
  if (args.hsCode?.trim()) url.searchParams.set("hs_code", args.hsCode.trim());
  if (args.status?.trim()) url.searchParams.set("status", args.status.trim());
  if (args.goodsStatus?.trim()) url.searchParams.set("goods_status", args.goodsStatus.trim());
  if (args.currencyType?.trim()) url.searchParams.set("currency_type", args.currencyType.trim());
  if (args.entryBorder?.trim()) url.searchParams.set("entry_border", args.entryBorder.trim());
  if (args.customs?.trim()) url.searchParams.set("customs", args.customs.trim());
  if (args.manufacturerCountry?.trim()) url.searchParams.set("manufacturer_country", args.manufacturerCountry.trim());
  if (args.countryOfOrigin?.trim()) url.searchParams.set("country_of_origin", args.countryOfOrigin.trim());
  if (args.termsOfDelivery?.trim()) url.searchParams.set("terms_of_delivery", args.termsOfDelivery.trim());
  if (args.termsOfPayment?.trim()) url.searchParams.set("terms_of_payment", args.termsOfPayment.trim());
  if (args.meansOfTransport?.trim()) url.searchParams.set("means_of_transport", args.meansOfTransport.trim());
  if (args.partialShipment?.trim()) url.searchParams.set("partial_shipment", args.partialShipment.trim());

  const res = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
    signal: args.signal,
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "خطا در دریافت نیازهای کالا");
  return (Array.isArray(data) ? data : data?.results || []) as GoodsNeed[];
}

function NeedCard({ need }: { need: GoodsNeed }) {
  return (
    <Card className="group overflow-hidden shadow-sm before:h-1 before:bg-amber-600 before:content-['']">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-600 text-white shadow-sm">
            <PackageSearch className="h-6 w-6" />
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            <Badge variant="outline">{safeText(need.status)}</Badge>
            <Badge variant="secondary">{safeText(need.goods_status)}</Badge>
            <Badge variant="outline">{safeText(need.currency_type)}</Badge>
          </div>
        </div>
        <div>
          <CardTitle className="text-lg">{safeText(need.description)}</CardTitle>
          <CardDescription className="mt-2">
            نیاز کالا #{safeText(need.id)} توسط {safeText(need.user)}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 rounded-2xl bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Boxes className="h-4 w-4" />
              HS
            </span>
            <span className="font-semibold">{safeText(need.hs_code)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">مقدار</span>
            <span className="font-medium">
              {fmt(need.quantity)} {safeText(need.unit)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <BadgeDollarSign className="h-4 w-4" />
              قیمت
            </span>
            <span className="font-semibold">
              {fmt(need.price)} {safeText(need.currency_type)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              مرز ورودی
            </span>
            <span className="font-medium">{safeText(need.entry_border)}</span>
          </div>
        </div>

        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-2">
            کشور سازنده: {safeText(need.manufacturer_country)}
          </div>
          <div className="rounded-xl border bg-card p-2">
            کشور مبدا: {safeText(need.country_of_origin)}
          </div>
          <div className="rounded-xl border bg-card p-2">
            گمرک: {safeText(need.customs)}
          </div>
          <div className="rounded-xl border bg-card p-2">
            تحویل: {safeText(need.terms_of_delivery)}
          </div>
          <div className="rounded-xl border bg-card p-2">
            پرداخت: {safeText(need.terms_of_payment)}
          </div>
        </div>

        <Separator />

        <Button asChild variant="outline" className="w-full">
          <Link href={`/marketplace?hs_code=${encodeURIComponent(safeText(need.hs_code))}`}>
            جستجوی ثبت سفارش مشابه
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function NeedsMarketplaceList() {
  const [q, setQ] = React.useState("");
  const [hsCode, setHsCode] = React.useState("");
  const [draftHsCode, setDraftHsCode] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [draftStatus, setDraftStatus] = React.useState("");
  const [goodsStatus, setGoodsStatus] = React.useState("");
  const [draftGoodsStatus, setDraftGoodsStatus] = React.useState("");
  const [currencyType, setCurrencyType] = React.useState("");
  const [draftCurrencyType, setDraftCurrencyType] = React.useState("");
  const [entryBorder, setEntryBorder] = React.useState("");
  const [draftEntryBorder, setDraftEntryBorder] = React.useState("");
  const [customs, setCustoms] = React.useState("");
  const [draftCustoms, setDraftCustoms] = React.useState("");
  const [manufacturerCountry, setManufacturerCountry] = React.useState("");
  const [draftManufacturerCountry, setDraftManufacturerCountry] = React.useState("");
  const [countryOfOrigin, setCountryOfOrigin] = React.useState("");
  const [draftCountryOfOrigin, setDraftCountryOfOrigin] = React.useState("");
  const [termsOfDelivery, setTermsOfDelivery] = React.useState("");
  const [draftTermsOfDelivery, setDraftTermsOfDelivery] = React.useState("");
  const [termsOfPayment, setTermsOfPayment] = React.useState("");
  const [draftTermsOfPayment, setDraftTermsOfPayment] = React.useState("");
  const [meansOfTransport, setMeansOfTransport] = React.useState("");
  const [draftMeansOfTransport, setDraftMeansOfTransport] = React.useState("");
  const [partialShipment, setPartialShipment] = React.useState("");
  const [draftPartialShipment, setDraftPartialShipment] = React.useState("");
  const hsSelectedCacheRef = React.useRef(new Map<number, HSCodeOption>());
  const [items, setItems] = React.useState<GoodsNeed[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [filterOpen, setFilterOpen] = React.useState(false);

  const load = React.useCallback(() => {
    const ac = new AbortController();
    setLoading(true);
    setError("");
    fetchNeeds({
      q,
      hsCode,
      status,
      goodsStatus,
      currencyType,
      entryBorder,
      customs,
      manufacturerCountry,
      countryOfOrigin,
      termsOfDelivery,
      termsOfPayment,
      meansOfTransport,
      partialShipment,
      signal: ac.signal,
    })
      .then(setItems)
      .catch((err: any) => {
        if (err?.name === "AbortError") return;
        setError(err?.message || "خطا");
        setItems([]);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [
    q,
    hsCode,
    status,
    goodsStatus,
    currencyType,
    entryBorder,
    customs,
    manufacturerCountry,
    countryOfOrigin,
    termsOfDelivery,
    termsOfPayment,
    meansOfTransport,
    partialShipment,
  ]);

  React.useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  function resetFilters() {
    setQ("");
    clearAdvancedFilters();
  }

  function clearAdvancedFilters() {
    setHsCode("");
    setDraftHsCode("");
    setStatus("");
    setDraftStatus("");
    setGoodsStatus("");
    setDraftGoodsStatus("");
    setCurrencyType("");
    setDraftCurrencyType("");
    setEntryBorder("");
    setDraftEntryBorder("");
    setCustoms("");
    setDraftCustoms("");
    setManufacturerCountry("");
    setDraftManufacturerCountry("");
    setCountryOfOrigin("");
    setDraftCountryOfOrigin("");
    setTermsOfDelivery("");
    setDraftTermsOfDelivery("");
    setTermsOfPayment("");
    setDraftTermsOfPayment("");
    setMeansOfTransport("");
    setDraftMeansOfTransport("");
    setPartialShipment("");
    setDraftPartialShipment("");
  }

  function openFilters() {
    setDraftHsCode(hsCode);
    setDraftStatus(status);
    setDraftGoodsStatus(goodsStatus);
    setDraftCurrencyType(currencyType);
    setDraftEntryBorder(entryBorder);
    setDraftCustoms(customs);
    setDraftManufacturerCountry(manufacturerCountry);
    setDraftCountryOfOrigin(countryOfOrigin);
    setDraftTermsOfDelivery(termsOfDelivery);
    setDraftTermsOfPayment(termsOfPayment);
    setDraftMeansOfTransport(meansOfTransport);
    setDraftPartialShipment(partialShipment);
    setFilterOpen(true);
  }

  function applyFilters() {
    setHsCode(draftHsCode.trim());
    setStatus(draftStatus);
    setGoodsStatus(draftGoodsStatus);
    setCurrencyType(draftCurrencyType);
    setEntryBorder(draftEntryBorder);
    setCustoms(draftCustoms);
    setManufacturerCountry(draftManufacturerCountry);
    setCountryOfOrigin(draftCountryOfOrigin);
    setTermsOfDelivery(draftTermsOfDelivery);
    setTermsOfPayment(draftTermsOfPayment);
    setMeansOfTransport(draftMeansOfTransport);
    setPartialShipment(draftPartialShipment);
    setFilterOpen(false);
  }

  const activeFiltersCount = [
    hsCode,
    status,
    goodsStatus,
    currencyType,
    entryBorder,
    customs,
    manufacturerCountry,
    countryOfOrigin,
    termsOfDelivery,
    termsOfPayment,
    meansOfTransport,
    partialShipment,
  ].filter(Boolean).length;
  const hasAnyFilter = Boolean(q.trim() || activeFiltersCount);

  return (
    <div dir="rtl">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
        <PageHeader
          eyebrow="عمومی"
          title="مارکت‌پلیس نیاز کالا"
          description="نیازهای کالای ثبت‌شده برای پیدا کردن ثبت سفارش‌های مشابه."
          icon={<PackageSearch className="h-6 w-6" />}
          accentClassName="bg-amber-600"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/marketplace">ثبت سفارش‌ها</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/my-needs">نیازهای من</Link>
              </Button>
            </div>
          }
        />

        <Card className="mt-5">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="text-base">جستجو و فیلتر</CardTitle>
                <CardDescription>
                  جستجو سریع در صفحه، فیلترهای دقیق داخل پنل کناری
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {hasAnyFilter ? (
                  <Button variant="ghost" onClick={resetFilters}>
                    پاک کردن فیلترها
                  </Button>
                ) : null}
                <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="rounded-xl" onClick={openFilters}>
                      <SlidersHorizontal className="ms-2 h-4 w-4" />
                      فیلترها
                      {activeFiltersCount ? (
                        <Badge className="ms-2 rounded-xl" variant="secondary">
                          {fmt(activeFiltersCount)}
                        </Badge>
                      ) : null}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-[92vw] max-w-[420px] p-0 [&>button]:left-4 [&>button]:right-auto [&>button]:top-4"
                  >
                    <SheetHeader className="p-4 text-right">
                      <SheetTitle className="text-right">فیلترهای نیاز کالا</SheetTitle>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="text-xs text-muted-foreground">
                          {activeFiltersCount ? `${fmt(activeFiltersCount)} فیلتر فعال` : "بدون فیلتر"}
                        </div>
                        <div className="flex items-center gap-2">
                          {activeFiltersCount ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 rounded-xl px-3"
                              onClick={clearAdvancedFilters}
                            >
                              پاک‌کردن
                            </Button>
                          ) : null}
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

                    <ScrollArea className="h-[calc(100dvh-154px)]">
                      <div className="p-4">
                        <Accordion type="multiple" defaultValue={["goods"]}>
                          <AccordionItem value="goods">
                            <AccordionTrigger className="text-right">
                              کالا و HS Code
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <HSCodeCombobox
                                label="HS Code"
                                valueCode={draftHsCode}
                                onChangeCode={setDraftHsCode}
                                selectedCache={hsSelectedCacheRef.current}
                                rightAction={
                                  draftHsCode ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="h-8 rounded-xl px-2 text-xs"
                                      onClick={() => setDraftHsCode("")}
                                    >
                                      <X className="h-4 w-4" />
                                      پاک کردن
                                    </Button>
                                  ) : null
                                }
                              />
                              <p className="text-xs leading-6 text-muted-foreground">
                                برای match دقیق با ثبت سفارش‌ها، HS Code را از لیست انتخاب کنید.
                              </p>
                              <div className="hidden">
                                <Label className="text-sm">HS Code دقیق</Label>
                                <div className="relative">
                                  <Input
                                    value={draftHsCode}
                                    onChange={(event) => setDraftHsCode(event.target.value)}
                                    placeholder="مثلا 01012100"
                                    className="rounded-xl pl-9"
                                  />
                                  {draftHsCode ? (
                                    <button
                                      type="button"
                                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                      onClick={() => setDraftHsCode("")}
                                      aria-label="پاک کردن HS"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  ) : null}
                                </div>
                                <p className="text-xs leading-6 text-muted-foreground">
                                  برای match دقیق با ثبت سفارش‌ها، کد HS را کامل وارد کنید.
                                </p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="trade">
                            <AccordionTrigger className="text-right">
                              کالا و ارز
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <SearchableCombobox
                                label="وضعیت نیاز کالا"
                                value={draftStatus}
                                onChange={setDraftStatus}
                                items={needStatusOptions}
                                placeholder="انتخاب وضعیت نیاز کالا"
                                rightAction={
                                  draftStatus ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="h-8 rounded-xl px-2 text-xs"
                                      onClick={() => setDraftStatus("")}
                                    >
                                      <X className="h-4 w-4" />
                                      پاک کردن
                                    </Button>
                                  ) : null
                                }
                              />
                              <SearchableCombobox
                                label="وضعیت کالا"
                                value={draftGoodsStatus}
                                onChange={setDraftGoodsStatus}
                                items={goodsStatusOptions}
                                placeholder="انتخاب وضعیت کالا"
                                rightAction={
                                  draftGoodsStatus ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="h-8 rounded-xl px-2 text-xs"
                                      onClick={() => setDraftGoodsStatus("")}
                                    >
                                      <X className="h-4 w-4" />
                                      پاک کردن
                                    </Button>
                                  ) : null
                                }
                              />
                              <SearchableCombobox
                                label="نوع ارز"
                                value={draftCurrencyType}
                                onChange={setDraftCurrencyType}
                                items={currencyOptions}
                                placeholder="انتخاب ارز"
                                searchPlaceholder="جستجو در ارزها..."
                                rightAction={
                                  draftCurrencyType ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="h-8 rounded-xl px-2 text-xs"
                                      onClick={() => setDraftCurrencyType("")}
                                    >
                                      <X className="h-4 w-4" />
                                      پاک کردن
                                    </Button>
                                  ) : null
                                }
                              />
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="origin">
                            <AccordionTrigger className="text-right">
                              مبدا و مرز
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <SearchableCombobox
                                label="مرز ورودی"
                                value={draftEntryBorder}
                                onChange={setDraftEntryBorder}
                                items={borderOptions}
                                placeholder="انتخاب مرز ورودی"
                                searchPlaceholder="جستجو در مرزها..."
                                rightAction={
                                  draftEntryBorder ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="h-8 rounded-xl px-2 text-xs"
                                      onClick={() => setDraftEntryBorder("")}
                                    >
                                      <X className="h-4 w-4" />
                                      پاک کردن
                                    </Button>
                                  ) : null
                                }
                              />
                              <SearchableCombobox
                                label="گمرک"
                                value={draftCustoms}
                                onChange={setDraftCustoms}
                                items={needCustomsOptions}
                                placeholder="انتخاب گمرک"
                                searchPlaceholder="جستجو در گمرک‌ها..."
                                rightAction={
                                  draftCustoms ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="h-8 rounded-xl px-2 text-xs"
                                      onClick={() => setDraftCustoms("")}
                                    >
                                      <X className="h-4 w-4" />
                                      پاک کردن
                                    </Button>
                                  ) : null
                                }
                              />
                              <SearchableCombobox
                                label="کشور سازنده"
                                value={draftManufacturerCountry}
                                onChange={setDraftManufacturerCountry}
                                items={countryOptions}
                                placeholder="انتخاب کشور سازنده"
                                searchPlaceholder="جستجو: نام فارسی / انگلیسی / کد..."
                                rightAction={
                                  draftManufacturerCountry ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="h-8 rounded-xl px-2 text-xs"
                                      onClick={() => setDraftManufacturerCountry("")}
                                    >
                                      <X className="h-4 w-4" />
                                      پاک کردن
                                    </Button>
                                  ) : null
                                }
                              />
                              <SearchableCombobox
                                label="کشور مبدا"
                                value={draftCountryOfOrigin}
                                onChange={setDraftCountryOfOrigin}
                                items={countryOptions}
                                placeholder="انتخاب کشور مبدا"
                                searchPlaceholder="جستجو: نام فارسی / انگلیسی / کد..."
                                rightAction={
                                  draftCountryOfOrigin ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="h-8 rounded-xl px-2 text-xs"
                                      onClick={() => setDraftCountryOfOrigin("")}
                                    >
                                      <X className="h-4 w-4" />
                                      پاک کردن
                                    </Button>
                                  ) : null
                                }
                              />
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="terms">
                            <AccordionTrigger className="text-right">
                              شرایط معامله
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <SearchableCombobox
                                label="شرایط تحویل"
                                value={draftTermsOfDelivery}
                                onChange={setDraftTermsOfDelivery}
                                items={deliveryTerms}
                                placeholder="انتخاب شرایط تحویل"
                                rightAction={
                                  draftTermsOfDelivery ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="h-8 rounded-xl px-2 text-xs"
                                      onClick={() => setDraftTermsOfDelivery("")}
                                    >
                                      <X className="h-4 w-4" />
                                      پاک کردن
                                    </Button>
                                  ) : null
                                }
                              />
                              <SearchableCombobox
                                label="شرایط پرداخت"
                                value={draftTermsOfPayment}
                                onChange={setDraftTermsOfPayment}
                                items={paymentTerms}
                                placeholder="انتخاب شرایط پرداخت"
                                rightAction={
                                  draftTermsOfPayment ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="h-8 rounded-xl px-2 text-xs"
                                      onClick={() => setDraftTermsOfPayment("")}
                                    >
                                      <X className="h-4 w-4" />
                                      پاک کردن
                                    </Button>
                                  ) : null
                                }
                              />
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="logistics">
                            <AccordionTrigger className="text-right">
                              حمل
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <SearchableCombobox
                                label="روش حمل"
                                value={draftMeansOfTransport}
                                onChange={setDraftMeansOfTransport}
                                items={transportMeans}
                                placeholder="انتخاب روش حمل"
                                rightAction={
                                  draftMeansOfTransport ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="h-8 rounded-xl px-2 text-xs"
                                      onClick={() => setDraftMeansOfTransport("")}
                                    >
                                      <X className="h-4 w-4" />
                                      پاک کردن
                                    </Button>
                                  ) : null
                                }
                              />
                              <SearchableCombobox
                                label="حمل به دفعات"
                                value={draftPartialShipment}
                                onChange={setDraftPartialShipment}
                                items={partialShipmentOptions}
                                placeholder="انتخاب وضعیت"
                                rightAction={
                                  draftPartialShipment ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="h-8 rounded-xl px-2 text-xs"
                                      onClick={() => setDraftPartialShipment("")}
                                    >
                                      <X className="h-4 w-4" />
                                      پاک کردن
                                    </Button>
                                  ) : null
                                }
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </ScrollArea>

                    <SheetFooter className="mt-auto border-t p-4">
                      <div className="grid w-full grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => {
                            clearAdvancedFilters();
                            setFilterOpen(false);
                          }}
                        >
                          پاک کردن
                        </Button>
                        <Button className="rounded-xl" onClick={applyFilters}>
                          اعمال فیلتر
                        </Button>
                      </div>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
                <Button variant="outline" onClick={() => load()} disabled={loading}>
                  <RefreshCw className="h-4 w-4" />
                  بروزرسانی
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  className="pr-9"
                  placeholder="مثلا شرح کالا، مرز ورودی یا HS Code..."
                />
              </div>
            </div>
            {activeFiltersCount ? (
              <div className="flex flex-wrap gap-2">
                {hsCode ? (
                  <Badge variant="secondary">HS: {hsCode}</Badge>
                ) : null}
                {status ? (
                  <Badge variant="secondary">
                    وضعیت نیاز: {optionLabel(needStatusOptions, status)}
                  </Badge>
                ) : null}
                {goodsStatus ? (
                  <Badge variant="secondary">
                    وضعیت: {optionLabel(goodsStatusOptions, goodsStatus)}
                  </Badge>
                ) : null}
                {currencyType ? (
                  <Badge variant="secondary">
                    ارز: {optionLabel(currencyOptions, currencyType)}
                  </Badge>
                ) : null}
                {entryBorder ? (
                  <Badge variant="secondary">
                    مرز: {optionLabel(borderOptions, entryBorder)}
                  </Badge>
                ) : null}
                {customs ? (
                  <Badge variant="secondary">
                    گمرک: {optionLabel(needCustomsOptions, customs)}
                  </Badge>
                ) : null}
                {manufacturerCountry ? (
                  <Badge variant="secondary">
                    سازنده: {optionLabel(countryOptions, manufacturerCountry)}
                  </Badge>
                ) : null}
                {countryOfOrigin ? (
                  <Badge variant="secondary">
                    مبدا: {optionLabel(countryOptions, countryOfOrigin)}
                  </Badge>
                ) : null}
                {termsOfDelivery ? (
                  <Badge variant="secondary">
                    تحویل: {optionLabel(deliveryTerms, termsOfDelivery)}
                  </Badge>
                ) : null}
                {termsOfPayment ? (
                  <Badge variant="secondary">
                    پرداخت: {optionLabel(paymentTerms, termsOfPayment)}
                  </Badge>
                ) : null}
                {meansOfTransport ? (
                  <Badge variant="secondary">
                    حمل: {optionLabel(transportMeans, meansOfTransport)}
                  </Badge>
                ) : null}
                {partialShipment ? (
                  <Badge variant="secondary">
                    حمل به دفعات: {optionLabel(partialShipmentOptions, partialShipment)}
                  </Badge>
                ) : null}
              </div>
            ) : null}
            <div className="text-sm text-muted-foreground">
              {loading ? "در حال دریافت..." : `${fmt(items.length)} نیاز کالا`}
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Alert variant="destructive" className="mt-5">
            <AlertTitle>خطا</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.length ? (
            items.map((need) => <NeedCard key={need.uuid} need={need} />)
          ) : !loading ? (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                نیاز کالایی با این فیلترها پیدا نشد.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
    </div>
  );
}
