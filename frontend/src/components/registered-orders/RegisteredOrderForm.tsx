"use client";

import * as React from "react";
import { z } from "zod";
import {
  Controller,
  useFieldArray,
  useForm,
  type SubmitHandler,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Check, ChevronsUpDown, X } from "lucide-react";
import {
  Calendar as JalaliCalendar,
  DateObject,
} from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

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
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

import { authFetch } from "@/lib/auth-api";
import { bankOptions as rawBankOptions } from "@/lib/bankList";
import { bankList as banksWithBranches } from "@/lib/branchList";
import { borders } from "@/lib/borderList";
import { countries } from "@/lib/countryList";
import { iranCustoms } from "@/lib/customsList";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

type HSCodeOption = {
  id: number;
  code: string;
  goods_name_fa?: string | null;
  goods_name_en?: string | null;
};

type Country = { name: string; code: string; persianName: string };

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

const goodsStatusOptions = [
  { value: "نو", label: "نو" },
  { value: "مستعمل", label: "مستعمل" },
  { value: "بازسازی شده", label: "بازسازی شده" },
] as const;

const deliveryTerms = [
  { value: "EXW", label: "EXW (تحویل در محل کارخانه)" },
  { value: "FOB", label: "FOB (تحویل روی عرشه کشتی)" },
  { value: "CFR", label: "CFR (هزینه و کرایه حمل)" },
  { value: "CIF", label: "CIF (هزینه، بیمه و کرایه حمل)" },
  { value: "DAP", label: "DAP (تحویل در محل مقصد)" },
  { value: "CPT", label: "CPT (کرایه حمل پرداخت‌شده تا مقصد)" },
  { value: "CIP", label: "CIP (کرایه و بیمه پرداخت‌شده تا مقصد)" },
  { value: "FCA", label: "FCA (تحویل به حمل‌کننده)" },
  { value: "FAS", label: "FAS (تحویل کنار کشتی)" },
  { value: "DDP", label: "DDP (تحویل در مقصد با پرداخت حقوق و عوارض گمرکی)" },
  { value: "DPU", label: "DPU (تحویل در محل تخلیه‌شده)" },
] as const;

const currencySupplyOptions = [
  { value: "خرید ارز از سیستم بانکی", label: "خرید ارز از سیستم بانکی" },
  { value: "از محل ارز خود", label: "از محل ارز خود" },
  { value: "از محل صادرات خود", label: "از محل صادرات خود" },
  { value: "تهاتر", label: "تهاتر" },
  { value: "از محل صادرات دیگران", label: "از محل صادرات دیگران" },
  { value: "از محل ارز دیگران", label: "از محل ارز دیگران" },
  { value: "از محل صادرات", label: "از محل صادرات" },
] as const;

const feeTypeOptions = [
  { value: "فی دریافتی", label: "فی دریافتی" },
  { value: "فی پرداختی", label: "فی پرداختی" },
] as const;

const transportMeans = [
  { value: "SEA", label: "دریایی" },
  { value: "AIR", label: "هوایی" },
  { value: "ROAD", label: "زمینی" },
  { value: "RAIL", label: "ریلی" },
] as const;

const borderOptions = borders.map((border) => ({
  value: border,
  label: border,
}));

const customsOptions = iranCustoms.map((customs) => ({
  value: String(customs.ctmVCodeInt),
  label: `${customs.ctmNameStr} (${customs.ctmVCodeInt})`,
}));

const bankOptions = rawBankOptions.map((bank) => ({
  value: String(bank.value),
  label: bank.label,
}));

function getBranchOptions(bankValue: string) {
  const selectedBank = banksWithBranches.find(
    (bank) =>
      String(bank.label) === bankValue ||
      String(bank.value) === bankValue ||
      String(bank.bankCode) === bankValue,
  );
  const branches = selectedBank
    ? ([...((selectedBank as any).branches || [])] as Array<{
        value: string | number;
        label: string;
      }>)
    : (banksWithBranches.flatMap((bank) => [
        ...(((bank as any).branches || []) as Array<{
          value: string | number;
          label: string;
        }>),
      ]) as Array<{ value: string | number; label: string }>);

  return branches.map((branch) => ({
    value: String(branch.value),
    label: `${branch.label} (${branch.value})`,
  }));
}

const goodSchema = z.object({
  description: z.string().min(1, "شرح کالا الزامی است"),
  hs_code: z.string().optional(),
  hs_code_id: z.coerce.number().int().positive("کد HS الزامی است"),
  goods_status: z.string().min(1, "وضعیت کالا الزامی است"),
  quantity: z.coerce.number().positive("مقدار باید بیشتر از ۰ باشد"),
  origin: z.array(z.string()).min(1, "مبدا الزامی است"),
  unit_price: z.coerce.number().nonnegative("قیمت واحد باید >= ۰ باشد"),
  line_subtotal: z.coerce.number().nonnegative("ارزش کالا باید >= ۰ باشد"),
  unit: z.string().min(1, "واحد الزامی است"),
  nw_kg: z.coerce.number().nonnegative("وزن خالص باید >= ۰ باشد"),
  gw_kg: z.coerce.number().nonnegative("وزن ناخالص باید >= ۰ باشد"),
});

const orderSchema = z.object({
  uuid: z.string().optional(),
  order_number: z.string().optional(),
  order_pdf: z.any().optional(),
  order_pdf_url: z.string().optional(),
  id: z.string().min(1, "شناسه ثبت سفارش الزامی است"),
  freight_price: z.coerce.number().nonnegative("کرایه حمل باید >= ۰ باشد"),
  currency_type: z.string().min(1, "نوع ارز الزامی است"),
  fee_type: z.string().min(1, "نوع فی الزامی است"),
  fee_amount: z.coerce.number().nonnegative("مبلغ فی باید >= ۰ باشد"),
  applicant_name: z.string().min(1, "نام درخواست‌دهنده الزامی است"),
  national_code: z.string().optional().default(""),
  entry_border: z.array(z.string()).min(1, "مرز ورودی الزامی است"),
  customs: z.array(z.string()).min(1, "گمرک الزامی است"),
  currency_supply: z.string().min(1, "تامین ارز الزامی است"),
  bank_name: z.string().min(1, "نام بانک الزامی است"),
  bank_branch: z.string().min(1, "شعبه بانک الزامی است"),
  payment_instrument: z.string().min(1, "ابزار پرداخت الزامی است"),
  expire_date: z.string().min(1, "تاریخ انقضا الزامی است"),
  terms_of_delivery: z.string().min(1, "شرایط تحویل الزامی است"),
  partial_shipment: z.boolean().default(false),
  means_of_transport: z.array(z.string()).min(1, "روش حمل الزامی است"),
  country_of_origin: z.array(z.string()).min(1, "کشور مبدا الزامی است"),
  goods: z.array(goodSchema).min(1, "حداقل یک کالا اضافه کنید"),
});

export type RegisteredOrderFormInput = z.input<typeof orderSchema>;
type RegisteredOrderForm = z.output<typeof orderSchema>;

function fmt(n: number) {
  const x = Number.isFinite(n) ? n : 0;
  return x.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
}

function calcUnitPrice(quantity: unknown, lineSubtotal: unknown) {
  const qty = Number(quantity ?? 0);
  const subtotal = Number(lineSubtotal ?? 0);
  if (!Number.isFinite(qty) || qty <= 0) return 0;
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  return subtotal / qty;
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

function truncateText(s: string, max = 30) {
  const t = (s ?? "").trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max) + "..." : t;
}

function joinMultiValue(values: string[]) {
  return values
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");
}

function formatGregorianAsJalali(date: Date) {
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}/${month}/${day}`;
}

function parseGregorianDateValue(value: string) {
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(value || "");
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

function normalizeExpireDateValue(value: string) {
  const raw = (value || "").trim();
  if (!raw) return "";
  const year = Number(raw.slice(0, 4));
  if (Number.isFinite(year) && year >= 1700) {
    const gregorianDate = parseGregorianDateValue(raw);
    return gregorianDate ? formatGregorianAsJalali(gregorianDate) : raw;
  }
  return raw;
}

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
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
    throw new Error(data?.detail || "خطا در دریافت HS Code ها");
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

function Field(props: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{props.label}</Label>
      {props.children}
      {props.error ? (
        <p className="text-sm text-destructive">{props.error}</p>
      ) : null}
    </div>
  );
}

function DatePickerField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const normalizedValue = React.useMemo(
    () => normalizeExpireDateValue(props.value),
    [props.value],
  );

  return (
    <div className="space-y-2">
      <Label className="text-sm">{props.label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between text-right font-normal",
              !props.value && "text-muted-foreground",
            )}
          >
            <span>{normalizedValue || "انتخاب تاریخ"}</span>
            <CalendarIcon className="ms-2 h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <JalaliCalendar
            value={normalizedValue || undefined}
            calendar={persian}
            locale={persian_fa}
            format="YYYY/MM/DD"
            onChange={(value) => {
              if (!value) return;
              props.onChange(
                value instanceof DateObject
                  ? value.format("YYYY/MM/DD")
                  : String(value),
              );
              setOpen(false);
            }}
            className="shadow-none"
          />
        </PopoverContent>
      </Popover>
      {props.error ? (
        <p className="text-sm text-destructive">{props.error}</p>
      ) : null}
    </div>
  );
}

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
    return props.items.filter((it) =>
      normalizeFa(`${it.label} ${it.value}`).includes(qq),
    );
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

function MultiSelectCombobox<
  T extends { value: string; label: string },
>(props: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  items: readonly T[];
  placeholder?: string;
  error?: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const filtered = React.useMemo(() => {
    const qq = normalizeFa(q);
    if (!qq) return props.items;
    return props.items.filter((it) =>
      normalizeFa(`${it.label} ${it.value}`).includes(qq),
    );
  }, [props.items, q]);
  const selectedItems = React.useMemo(
    () => props.items.filter((item) => props.values.includes(item.value)),
    [props.items, props.values],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm">{props.label}</Label>
        {selectedItems.length ? (
          <button
            type="button"
            className="text-xs text-muted-foreground transition hover:text-foreground"
            onClick={() => props.onChange([])}
          >
            پاک کردن همه
          </button>
        ) : null}
      </div>
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
                selectedItems.length === 0 && "text-muted-foreground",
              )}
            >
              {selectedItems.length
                ? `${selectedItems.length} مورد انتخاب شده`
                : props.placeholder || "انتخاب..."}
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
                const isSelected = props.values.includes(it.value);
                return (
                  <CommandItem
                    key={it.value}
                    value={it.value}
                    onSelect={() => {
                      props.onChange(
                        isSelected
                          ? props.values.filter((value) => value !== it.value)
                          : [...props.values, it.value],
                      );
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
      {selectedItems.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                props.onChange(
                  props.values.filter((value) => value !== item.value),
                )
              }
              className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-3 py-1 text-xs transition hover:bg-muted"
            >
              <span>{item.label}</span>
              <X className="h-3.5 w-3.5 opacity-70" />
            </button>
          ))}
        </div>
      ) : null}
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

function CountryMultiSelectCombobox(props: {
  label: string;
  values: string[];
  onChange: (codes: string[]) => void;
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
    <MultiSelectCombobox
      label={props.label}
      values={props.values}
      onChange={props.onChange}
      items={items}
      placeholder={props.placeholder || "انتخاب کشور..."}
      error={props.error}
      searchPlaceholder="جستجو: نام فارسی / انگلیسی / کد..."
    />
  );
}

function HSCodeCombobox(props: {
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
      <Label className="text-sm">کد HS</Label>
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

async function createOrder(payload: any) {
  if (!API_BASE) throw new Error("متغیر NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(`${API_BASE}/registered-orders/`, {
    method: "POST",
    body: payload,
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || JSON.stringify(data) || "خطا");
  return data;
}

async function updateOrderByUuid(uuid: string, payload: any) {
  if (!API_BASE) throw new Error("متغیر NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(
    `${API_BASE}/registered-orders/${encodeURIComponent(uuid)}/`,
    {
      method: "PATCH",
      body: payload,
    },
  );
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || JSON.stringify(data) || "خطا");
  return data;
}

function buildOrderFormData(values: RegisteredOrderForm) {
  const formData = new FormData();
  formData.append("order_number", values.id);
  formData.append("freight_price", String(values.freight_price ?? 0));
  formData.append("currency_type", values.currency_type);
  formData.append("fee_type", values.fee_type);
  formData.append("fee_amount", String(values.fee_amount ?? 0));
  formData.append("applicant_name", values.applicant_name);
  formData.append("national_code", values.national_code || "");
  formData.append("entry_border", joinMultiValue(values.entry_border));
  formData.append("customs", joinMultiValue(values.customs));
  formData.append("currency_supply", values.currency_supply);
  formData.append("bank_name", values.bank_name);
  formData.append("bank_branch", values.bank_branch);
  formData.append("payment_instrument", values.payment_instrument);
  formData.append("expire_date", normalizeExpireDateValue(values.expire_date));
  formData.append("terms_of_delivery", values.terms_of_delivery);
  formData.append(
    "partial_shipment",
    values.partial_shipment ? "true" : "false",
  );
  formData.append(
    "means_of_transport",
    joinMultiValue(values.means_of_transport),
  );
  formData.append(
    "country_of_origin",
    joinMultiValue(values.country_of_origin),
  );
  formData.append(
    "goods",
    JSON.stringify(
      values.goods.map((g) => ({
        description: g.description,
        hs_code_id: Number(g.hs_code_id),
        goods_status: g.goods_status,
        quantity: String(g.quantity ?? 0),
        origin: joinMultiValue(g.origin),
        unit_price: String(calcUnitPrice(g.quantity, g.line_subtotal)),
        unit: g.unit,
        nw_kg: String(g.nw_kg ?? 0),
        gw_kg: String(g.gw_kg ?? 0),
      })),
    ),
  );
  const file =
    values.order_pdf instanceof FileList
      ? values.order_pdf.item(0)
      : values.order_pdf;
  if (file instanceof File) {
    formData.append("order_pdf", file);
  }
  return formData;
}

export function RegisteredOrderForm(props: {
  mode: "create" | "edit";
  initialValues: RegisteredOrderFormInput;
  onDone?: (idOrUuid: string) => void;
}) {
  const hsSelectedCacheRef = React.useRef<Map<number, HSCodeOption>>(new Map());
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const form = useForm<RegisteredOrderFormInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: props.initialValues,
    mode: "onChange",
  });

  React.useEffect(() => {
    props.initialValues.goods?.forEach((g: any) => {
      const id = Number(g?.hs_code_id ?? 0);
      const code = safeTrim(g?.hs_code);
      if (id > 0 && code) {
        hsSelectedCacheRef.current.set(id, {
          id,
          code,
          goods_name_fa: null,
          goods_name_en: null,
        });
      }
    });
    form.reset(props.initialValues);
  }, [props.initialValues]); // eslint-disable-line react-hooks/exhaustive-deps

  const { control, register, handleSubmit, formState, setValue } = form;
  const { errors } = formState;
  const goodsFA = useFieldArray({ control, name: "goods" });
  const goods = useWatch({ control, name: "goods" }) || [];
  const freight = useWatch({ control, name: "freight_price" }) ?? 0;
  const selectedBank = useWatch({ control, name: "bank_name" }) || "";
  const branchOptions = React.useMemo(
    () => getBranchOptions(String(selectedBank || "")),
    [selectedBank],
  );

  const goodsTotal = React.useMemo(
    () =>
      (goods || []).reduce((sum, g) => {
        const lineSubtotal = Number(g?.line_subtotal ?? 0);
        return sum + (Number.isFinite(lineSubtotal) ? lineSubtotal : 0);
      }, 0),
    [goods],
  );

  const subTotal = React.useMemo(
    () => goodsTotal + Number(freight ?? 0),
    [goodsTotal, freight],
  );
  const uuidForEdit = String(form.getValues("uuid") || "");

  const onSubmit: SubmitHandler<RegisteredOrderFormInput> = async (raw) => {
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const values: RegisteredOrderForm = orderSchema.parse(raw);
      const file =
        values.order_pdf instanceof FileList
          ? values.order_pdf.item(0)
          : values.order_pdf;

      if (props.mode === "create" && !(file instanceof File)) {
        throw new Error("فایل PDF سفارش الزامی است.");
      }

      if (file instanceof File && !file.name.toLowerCase().endsWith(".pdf")) {
        throw new Error("فقط فایل PDF قابل آپلود است.");
      }

      const payload = buildOrderFormData(values);

      const res =
        props.mode === "create"
          ? await createOrder(payload)
          : await updateOrderByUuid(uuidForEdit, payload);

      const outUuid = String(res?.uuid ?? uuidForEdit ?? "");
      const outId = String(res?.order_number ?? values.id ?? "");
      setSuccess(
        props.mode === "create" ? `ایجاد شد: ${outId}` : `ویرایش شد: ${outId}`,
      );
      props.onDone?.(outUuid || outId);
    } catch (e: any) {
      setError(e?.message || "خطا");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {(error || success) && (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertTitle>{error ? "خطا" : "موفق"}</AlertTitle>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      {props.mode === "edit" && !uuidForEdit ? (
        <Alert variant="destructive">
          <AlertTitle>خطا</AlertTitle>
          <AlertDescription>UUID برای ویرایش موجود نیست.</AlertDescription>
        </Alert>
      ) : null}

      <Card className="overflow-hidden shadow-sm before:h-1 before:bg-sky-600 before:content-['']">
        <CardHeader>
          <CardTitle className="text-base">
            {props.mode === "create" ? "ایجاد ثبت سفارش" : "ویرایش ثبت سفارش"}
          </CardTitle>
          <CardDescription>اطلاعات اصلی</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {props.mode === "edit" ? (
              <Field label="شماره سفارش (Order Number)">
                <Input
                  value={String(form.getValues("order_number") || "-")}
                  readOnly
                  disabled
                />
              </Field>
            ) : null}

            <Field label="شماره ثبت سفارش" error={errors.id?.message}>
              <Input
                placeholder="12345678"
                {...register("id")}
                disabled={props.mode === "edit"}
              />
            </Field>

            <Field label="فایل PDF سفارش">
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="application/pdf,.pdf"
                  {...register("order_pdf")}
                />
                {props.mode === "edit" && form.getValues("order_pdf_url") ? (
                  <a
                    href={String(form.getValues("order_pdf_url"))}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline underline-offset-4"
                  >
                    مشاهده فایل فعلی
                  </a>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {props.mode === "create"
                    ? "آپلود فایل PDF الزامی است."
                    : "برای نگه‌داشتن فایل فعلی، این فیلد را خالی بگذارید."}
                </p>
              </div>
            </Field>

            <Field label="کرایه حمل" error={errors.freight_price?.message}>
              <Input type="number" step="0.01" {...register("freight_price")} />
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
              name="fee_type"
              render={({ field }) => (
                <SearchableCombobox
                  label="نوع فی"
                  value={field.value}
                  onChange={field.onChange}
                  items={feeTypeOptions}
                  placeholder="انتخاب نوع فی"
                  searchPlaceholder="جستجو..."
                  error={errors.fee_type?.message}
                />
              )}
            />

            <Field
              label="مبلغ(تومان) فی برای هر واحد ارز ثبت سفارش"
              error={errors.fee_amount?.message}
            >
              <Input type="number" step="0.01" {...register("fee_amount")} />
            </Field>

            <Field label="نام متقاضی" error={errors.applicant_name?.message}>
              <Input {...register("applicant_name")} />
            </Field>

            <Field label="کد/شناسه ملی" error={errors.national_code?.message}>
              <Input {...register("national_code")} />
            </Field>

            <Controller
              control={control}
              name="entry_border"
              render={({ field }) => (
                <MultiSelectCombobox
                  label="مرز ورودی"
                  values={field.value}
                  onChange={field.onChange}
                  items={borderOptions}
                  placeholder="انتخاب مرز ورودی"
                  searchPlaceholder="جستجو در مرزها..."
                  error={errors.entry_border?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="customs"
              render={({ field }) => (
                <MultiSelectCombobox
                  label="گمرک"
                  values={field.value}
                  onChange={field.onChange}
                  items={customsOptions}
                  placeholder="انتخاب گمرک"
                  searchPlaceholder="جستجو در گمرک‌ها..."
                  error={errors.customs?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="currency_supply"
              render={({ field }) => (
                <SearchableCombobox
                  label="تامین ارز"
                  value={field.value}
                  onChange={field.onChange}
                  items={currencySupplyOptions}
                  placeholder="انتخاب تامین ارز"
                  searchPlaceholder="جستجو..."
                  error={errors.currency_supply?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="bank_name"
              render={({ field }) => (
                <SearchableCombobox
                  label="نام بانک"
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    setValue("bank_branch", "", { shouldValidate: true });
                  }}
                  items={bankOptions}
                  placeholder="انتخاب بانک"
                  searchPlaceholder="جستجو در بانک‌ها..."
                  error={errors.bank_name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="bank_branch"
              render={({ field }) => (
                <SearchableCombobox
                  label="شعبه بانک"
                  value={field.value}
                  onChange={field.onChange}
                  items={branchOptions}
                  placeholder={
                    selectedBank
                      ? "انتخاب شعبه بانک"
                      : "ابتدا بانک را انتخاب کنید"
                  }
                  searchPlaceholder="جستجو در شعب..."
                  error={errors.bank_branch?.message}
                />
              )}
            />

            <Field
              label="ابزار پرداخت"
              error={errors.payment_instrument?.message}
            >
              <Input {...register("payment_instrument")} />
            </Field>

            <Controller
              control={control}
              name="country_of_origin"
              render={({ field }) => (
                <CountryMultiSelectCombobox
                  label="کشور مبدا"
                  values={field.value}
                  onChange={field.onChange}
                  error={errors.country_of_origin?.message}
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
                />
              )}
            />

            <Controller
              control={control}
              name="terms_of_delivery"
              render={({ field }) => (
                <SearchableCombobox
                  label="شرایط تحویل"
                  value={field.value}
                  onChange={field.onChange}
                  items={deliveryTerms}
                  placeholder="انتخاب..."
                  searchPlaceholder="جستجو..."
                  error={(errors as any)?.terms_of_delivery?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="means_of_transport"
              render={({ field }) => (
                <MultiSelectCombobox
                  label="روش حمل"
                  values={field.value}
                  onChange={field.onChange}
                  items={transportMeans}
                  placeholder="انتخاب..."
                  searchPlaceholder="جستجو..."
                  error={(errors as any)?.means_of_transport?.message}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden shadow-sm before:h-1 before:bg-emerald-600 before:content-['']">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">کالاها</CardTitle>
            <CardDescription>لیست کالاهای این ثبت سفارش</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              goodsFA.append({
                description: "",
                hs_code_id: 0,
                goods_status: "نو",
                quantity: 1,
                origin: ["CN"],
                unit_price: 0,
                line_subtotal: 0,
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
          {goodsFA.fields.map((f, idx) => {
            const rowErr: any = (errors as any)?.goods?.[idx];
            const row = goods?.[idx];
            const calculatedUnitPrice = calcUnitPrice(
              row?.quantity,
              row?.line_subtotal,
            );
            return (
              <div key={f.id} className="space-y-4 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">کالا #{idx + 1}</div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goodsFA.remove(idx)}
                    disabled={goodsFA.fields.length <= 1}
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
                        value={Number(field.value || 0)}
                        onChange={(id) => field.onChange(id)}
                        selectedCache={hsSelectedCacheRef.current}
                        error={rowErr?.hs_code_id?.message}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name={`goods.${idx}.goods_status` as const}
                    render={({ field }) => (
                      <SearchableCombobox
                        label="وضعیت کالا"
                        value={field.value || ""}
                        onChange={field.onChange}
                        items={goodsStatusOptions}
                        placeholder="انتخاب وضعیت کالا"
                        searchPlaceholder="جستجو..."
                        error={rowErr?.goods_status?.message}
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
                        searchPlaceholder="جستجو..."
                        error={rowErr?.unit?.message}
                      />
                    )}
                  />

                  <Field
                    label="ارزش کالا"
                    error={rowErr?.line_subtotal?.message}
                  >
                    <Input
                      type="number"
                      step="0.0001"
                      {...register(`goods.${idx}.line_subtotal` as const)}
                    />
                  </Field>

                  <Field label="قیمت واحد (محاسبه‌ای)">
                    <Input
                      type="number"
                      step="0.0001"
                      value={
                        Number.isFinite(calculatedUnitPrice)
                          ? calculatedUnitPrice
                          : 0
                      }
                      readOnly
                      disabled
                    />
                  </Field>

                  <Controller
                    control={control}
                    name={`goods.${idx}.origin` as const}
                    render={({ field }) => (
                      <CountryMultiSelectCombobox
                        label="مبدا"
                        values={field.value || []}
                        onChange={field.onChange}
                        error={rowErr?.origin?.message}
                      />
                    )}
                  />

                  <Field label="وزن خالص (kg)" error={rowErr?.nw_kg?.message}>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`goods.${idx}.nw_kg` as const)}
                    />
                  </Field>

                  <Field label="وزن ناخالص (kg)" error={rowErr?.gw_kg?.message}>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`goods.${idx}.gw_kg` as const)}
                    />
                  </Field>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="overflow-hidden shadow-sm before:h-1 before:bg-slate-900 before:content-['']">
        <CardHeader>
          <CardTitle className="text-base">خلاصه</CardTitle>
          <CardDescription>جمع‌های سمت کلاینت</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">جمع کالاها</span>
            <span>{fmt(goodsTotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">کرایه حمل</span>
            <span>{fmt(Number(freight || 0))}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">جمع کل</span>
            <span className="font-semibold">{fmt(subTotal)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="submit"
          disabled={submitting || (props.mode === "edit" && !uuidForEdit)}
        >
          {submitting
            ? "در حال ذخیره..."
            : props.mode === "create"
              ? "ایجاد"
              : "ذخیره تغییرات"}
        </Button>
      </div>
    </form>
  );
}
