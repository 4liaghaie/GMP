"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  useForm,
  useFieldArray,
  type SubmitHandler,
  Controller,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { authFetch } from "@/lib/auth-api";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

import { countries } from "@/lib/countryList";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// -------------------------
// Options
// -------------------------
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

const unitOptions = [
  { value: "KG", label: "کیلوگرم (KG)" },
  { value: "PCS", label: "عدد (PCS)" },
  { value: "TON", label: "تن (TON)" },
  { value: "L", label: "لیتر (L)" },
  { value: "M", label: "متر (M)" },
] as const;

// -------------------------
// Schema
// -------------------------
const goodSchema = z.object({
  description: z.string().min(1, "شرح کالا الزامی است"),
  hs_code_id: z.coerce.number().int().positive("کد HS (ID) الزامی است"),
  quantity: z.coerce.number().positive("مقدار باید بیشتر از ۰ باشد"),
  origin: z.string().min(1, "مبدا الزامی است"),
  unit_price: z.coerce.number().nonnegative("قیمت واحد باید >= ۰ باشد"),
  unit: z.string().min(1, "واحد الزامی است"),
  nw_kg: z.coerce.number().nonnegative("وزن خالص باید >= ۰ باشد"),
  gw_kg: z.coerce.number().nonnegative("وزن ناخالص باید >= ۰ باشد"),
});

const orderSchema = z.object({
  order_number: z.string().min(1, "شماره ثبت سفارش الزامی است"),
  freight_price: z.coerce.number().nonnegative("کرایه حمل باید >= ۰ باشد"),

  currency_type: z.string().min(1, "نوع ارز الزامی است"),
  seller_country: z.string().min(1, "کشور فروشنده الزامی است"),

  date: z.string().min(1, "تاریخ الزامی است"),
  expire_date: z.string().min(1, "تاریخ انقضا الزامی است"),

  terms_of_delivery: z.string().min(1, "شرایط تحویل الزامی است"),
  terms_of_payment: z.string().min(1, "شرایط پرداخت الزامی است"),
  partial_shipment: z.boolean().default(false),
  means_of_transport: z.string().min(1, "روش حمل الزامی است"),

  country_of_origin: z.string().min(1, "کشور مبدا الزامی است"),
  standard: z.string().min(1, "استاندارد الزامی است"),

  goods: z.array(goodSchema).min(1, "حداقل یک کالا اضافه کنید"),
});

type OrderFormInput = z.input<typeof orderSchema>;
type OrderForm = z.output<typeof orderSchema>;

// -------------------------
// Types
// -------------------------
type HSCodeOption = {
  id: number;
  code: string;
  goods_name_fa?: string | null;
  goods_name_en?: string | null;
};

type Country = { name: string; code: string; persianName: string };

// -------------------------
// API helpers
// -------------------------
function firstErrorMessage(data: any, fallback: string) {
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;

  // Field errors like {order_number: ["..."], goods: [...]}
  if (typeof data === "object") {
    const keys = Object.keys(data);
    if (keys.length) {
      const v = data[keys[0]];
      if (typeof v === "string") return v;
      if (Array.isArray(v) && typeof v[0] === "string") return v[0];
      // nested array/object -> stringify safely
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

  if (!res.ok) {
    throw new Error(firstErrorMessage(data, "خطا در دریافت HS Code ها"));
  }

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

async function createRegisteredOrder(payload: {
  order_number: string;
  freight_price: string;
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
  goods: Array<{
    description: string;
    hs_code_id: number;
    quantity: string;
    origin: string;
    unit_price: string;
    unit: string;
    nw_kg: string;
    gw_kg: string;
  }>;
}) {
  if (!API_BASE) throw new Error("متغیر NEXT_PUBLIC_API_BASE تنظیم نشده است");

  const res = await authFetch(`${API_BASE}/registered-orders/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as any;

  if (!res.ok) {
    // Prefer specific order_number error if present
    const msg =
      (Array.isArray(data?.order_number) && data.order_number[0]) ||
      firstErrorMessage(data, "ثبت سفارش با خطا مواجه شد");
    throw new Error(msg);
  }

  // backend should return uuid + order_number (or at least uuid)
  return data as { uuid?: string; order_number?: string };
}

// -------------------------
// Utils
// -------------------------
function fmt(n: number) {
  const x = Number.isFinite(n) ? n : 0;
  return x.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
}

function truncateText(s: string, max = 30) {
  const t = (s ?? "").trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max) + "..." : t;
}

function formatYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

function parseYmdToDate(ymd: string): Date | undefined {
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(ymd);
  if (!m) return undefined;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d)
    return undefined;
  return dt;
}

function todayYmd() {
  return formatYmd(new Date());
}

function safeTrim(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeFa(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

// -------------------------
// Hooks
// -------------------------
function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

// -------------------------
// UI components
// -------------------------
function Field(props: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label className="text-sm">{props.label}</Label>
        {props.hint ? (
          <span className="text-xs text-muted-foreground">{props.hint}</span>
        ) : null}
      </div>
      {props.children}
      {props.error ? (
        <p className="text-sm text-destructive">{props.error}</p>
      ) : null}
    </div>
  );
}

function SummaryRow(props: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{props.label}</span>
      <span>{props.value}</span>
    </div>
  );
}

function DatePickerField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  minDate?: Date;
}) {
  const selected = parseYmdToDate(props.value);

  return (
    <div className="space-y-2">
      <Label className="text-sm">{props.label}</Label>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
          >
            <span className={props.value ? "" : "text-muted-foreground"}>
              {props.value || props.placeholder || "انتخاب تاریخ"}
            </span>
            <span className="text-muted-foreground">📅</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (!d) return;
              props.onChange(formatYmd(d));
            }}
            disabled={(d) => (props.minDate ? d < props.minDate : false)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {props.error ? (
        <p className="text-sm text-destructive">{props.error}</p>
      ) : null}
    </div>
  );
}

/**
 * Generic searchable combobox (client-side filtering)
 */
function SearchableCombobox<T extends { value: string; label: string }>(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: readonly T[];
  placeholder?: string;
  error?: string;
  searchPlaceholder?: string;
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

    return props.items.filter((it) => {
      const hay = normalizeFa(`${it.label} ${it.value}`);
      return hay.includes(qq);
    });
  }, [props.items, q]);

  return (
    <div className="space-y-2">
      <Label className="text-sm">{props.label}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
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

      {props.error ? (
        <p className="text-sm text-destructive">{props.error}</p>
      ) : null}
    </div>
  );
}

function CountryCombobox(props: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  error?: string;
  placeholder?: string;
}) {
  const items = React.useMemo(
    () =>
      countries.map((c: Country) => ({
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
      placeholder={props.placeholder || "انتخاب کشور..."}
      error={props.error}
      searchPlaceholder="جستجو: نام فارسی / انگلیسی / کد..."
    />
  );
}

// -------------------------
// HSCode Combobox (backend search)
// -------------------------
function HSCodeCombobox(props: {
  label?: string;
  value: number;
  onChange: (id: number) => void;
  selectedCache: Map<number, HSCodeOption>;
  error?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const debouncedQ = useDebouncedValue(q, 250);

  const [items, setItems] = React.useState<HSCodeOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");

  const selected =
    items.find((x) => x.id === props.value) ||
    props.selectedCache.get(props.value);

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
    if (!props.value) return items;
    if (items.some((x) => x.id === props.value)) return items;
    const cached = props.selectedCache.get(props.value);
    return cached ? [cached, ...items] : items;
  }, [items, props.value, props.selectedCache]);

  return (
    <div className="space-y-2">
      <Label className="text-sm">{props.label ?? "کد HS"}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
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
                const isSelected = h.id === props.value;

                return (
                  <CommandItem
                    key={h.id}
                    value={String(h.id)}
                    onSelect={() => {
                      props.onChange(h.id);
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

      {props.error ? (
        <p className="text-sm text-destructive">{props.error}</p>
      ) : null}
    </div>
  );
}

// -------------------------
// Goods Row Component
// -------------------------
function GoodsRow(props: {
  idx: number;
  canRemove: boolean;
  onRemove: () => void;

  register: ReturnType<typeof useForm<OrderFormInput>>["register"];
  control: ReturnType<typeof useForm<OrderFormInput>>["control"];
  watch: ReturnType<typeof useForm<OrderFormInput>>["watch"];
  errors: any;

  hsSelectedCache: Map<number, HSCodeOption>;
}) {
  const { idx, canRemove, onRemove, register, control, watch, errors } = props;

  const rowErr = errors?.goods?.[idx];
  const qty = Number(watch(`goods.${idx}.quantity`) || 0);
  const price = Number(watch(`goods.${idx}.unit_price`) || 0);

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">کالا #{idx + 1}</div>
        <Button
          type="button"
          variant="outline"
          onClick={onRemove}
          disabled={!canRemove}
        >
          حذف
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="شرح کالا" error={rowErr?.description?.message}>
          <Input {...register(`goods.${idx}.description` as const)} />
        </Field>

        <Controller
          control={control}
          name={`goods.${idx}.hs_code_id` as const}
          render={({ field }) => (
            <HSCodeCombobox
              label="کد HS"
              value={Number(field.value || 0)}
              onChange={(id) => field.onChange(id)}
              selectedCache={props.hsSelectedCache}
              error={rowErr?.hs_code_id?.message}
            />
          )}
        />

        <Field label="مقدار" error={rowErr?.quantity?.message}>
          <Input
            type="number"
            step="0.01"
            {...register(`goods.${idx}.quantity` as const)}
          />
        </Field>

        <Controller
          control={control}
          name={`goods.${idx}.unit` as const}
          render={({ field }) => (
            <SearchableCombobox
              label="واحد"
              value={field.value || ""}
              onChange={field.onChange}
              items={unitOptions}
              placeholder="انتخاب واحد"
              searchPlaceholder="جستجو در واحدها..."
              error={rowErr?.unit?.message}
            />
          )}
        />

        <Field label="قیمت واحد" error={rowErr?.unit_price?.message}>
          <Input
            type="number"
            step="0.0001"
            {...register(`goods.${idx}.unit_price` as const)}
          />
        </Field>

        <Controller
          control={control}
          name={`goods.${idx}.origin` as const}
          render={({ field }) => (
            <CountryCombobox
              label="مبدا"
              value={field.value || ""}
              onChange={field.onChange}
              error={rowErr?.origin?.message}
              placeholder="انتخاب کشور مبدا کالا"
            />
          )}
        />

        <Field label="وزن خالص (کیلوگرم)" error={rowErr?.nw_kg?.message}>
          <Input
            type="number"
            step="0.01"
            {...register(`goods.${idx}.nw_kg` as const)}
          />
        </Field>

        <Field label="وزن ناخالص (کیلوگرم)" error={rowErr?.gw_kg?.message}>
          <Input
            type="number"
            step="0.01"
            {...register(`goods.${idx}.gw_kg` as const)}
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="rounded-md border px-2 py-1">
          جمع این ردیف:{" "}
          <span className="font-medium text-foreground">
            {fmt(qty * price)}
          </span>
        </span>
      </div>
    </div>
  );
}

// -------------------------
// Main Page
// -------------------------
export default function AddRegisteredOrderPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const hsSelectedCacheRef = React.useRef<Map<number, HSCodeOption>>(new Map());

  React.useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  const form = useForm<OrderFormInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      order_number: "",
      freight_price: 0,

      currency_type: "USD",
      seller_country: "CN",

      date: todayYmd(),
      expire_date: "2028/01/01",

      terms_of_delivery: "FOB",
      terms_of_payment: "TT",
      partial_shipment: false,
      means_of_transport: "SEA",

      country_of_origin: "CN",
      standard: "STD",

      goods: [
        {
          description: "",
          hs_code_id: 0,
          quantity: 1,
          origin: "CN",
          unit_price: 0,
          unit: "KG",
          nw_kg: 0,
          gw_kg: 0,
        },
      ],
    },
    mode: "onChange",
  });

  const { control, register, handleSubmit, watch, formState, setValue } = form;
  const { errors } = formState;

  const goodsFA = useFieldArray({
    control,
    name: "goods",
  });

  const goods = useWatch({ control, name: "goods" });
  const freight = useWatch({ control, name: "freight_price" });

  const goodsTotal = React.useMemo(() => {
    return (goods || []).reduce((sum, g) => {
      const qty = Number(g?.quantity ?? 0);
      const price = Number(g?.unit_price ?? 0);
      return sum + qty * price;
    }, 0);
  }, [goods]);

  const subTotal = React.useMemo(
    () => goodsTotal + Number(freight ?? 0),
    [goodsTotal, freight],
  );

  const totalQty = React.useMemo(
    () => (goods || []).reduce((s, g) => s + Number(g?.quantity ?? 0), 0),
    [goods],
  );

  const totalNW = React.useMemo(
    () => (goods || []).reduce((s, g) => s + Number(g?.nw_kg ?? 0), 0),
    [goods],
  );

  const totalGW = React.useMemo(
    () => (goods || []).reduce((s, g) => s + Number(g?.gw_kg ?? 0), 0),
    [goods],
  );

  const onSubmit: SubmitHandler<OrderFormInput> = async (raw) => {
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const values: OrderForm = orderSchema.parse(raw);

      const payload = {
        ...values,
        order_number: String(values.order_number || "").trim(),
        freight_price: String(values.freight_price ?? 0),
        goods: values.goods.map((g) => ({
          ...g,
          hs_code_id: Number(g.hs_code_id),
          quantity: String(g.quantity ?? 0),
          unit_price: String(g.unit_price ?? 0),
          nw_kg: String(g.nw_kg ?? 0),
          gw_kg: String(g.gw_kg ?? 0),
        })),
      };

      const created = await createRegisteredOrder(payload);
      const okNumber = created?.order_number || values.order_number;
      const okUuid = created?.uuid ? ` | شناسه: ${created.uuid}` : "";
      setSuccess(`ثبت سفارش با موفقیت ایجاد شد: ${okNumber}${okUuid}`);

      router.refresh();
      // optional: go to list
       router.push("/my-orders");
    } catch (e: any) {
      setError(e?.message || "خطا در ایجاد ثبت سفارش");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  return (
    <div dir="rtl" className="">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">ایجاد ثبت سفارش</h1>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              ثبت سفارش جدید را همراه با کالاها وارد کنید.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/my-orders")}
            >
              لیست ثبت سفارش‌ها
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              بازگشت
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {(error || success) && (
                <Alert variant={error ? "destructive" : "default"}>
                  <AlertTitle>{error ? "خطا" : "موفق"}</AlertTitle>
                  <AlertDescription>{error || success}</AlertDescription>
                </Alert>
              )}

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">اطلاعات ثبت سفارش</CardTitle>
                  <CardDescription>
                    فیلدهای اصلی مدل RegisteredOrder
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* ✅ replaced id with order_number */}
                    <Field
                      label="شماره ثبت سفارش"
                      hint="مقدار توسط شما وارد می‌شود"
                      error={errors.order_number?.message}
                    >
                      <Input
                        placeholder="مثلا 1404/12345 یا RO-2026-0001"
                        {...register("order_number")}
                      />
                    </Field>

                    <Controller
                      control={control}
                      name="currency_type"
                      render={({ field }) => (
                        <SearchableCombobox
                          label="نوع ارز"
                          value={field.value}
                          onChange={field.onChange}
                          items={currencyOptions}
                          placeholder="انتخاب نوع ارز"
                          searchPlaceholder="جستجو در ارزها..."
                          error={errors.currency_type?.message}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="seller_country"
                      render={({ field }) => (
                        <CountryCombobox
                          label="کشور فروشنده"
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.seller_country?.message}
                          placeholder="انتخاب کشور فروشنده"
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="country_of_origin"
                      render={({ field }) => (
                        <CountryCombobox
                          label="کشور مبدا"
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.country_of_origin?.message}
                          placeholder="انتخاب کشور مبدا"
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="date"
                      render={({ field }) => (
                        <DatePickerField
                          label="تاریخ"
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.date?.message}
                          placeholder="انتخاب تاریخ"
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="expire_date"
                      render={({ field }) => (
                        <DatePickerField
                          label="تاریخ انقضا"
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.expire_date?.message}
                          placeholder="انتخاب تاریخ انقضا"
                          minDate={new Date()}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="terms_of_delivery"
                      render={({ field }) => (
                        <SearchableCombobox
                          label="شرایط تحویل (Incoterms)"
                          value={field.value}
                          onChange={field.onChange}
                          items={deliveryTerms}
                          placeholder="انتخاب شرایط تحویل"
                          searchPlaceholder="جستجو..."
                          error={errors.terms_of_delivery?.message}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="terms_of_payment"
                      render={({ field }) => (
                        <SearchableCombobox
                          label="شرایط پرداخت"
                          value={field.value}
                          onChange={field.onChange}
                          items={paymentTerms}
                          placeholder="انتخاب شرایط پرداخت"
                          searchPlaceholder="جستجو..."
                          error={errors.terms_of_payment?.message}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="means_of_transport"
                      render={({ field }) => (
                        <SearchableCombobox
                          label="روش حمل"
                          value={field.value}
                          onChange={field.onChange}
                          items={transportMeans}
                          placeholder="انتخاب روش حمل"
                          searchPlaceholder="جستجو..."
                          error={errors.means_of_transport?.message}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="standard"
                      render={({ field }) => (
                        <SearchableCombobox
                          label="استاندارد"
                          value={field.value}
                          onChange={field.onChange}
                          items={standards}
                          placeholder="انتخاب استاندارد"
                          searchPlaceholder="جستجو..."
                          error={errors.standard?.message}
                        />
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="کرایه حمل"
                      error={errors.freight_price?.message}
                    >
                      <Input
                        type="number"
                        step="0.01"
                        {...register("freight_price")}
                      />
                    </Field>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <Label className="text-sm">ارسال جزئی</Label>
                        <p className="text-xs text-muted-foreground">
                          امکان ارسال بخشی از محموله.
                        </p>
                      </div>
                      <Switch
                        checked={!!watch("partial_shipment")}
                        onCheckedChange={(v) => setValue("partial_shipment", v)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">کالاها</CardTitle>
                    <CardDescription>
                      یک یا چند کالا اضافه کنید.
                    </CardDescription>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      goodsFA.append({
                        description: "",
                        hs_code_id: 0,
                        quantity: 1,
                        origin: "CN",
                        unit_price: 0,
                        unit: "KG",
                        nw_kg: 0,
                        gw_kg: 0,
                      })
                    }
                  >
                    + افزودن کالا
                  </Button>
                </CardHeader>

                <CardContent className="space-y-6">
                  {typeof errors.goods?.message === "string" && (
                    <p className="text-sm text-destructive">
                      {errors.goods.message}
                    </p>
                  )}

                  {goodsFA.fields.map((f, idx) => (
                    <GoodsRow
                      key={f.id}
                      idx={idx}
                      canRemove={goodsFA.fields.length > 1}
                      onRemove={() => goodsFA.remove(idx)}
                      register={register}
                      control={control}
                      watch={watch}
                      errors={errors}
                      hsSelectedCache={hsSelectedCacheRef.current}
                    />
                  ))}
                </CardContent>
              </Card>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  انصراف
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "در حال ثبت..." : "ایجاد ثبت سفارش"}
                </Button>
              </div>
            </form>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">خلاصه</CardTitle>
                <CardDescription>
                  جمع‌های سمت کلاینت (سرور دوباره محاسبه می‌کند)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <SummaryRow label="جمع کالاها" value={fmt(goodsTotal)} />
                <SummaryRow
                  label="کرایه حمل"
                  value={fmt(Number(freight || 0))}
                />
                <Separator />
                <SummaryRow
                  label="جمع کل"
                  value={<span className="font-semibold">{fmt(subTotal)}</span>}
                />
                <Separator />
                <SummaryRow label="جمع مقدار" value={fmt(totalQty)} />
                <SummaryRow
                  label="جمع وزن خالص"
                  value={`${fmt(totalNW)} کیلوگرم`}
                />
                <SummaryRow
                  label="جمع وزن ناخالص"
                  value={`${fmt(totalGW)} کیلوگرم`}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
