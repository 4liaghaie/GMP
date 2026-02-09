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
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { authFetch } from "@/lib/auth-api";
import { countries } from "@/lib/countryList";

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

const goodSchema = z.object({
  description: z.string().min(1, "شرح کالا الزامی است"),
  hs_code_id: z.coerce.number().int().positive("کد HS الزامی است"),
  quantity: z.coerce.number().positive("مقدار باید بیشتر از ۰ باشد"),
  origin: z.string().min(1, "مبدا الزامی است"),
  unit_price: z.coerce.number().nonnegative("قیمت واحد باید >= ۰ باشد"),
  unit: z.string().min(1, "واحد الزامی است"),
  nw_kg: z.coerce.number().nonnegative("وزن خالص باید >= ۰ باشد"),
  gw_kg: z.coerce.number().nonnegative("وزن ناخالص باید >= ۰ باشد"),
});

const orderSchema = z.object({
  uuid: z.string().optional(),

  // ✅ server order number shown in edit page
  order_number: z.string().optional(),

  // legacy human id you were using in UI
  id: z.string().min(1, "شناسه ثبت سفارش الزامی است"),

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

export type RegisteredOrderFormInput = z.input<typeof orderSchema>;
type RegisteredOrderForm = z.output<typeof orderSchema>;

function fmt(n: number) {
  const x = Number.isFinite(n) ? n : 0;
  return x.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
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
    const msg =
      data?.detail ||
      (typeof data === "object"
        ? JSON.stringify(data)
        : "خطا در دریافت HS Code ها");
    throw new Error(msg);
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

// -------------------------
// API calls
// -------------------------
async function createOrder(payload: any) {
  if (!API_BASE) throw new Error("متغیر NEXT_PUBLIC_API_BASE تنظیم نشده است");

  const res = await authFetch(`${API_BASE}/registered-orders/`, {
    method: "POST",
    body: JSON.stringify(payload),
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
      body: JSON.stringify(payload),
    },
  );

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || JSON.stringify(data) || "خطا");
  return data;
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
    form.reset(props.initialValues);
  }, [props.initialValues]); // eslint-disable-line react-hooks/exhaustive-deps

  const { control, register, handleSubmit, formState } = form;
  const { errors } = formState;

  const goodsFA = useFieldArray({ control, name: "goods" });

  const goods = useWatch({ control, name: "goods" }) || [];
  const freight = useWatch({ control, name: "freight_price" }) ?? 0;

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

  const uuidForEdit = String(form.getValues("uuid") || "");

  const onSubmit: SubmitHandler<RegisteredOrderFormInput> = async (raw) => {
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const values: RegisteredOrderForm = orderSchema.parse(raw);

      // ✅ do not send order_number (server-generated)
      const payload = {
        id: values.id,
        freight_price: String(values.freight_price ?? 0),
        currency_type: values.currency_type,
        seller_country: values.seller_country,
        date: values.date,
        expire_date: values.expire_date,
        terms_of_delivery: values.terms_of_delivery,
        terms_of_payment: values.terms_of_payment,
        partial_shipment: values.partial_shipment ?? false,
        means_of_transport: values.means_of_transport,
        country_of_origin: values.country_of_origin,
        standard: values.standard,
        goods: values.goods.map((g) => ({
          description: g.description,
          hs_code_id: Number(g.hs_code_id),
          quantity: String(g.quantity ?? 0),
          origin: g.origin,
          unit_price: String(g.unit_price ?? 0),
          unit: g.unit,
          nw_kg: String(g.nw_kg ?? 0),
          gw_kg: String(g.gw_kg ?? 0),
        })),
      };

      const res =
        props.mode === "create"
          ? await createOrder(payload)
          : await updateOrderByUuid(uuidForEdit, payload);

      const outUuid = String(res?.uuid ?? uuidForEdit ?? "");
      const outId = String(res?.id ?? values.id ?? "");

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

      <Card className="shadow-sm">
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

            <Field label="شناسه ثبت سفارش" error={errors.id?.message}>
              <Input
                placeholder="RO-2026-0001"
                {...register("id")}
                disabled={props.mode === "edit"} // usually keep stable
              />
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
              name="seller_country"
              render={({ field }) => (
                <CountryCombobox
                  label="کشور فروشنده"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.seller_country?.message}
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
                />
              )}
            />

            <Field label="تاریخ (YYYY/MM/DD)" error={errors.date?.message}>
              <Input placeholder="2026/02/01" {...register("date")} />
            </Field>

            <Field
              label="تاریخ انقضا (YYYY/MM/DD)"
              error={errors.expire_date?.message}
            >
              <Input placeholder="2028/01/01" {...register("expire_date")} />
            </Field>

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
              name="terms_of_payment"
              render={({ field }) => (
                <SearchableCombobox
                  label="شرایط پرداخت"
                  value={field.value}
                  onChange={field.onChange}
                  items={paymentTerms}
                  placeholder="انتخاب..."
                  searchPlaceholder="جستجو..."
                  error={(errors as any)?.terms_of_payment?.message}
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
                  placeholder="انتخاب..."
                  searchPlaceholder="جستجو..."
                  error={(errors as any)?.means_of_transport?.message}
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
                  placeholder="انتخاب..."
                  searchPlaceholder="جستجو..."
                  error={(errors as any)?.standard?.message}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
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
          {goodsFA.fields.map((f, idx) => {
            const rowErr: any = (errors as any)?.goods?.[idx];

            return (
              <div key={f.id} className="rounded-xl border p-4 space-y-4">
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

      <Card className="shadow-sm">
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
