"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { Controller, useFieldArray, useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { authFetch } from "@/lib/auth-api";
import { borders } from "@/lib/borderList";
import { countries } from "@/lib/countryList";
import { iranCustoms } from "@/lib/customsList";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const NEED_STATUS_AT_ORIGIN = "در کشور مبدا";
const ALL_CUSTOMS_VALUE = "ALL_CUSTOMS";
const ALL_BORDERS_VALUE = "ALL_BORDERS";
const ALL_TRANSPORTS_VALUE = "ALL_TRANSPORTS";

type HSCodeOption = {
  id: number;
  code: string;
  goods_name_fa?: string | null;
  goods_name_en?: string | null;
};

const currencyOptions = [
  { value: "USD", label: "دلار (USD)" },
  { value: "EUR", label: "یورو (EUR)" },
  { value: "AED", label: "درهم (AED)" },
  { value: "CNY", label: "یوان چین (CNY)" },
  { value: "TRY", label: "لیر ترکیه (TRY)" },
];

const goodsStatusOptions = [
  { value: "نو", label: "نو" },
  { value: "مستعمل", label: "مستعمل" },
  { value: "بازسازی شده", label: "بازسازی شده" },
];

const proformaStatusOptions = [
  { value: NEED_STATUS_AT_ORIGIN, label: NEED_STATUS_AT_ORIGIN },
  { value: "قبض انبار دارد", label: "قبض انبار دارد" },
  { value: "بارنامه شده", label: "بارنامه شده" },
];

const unitOptions = [
  { value: "KG", label: "کیلوگرم (KG)" },
  { value: "PCS", label: "عدد (PCS)" },
  { value: "TON", label: "تن (TON)" },
  { value: "L", label: "لیتر (L)" },
  { value: "M", label: "متر (M)" },
];

const transportMeans = [
  { value: ALL_TRANSPORTS_VALUE, label: "همه روش های حمل" },
  { value: "SEA", label: "دریایی" },
  { value: "AIR", label: "هوایی" },
  { value: "ROAD", label: "زمینی" },
  { value: "RAIL", label: "ریلی" },
];

const feeTypeOptions = [
  { value: "فی دریافتی", label: "فی دریافتی" },
  { value: "فی پرداختی", label: "فی پرداختی" },
];

const borderOptions = borders.map((border) => ({ value: border, label: border }));
const allBordersOption = { value: ALL_BORDERS_VALUE, label: "همه مرز ها" };
const customsOptions = iranCustoms.map((customs) => ({
  value: String(customs.ctmVCodeInt),
  label: `${customs.ctmNameStr} (${customs.ctmVCodeInt})`,
}));
const allCustomsOption = { value: ALL_CUSTOMS_VALUE, label: "تمام گمرکات" };
const countryOptions = countries.map((country) => ({
  value: country.code,
  label: `${country.persianName} (${country.code})`,
}));

const goodSchema = z.object({
  uuid: z.string().optional(),
  hs_code: z.string().optional(),
  description: z.string().min(1, "شرح کالا الزامی است"),
  hs_code_id: z.coerce.number().int().positive("کد HS الزامی است"),
  goods_status: z.string().min(1, "وضعیت کالا الزامی است"),
  quantity: z.coerce.number().positive("مقدار باید بیشتر از صفر باشد"),
  unit: z.string().min(1, "واحد الزامی است"),
  manufacturer_country: z.array(z.string()).min(1, "کشور سازنده الزامی است"),
  line_subtotal: z.coerce.number().nonnegative("ارزش کل باید صفر یا بیشتر باشد"),
  nw_kg: z.coerce.number().nonnegative("وزن خالص باید صفر یا بیشتر باشد"),
  gw_kg: z.coerce.number().nonnegative("وزن ناخالص باید صفر یا بیشتر باشد"),
});

const schema = z
  .object({
    uuid: z.string().optional(),
    proforma_file: z.any().optional(),
    proforma_file_url: z.string().optional(),
    status: z.string().min(1, "وضعیت بار الزامی است"),
    country_of_origin: z.string().min(1, "کشور مبدا الزامی است"),
    freight_price: z.coerce.number().nonnegative("کرایه حمل باید صفر یا بیشتر باشد"),
    currency_type: z.string().min(1, "نوع ارز الزامی است"),
    fee_type: z.string().min(1, "نوع فی الزامی است"),
    fee_amount: z.coerce.number().nonnegative("مبلغ فی باید صفر یا بیشتر باشد"),
    entry_border: z.array(z.string()).optional().default([]),
    customs: z.array(z.string()).min(1, "گمرک الزامی است"),
    means_of_transport: z.array(z.string()).min(1, "روش حمل الزامی است"),
    goods: z.array(goodSchema).min(1, "حداقل یک کالا الزامی است"),
  })
  .superRefine((value, ctx) => {
    if (value.customs.includes(ALL_CUSTOMS_VALUE) && value.status !== NEED_STATUS_AT_ORIGIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customs"],
        message: "تمام گمرکات فقط برای وضعیت در کشور مبدا قابل انتخاب است",
      });
    }
    if (value.entry_border.includes(ALL_BORDERS_VALUE) && value.status !== NEED_STATUS_AT_ORIGIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entry_border"],
        message: "همه مرز ها فقط برای وضعیت در کشور مبدا قابل انتخاب است",
      });
    }
    if (value.means_of_transport.includes(ALL_TRANSPORTS_VALUE) && value.means_of_transport.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["means_of_transport"],
        message: "همه روش های حمل باید به صورت تنهایی انتخاب شود",
      });
    }
  });

export type GoodsNeedFormInput = z.input<typeof schema>;
type GoodsNeedFormValue = z.output<typeof schema>;
type GoodDraft = z.input<typeof goodSchema>;

function fmt(n: unknown) {
  const x = Number(n ?? 0);
  return Number.isFinite(x)
    ? x.toLocaleString("fa-IR", { maximumFractionDigits: 2 })
    : "۰";
}

function calcUnitPrice(quantity: unknown, subtotal: unknown) {
  const qty = Number(quantity || 0);
  const total = Number(subtotal || 0);
  if (!Number.isFinite(qty) || qty <= 0) return 0;
  if (!Number.isFinite(total) || total < 0) return 0;
  return total / qty;
}

function joinMultiValue(values: string[]) {
  return values.map((item) => item.trim()).filter(Boolean).join(", ");
}

function parseMultiValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function selectedFile(value: unknown): File | null {
  if (value instanceof FileList) return value.item(0);
  return value instanceof File ? value : null;
}

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

async function searchHSCodes(query: string, signal?: AbortSignal) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const url = new URL(`${API_BASE}/hs-codes/`);
  const q = query.trim();
  if (q) url.searchParams.set("search", q);
  const res = await authFetch(url.toString(), {
    method: "GET",
    cache: "no-store",
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "خطا در دریافت کدهای HS");
  const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  return rows.map((item: any) => ({
    id: Number(item.id),
    code: String(item.code ?? ""),
    goods_name_fa: item.goods_name_fa ?? null,
    goods_name_en: item.goods_name_en ?? null,
  })) as HSCodeOption[];
}

function buildPayload(values: GoodsNeedFormValue) {
  const formData = new FormData();
  formData.append("status", values.status);
  formData.append("country_of_origin", values.country_of_origin);
  formData.append("freight_price", String(values.freight_price ?? 0));
  formData.append("currency_type", values.currency_type);
  formData.append("fee_type", values.fee_type);
  formData.append("fee_amount", String(values.fee_amount ?? 0));
  formData.append("entry_border", joinMultiValue(values.entry_border || []));
  formData.append("customs", joinMultiValue(values.customs));
  formData.append("means_of_transport", joinMultiValue(values.means_of_transport));
  formData.append(
    "goods",
    JSON.stringify(
      values.goods.map((good) => ({
        description: good.description,
        hs_code_id: Number(good.hs_code_id),
        goods_status: good.goods_status,
        quantity: String(good.quantity ?? 0),
        unit: good.unit,
        manufacturer_country: joinMultiValue(good.manufacturer_country),
        price: String(calcUnitPrice(good.quantity, good.line_subtotal)),
        nw_kg: String(good.nw_kg ?? 0),
        gw_kg: String(good.gw_kg ?? 0),
      })),
    ),
  );
  const file = selectedFile(values.proforma_file);
  if (file) formData.append("proforma_file", file);
  return formData;
}

async function createGoodsNeed(payload: FormData) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(`${API_BASE}/goods-needs/`, {
    method: "POST",
    body: payload,
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || JSON.stringify(data) || "خطا در ایجاد بار");
  return data;
}

async function updateGoodsNeed(uuid: string, payload: FormData) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(`${API_BASE}/goods-needs/${encodeURIComponent(uuid)}/`, {
    method: "PATCH",
    body: payload,
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || JSON.stringify(data) || "خطا در ویرایش بار");
  return data;
}

function Field(props: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{props.label}</Label>
      {props.children}
      {props.error ? <p className="text-sm text-destructive">{props.error}</p> : null}
    </div>
  );
}

function SearchableCombobox(props: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  items: Array<{ value: string; label: string }>;
  placeholder?: string;
  error?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = props.items.find((item) => item.value === props.value);
  return (
    <div className="space-y-2">
      {props.label ? <Label>{props.label}</Label> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("h-11 w-full justify-between text-right font-normal", !selected && "text-muted-foreground")}
          >
            <span className="truncate">{selected?.label || props.placeholder || "انتخاب..."}</span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="جستجو..." />
            <CommandEmpty>نتیجه‌ای پیدا نشد.</CommandEmpty>
            <CommandGroup className="max-h-72 overflow-auto">
              {props.items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={`${item.label} ${item.value}`}
                  onSelect={() => {
                    props.onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("ml-2 h-4 w-4", item.value === props.value ? "opacity-100" : "opacity-0")} />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {props.error ? <p className="text-sm text-destructive">{props.error}</p> : null}
    </div>
  );
}

function MultiSelectCombobox(props: {
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
  items: Array<{ value: string; label: string }>;
  exclusiveValues?: string[];
  placeholder?: string;
  error?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const values = props.values || [];
  const exclusive = new Set(props.exclusiveValues || []);
  const labels = values.map((value) => props.items.find((item) => item.value === value)?.label || value);

  function toggle(value: string) {
    if (exclusive.has(value)) {
      props.onChange(values.includes(value) ? [] : [value]);
      return;
    }
    const withoutExclusive = values.filter((item) => !exclusive.has(item));
    props.onChange(
      withoutExclusive.includes(value)
        ? withoutExclusive.filter((item) => item !== value)
        : [...withoutExclusive, value],
    );
  }

  return (
    <div className="space-y-2">
      {props.label ? <Label>{props.label}</Label> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("min-h-11 w-full justify-between text-right font-normal", !values.length && "text-muted-foreground")}
          >
            <span className="truncate">{labels.length ? labels.join("، ") : props.placeholder || "انتخاب..."}</span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="جستجو..." />
            <CommandEmpty>نتیجه‌ای پیدا نشد.</CommandEmpty>
            <CommandGroup className="max-h-72 overflow-auto">
              {props.items.map((item) => (
                <CommandItem key={item.value} value={`${item.label} ${item.value}`} onSelect={() => toggle(item.value)}>
                  <Check className={cn("ml-2 h-4 w-4", values.includes(item.value) ? "opacity-100" : "opacity-0")} />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {values.length ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <button
              key={value}
              type="button"
              className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-1 text-xs"
              onClick={() => props.onChange(values.filter((item) => item !== value))}
            >
              {props.items.find((item) => item.value === value)?.label || value}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      ) : null}
      {props.error ? <p className="text-sm text-destructive">{props.error}</p> : null}
    </div>
  );
}

function HSCodePicker(props: {
  value?: number;
  selectedCode?: string;
  onChange: (id: number, option?: HSCodeOption) => void;
  error?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const debounced = useDebouncedValue(query);
  const [items, setItems] = React.useState<HSCodeOption[]>([]);
  const [selected, setSelected] = React.useState<HSCodeOption | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();
    searchHSCodes(debounced, ac.signal)
      .then(setItems)
      .catch(() => setItems([]));
    return () => ac.abort();
  }, [debounced]);

  const label = selected
    ? `${selected.code} - ${selected.goods_name_fa || selected.goods_name_en || ""}`
    : props.selectedCode || "";

  return (
    <div className="space-y-2">
      <Label>HS Code</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("h-11 w-full justify-between text-right font-normal", !props.value && "text-muted-foreground")}
          >
            <span className="truncate">{props.value ? label || String(props.value) : "انتخاب HS Code"}</span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput value={query} onValueChange={setQuery} placeholder="کد یا نام کالا..." />
            <CommandEmpty>نتیجه‌ای پیدا نشد.</CommandEmpty>
            <CommandGroup className="max-h-72 overflow-auto">
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.code} ${item.goods_name_fa || ""} ${item.goods_name_en || ""}`}
                  onSelect={() => {
                    setSelected(item);
                    props.onChange(item.id, item);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("ml-2 h-4 w-4", item.id === props.value ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{item.code} - {item.goods_name_fa || item.goods_name_en || "بدون نام"}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {props.error ? <p className="text-sm text-destructive">{props.error}</p> : null}
    </div>
  );
}

function emptyGood(): GoodDraft {
  return {
    description: "",
    hs_code: "",
    hs_code_id: 0,
    goods_status: "نو",
    quantity: 1,
    unit: "KG",
    manufacturer_country: [],
    line_subtotal: 0,
    nw_kg: 0,
    gw_kg: 0,
  };
}

export function GoodsNeedForm(props: {
  mode?: "create" | "edit";
  initialValues: GoodsNeedFormInput;
  onDone?: (uuid: string) => void;
}) {
  const [step, setStep] = React.useState(0);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [goodDialogOpen, setGoodDialogOpen] = React.useState(false);
  const [editingGoodIndex, setEditingGoodIndex] = React.useState<number | null>(null);
  const [goodDraft, setGoodDraft] = React.useState<GoodDraft>(emptyGood());
  const [goodErrors, setGoodErrors] = React.useState<Record<string, string>>({});

  const form = useForm<GoodsNeedFormInput>({
    resolver: zodResolver(schema),
    defaultValues: props.initialValues,
    mode: "onChange",
  });
  const { control, register, handleSubmit, setValue, trigger, watch, formState } = form;
  const { errors } = formState;
  const goodsFA = useFieldArray({ control, name: "goods" });
  const goods = useWatch({ control, name: "goods" }) || [];
  const mode = props.mode || "create";
  const selectedStatus = String(watch("status") || "");
  const selectedCustoms = watch("customs") || [];
  const selectedEntryBorder = watch("entry_border") || [];
  const isAtOrigin = selectedStatus === NEED_STATUS_AT_ORIGIN;
  const availableBorderOptions = React.useMemo(
    () => (isAtOrigin ? [allBordersOption, ...borderOptions] : borderOptions),
    [isAtOrigin],
  );
  const availableCustomsOptions = React.useMemo(
    () => (isAtOrigin ? [allCustomsOption, ...customsOptions] : customsOptions),
    [isAtOrigin],
  );

  React.useEffect(() => {
    form.reset(props.initialValues);
  }, [form, props.initialValues]);

  React.useEffect(() => {
    if (!isAtOrigin) {
      if (selectedCustoms.includes(ALL_CUSTOMS_VALUE)) {
        setValue("customs", [], { shouldValidate: true });
      } else if (selectedCustoms.length > 1) {
        setValue("customs", selectedCustoms.slice(0, 1), { shouldValidate: true });
      }
      if (selectedEntryBorder.includes(ALL_BORDERS_VALUE)) {
        setValue("entry_border", [], { shouldValidate: true });
      } else if (selectedEntryBorder.length > 1) {
        setValue("entry_border", selectedEntryBorder.slice(0, 1), { shouldValidate: true });
      }
    }
  }, [isAtOrigin, selectedCustoms, selectedEntryBorder, setValue]);

  const steps = [
    { title: "اطلاعات کلی", description: "فایل، وضعیت، مبدا، گمرک و حمل" },
    { title: "اطلاعات مالی", description: "ارز، فی و کرایه حمل" },
    { title: "کالاها", description: "مدیریت کالاها در جدول" },
  ];

  async function goNext() {
    const fields =
      step === 0
        ? (["status", "country_of_origin", "entry_border", "customs", "means_of_transport"] as const)
        : step === 1
          ? (["freight_price", "currency_type", "fee_type", "fee_amount"] as const)
          : (["goods"] as const);
    const ok = await trigger(fields as any);
    if (ok) setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function openAddGood() {
    setEditingGoodIndex(null);
    setGoodDraft(emptyGood());
    setGoodErrors({});
    setGoodDialogOpen(true);
  }

  function openEditGood(index: number) {
    const current = goods[index] as any;
    setEditingGoodIndex(index);
    setGoodDraft({
      uuid: current?.uuid,
      description: current?.description || "",
      hs_code: current?.hs_code || "",
      hs_code_id: Number(current?.hs_code_id || 0),
      goods_status: current?.goods_status || "نو",
      quantity: Number(current?.quantity || 1),
      unit: current?.unit || "KG",
      manufacturer_country: parseMultiValue(current?.manufacturer_country),
      line_subtotal: Number(current?.line_subtotal || 0),
      nw_kg: Number(current?.nw_kg || 0),
      gw_kg: Number(current?.gw_kg || 0),
    });
    setGoodErrors({});
    setGoodDialogOpen(true);
  }

  function saveGoodDraft() {
    const parsed = goodSchema.safeParse({
      ...goodDraft,
      hs_code_id: Number(goodDraft.hs_code_id || 0),
      quantity: Number(goodDraft.quantity || 0),
      line_subtotal: Number(goodDraft.line_subtotal || 0),
      nw_kg: Number(goodDraft.nw_kg || 0),
      gw_kg: Number(goodDraft.gw_kg || 0),
      manufacturer_country: parseMultiValue(goodDraft.manufacturer_country),
    });
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        nextErrors[String(issue.path[0] || "goods")] = issue.message;
      });
      setGoodErrors(nextErrors);
      return;
    }
    if (editingGoodIndex === null) goodsFA.append(parsed.data);
    else goodsFA.update(editingGoodIndex, parsed.data);
    setGoodDialogOpen(false);
    setGoodDraft(emptyGood());
    setGoodErrors({});
    trigger("goods");
  }

  const onSubmit: SubmitHandler<GoodsNeedFormInput> = async (raw) => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const values = schema.parse(raw);
      const file = selectedFile(values.proforma_file);
      if (mode === "create" && !file) {
        setError("فایل PDF یا JPG پروفرما الزامی است.");
        setStep(0);
        return;
      }
      const payload = buildPayload(values);
      const uuid = String(values.uuid || "");
      const saved = mode === "edit" ? await updateGoodsNeed(uuid, payload) : await createGoodsNeed(payload);
      setSuccess(mode === "edit" ? "بار ویرایش شد." : "بار ایجاد شد.");
      props.onDone?.(String(saved?.uuid ?? uuid));
    } catch (err: any) {
      setError(err?.message || "خطا");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
      <Card className="overflow-hidden border-border/80">
        <CardHeader className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>{mode === "edit" ? "ویرایش پروفرما" : "ایجاد پروفرما"}</CardTitle>
              <CardDescription>فرم در سه مرحله تکمیل می‌شود؛ کالاها در مرحله آخر اضافه می‌شوند.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {steps.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setStep(index)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition",
                    index === step ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
                  )}
                >
                  {index + 1}. {item.title}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium">{steps[step].title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{steps[step].description}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-4 sm:p-6">
          {error || success ? (
            <Alert variant={error ? "destructive" : "default"}>
              <AlertTitle>{error ? "خطا" : "موفق"}</AlertTitle>
              <AlertDescription>{error || success}</AlertDescription>
            </Alert>
          ) : null}

          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="فایل پروفرما (PDF یا JPG)" error={(errors.proforma_file as any)?.message}>
                <Input type="file" accept="application/pdf,image/jpeg,.pdf,.jpg,.jpeg" {...register("proforma_file")} />
                {props.initialValues.proforma_file_url ? (
                  <a href={props.initialValues.proforma_file_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline-offset-4 hover:underline">
                    مشاهده فایل فعلی
                  </a>
                ) : null}
              </Field>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <SearchableCombobox label="وضعیت بار" value={field.value || ""} onChange={field.onChange} items={proformaStatusOptions} placeholder="انتخاب وضعیت" error={errors.status?.message} />
                )}
              />
              <Controller
                control={control}
                name="country_of_origin"
                render={({ field }) => (
                  <SearchableCombobox label="کشور مبدا" value={field.value || ""} onChange={field.onChange} items={countryOptions} placeholder="انتخاب کشور" error={errors.country_of_origin?.message} />
                )}
              />
              <Controller
                control={control}
                name="entry_border"
                render={({ field }) =>
                  isAtOrigin ? (
                    <MultiSelectCombobox label="مرز ورودی" values={field.value || []} onChange={field.onChange} items={availableBorderOptions} exclusiveValues={[ALL_BORDERS_VALUE]} placeholder="اختیاری - انتخاب مرز" error={errors.entry_border?.message} />
                  ) : (
                    <SearchableCombobox label="مرز ورودی" value={field.value?.[0] || ""} onChange={(value) => field.onChange(value ? [value] : [])} items={availableBorderOptions} placeholder="اختیاری - انتخاب مرز" error={errors.entry_border?.message} />
                  )
                }
              />
              <Controller
                control={control}
                name="customs"
                render={({ field }) =>
                  isAtOrigin ? (
                    <MultiSelectCombobox label="گمرک" values={field.value || []} onChange={field.onChange} items={availableCustomsOptions} exclusiveValues={[ALL_CUSTOMS_VALUE]} placeholder="انتخاب گمرک" error={errors.customs?.message} />
                  ) : (
                    <SearchableCombobox label="گمرک" value={field.value?.[0] || ""} onChange={(value) => field.onChange(value ? [value] : [])} items={availableCustomsOptions} placeholder="انتخاب گمرک" error={errors.customs?.message} />
                  )
                }
              />
              <Controller
                control={control}
                name="means_of_transport"
                render={({ field }) => (
                  <MultiSelectCombobox label="روش حمل" values={field.value || []} onChange={field.onChange} items={transportMeans} exclusiveValues={[ALL_TRANSPORTS_VALUE]} placeholder="انتخاب روش حمل" error={errors.means_of_transport?.message} />
                )}
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                control={control}
                name="currency_type"
                render={({ field }) => (
                  <SearchableCombobox label="نوع ارز" value={field.value || ""} onChange={field.onChange} items={currencyOptions} placeholder="انتخاب ارز" error={errors.currency_type?.message} />
                )}
              />
              <Field label="کرایه حمل" error={errors.freight_price?.message}>
                <Input type="number" step="0.01" {...register("freight_price")} />
              </Field>
              <Controller
                control={control}
                name="fee_type"
                render={({ field }) => (
                  <SearchableCombobox label="نوع فی" value={field.value || ""} onChange={field.onChange} items={feeTypeOptions} placeholder="انتخاب نوع فی" error={errors.fee_type?.message} />
                )}
              />
              <Field label="مبلغ فی" error={errors.fee_amount?.message}>
                <Input type="number" step="0.01" {...register("fee_amount")} />
              </Field>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">کالاها</h3>
                  <p className="text-sm text-muted-foreground">کالاها را به جدول اضافه کنید و در صورت نیاز ویرایش کنید.</p>
                </div>
                <Button type="button" onClick={openAddGood} className="gap-2">
                  <Plus className="h-4 w-4" />
                  افزودن کالا
                </Button>
              </div>
              {errors.goods?.message ? <p className="text-sm text-destructive">{errors.goods.message}</p> : null}
              <div className="overflow-hidden rounded-xl border">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[940px] text-sm">
                    <thead className="bg-muted/60">
                      <tr className="text-right">
                        <th className="p-3 font-medium">شرح کالا</th>
                        <th className="p-3 font-medium">HS Code</th>
                        <th className="p-3 font-medium">وضعیت</th>
                        <th className="p-3 font-medium">مقدار</th>
                        <th className="p-3 font-medium">واحد</th>
                        <th className="p-3 font-medium">کشور سازنده</th>
                        <th className="p-3 font-medium">ارزش کل</th>
                        <th className="p-3 font-medium">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goods.length ? (
                        goods.map((good: any, index) => (
                          <tr key={goodsFA.fields[index]?.id || index} className="border-t">
                            <td className="p-3">{good.description || "-"}</td>
                            <td className="p-3">{good.hs_code || good.hs_code_id || "-"}</td>
                            <td className="p-3">{good.goods_status || "-"}</td>
                            <td className="p-3">{fmt(good.quantity)}</td>
                            <td className="p-3">{good.unit || "-"}</td>
                            <td className="p-3">{parseMultiValue(good.manufacturer_country).join("، ") || "-"}</td>
                            <td className="p-3">{fmt(good.line_subtotal)}</td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => openEditGood(index)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="destructive" size="sm" onClick={() => goodsFA.remove(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-muted-foreground">
                            هنوز کالایی اضافه نشده است.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          <Separator />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" disabled={step === 0 || submitting} onClick={() => setStep((s) => s - 1)}>
              مرحله قبل
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" onClick={goNext}>
                مرحله بعد
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? "در حال ذخیره..." : mode === "edit" ? "ذخیره تغییرات" : "ایجاد پروفرما"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={goodDialogOpen} onOpenChange={setGoodDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto text-right sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingGoodIndex === null ? "افزودن کالا" : "ویرایش کالا"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="شرح کالا" error={goodErrors.description}>
              <Input value={goodDraft.description || ""} onChange={(event) => setGoodDraft((draft) => ({ ...draft, description: event.target.value }))} />
            </Field>
            <HSCodePicker
              value={Number(goodDraft.hs_code_id || 0)}
              selectedCode={goodDraft.hs_code}
              onChange={(id, option) =>
                setGoodDraft((draft) => ({
                  ...draft,
                  hs_code_id: id,
                  hs_code: option ? `${option.code} - ${option.goods_name_fa || option.goods_name_en || ""}` : draft.hs_code,
                }))
              }
              error={goodErrors.hs_code_id}
            />
            <SearchableCombobox label="وضعیت کالا" value={String(goodDraft.goods_status || "")} onChange={(value) => setGoodDraft((draft) => ({ ...draft, goods_status: value }))} items={goodsStatusOptions} placeholder="انتخاب وضعیت" error={goodErrors.goods_status} />
            <Field label="مقدار" error={goodErrors.quantity}>
              <Input type="number" step="0.01" value={Number(goodDraft.quantity || 0)} onChange={(event) => setGoodDraft((draft) => ({ ...draft, quantity: Number(event.target.value) }))} />
            </Field>
            <SearchableCombobox label="واحد" value={String(goodDraft.unit || "")} onChange={(value) => setGoodDraft((draft) => ({ ...draft, unit: value }))} items={unitOptions} placeholder="انتخاب واحد" error={goodErrors.unit} />
            <MultiSelectCombobox label="کشور سازنده" values={parseMultiValue(goodDraft.manufacturer_country)} onChange={(value) => setGoodDraft((draft) => ({ ...draft, manufacturer_country: value }))} items={countryOptions} placeholder="انتخاب کشور" error={goodErrors.manufacturer_country} />
            <Field label="ارزش کل ردیف" error={goodErrors.line_subtotal}>
              <Input type="number" step="0.0001" value={Number(goodDraft.line_subtotal || 0)} onChange={(event) => setGoodDraft((draft) => ({ ...draft, line_subtotal: Number(event.target.value) }))} />
            </Field>
            <Field label="قیمت واحد (محاسبه‌ای)">
              <Input value={calcUnitPrice(goodDraft.quantity, goodDraft.line_subtotal)} readOnly className="bg-muted/50" />
            </Field>
            <Field label="وزن خالص (kg)" error={goodErrors.nw_kg}>
              <Input type="number" step="0.01" value={Number(goodDraft.nw_kg || 0)} onChange={(event) => setGoodDraft((draft) => ({ ...draft, nw_kg: Number(event.target.value) }))} />
            </Field>
            <Field label="وزن ناخالص (kg)" error={goodErrors.gw_kg}>
              <Input type="number" step="0.01" value={Number(goodDraft.gw_kg || 0)} onChange={(event) => setGoodDraft((draft) => ({ ...draft, gw_kg: Number(event.target.value) }))} />
            </Field>
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button type="button" onClick={saveGoodDraft}>
              {editingGoodIndex === null ? "افزودن به جدول" : "ذخیره کالا"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setGoodDialogOpen(false)}>
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
