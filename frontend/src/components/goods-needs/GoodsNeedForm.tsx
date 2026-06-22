"use client";

import * as React from "react";
import { z } from "zod";
import {
  Controller,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, PlusCircle, Trash2, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

const borderOptions = borders.map((border) => ({
  value: border,
  label: border,
}));
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
  price: z.coerce
    .number()
    .nonnegative("قیمت باید صفر یا بیشتر باشد")
    .optional(),
  line_subtotal: z.coerce
    .number()
    .nonnegative("ارزش کل باید صفر یا بیشتر باشد"),
  nw_kg: z.coerce.number().nonnegative("وزن خالص باید صفر یا بیشتر باشد"),
  gw_kg: z.coerce.number().nonnegative("وزن ناخالص باید صفر یا بیشتر باشد"),
});

const schema = z
  .object({
    uuid: z.string().optional(),
    status: z.string().min(1, "وضعیت بار الزامی است"),
    country_of_origin: z.string().min(1, "کشور مبدا الزامی است"),
    currency_type: z.string().min(1, "نوع ارز الزامی است"),
    fee_type: z.string().min(1, "نوع فی الزامی است"),
    fee_amount: z.coerce.number().nonnegative("مبلغ فی باید صفر یا بیشتر باشد"),
    entry_border: z.array(z.string()).optional().default([]),
    customs: z.array(z.string()).min(1, "گمرک الزامی است"),
    means_of_transport: z.array(z.string()).min(1, "روش حمل الزامی است"),
    goods: z.array(goodSchema).min(1, "حداقل یک کالا الزامی است"),
  })
  .superRefine((value, ctx) => {
    if (
      value.customs.includes(ALL_CUSTOMS_VALUE) &&
      value.status !== NEED_STATUS_AT_ORIGIN
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customs"],
        message: "تمام گمرکات فقط برای وضعیت در کشور مبدا قابل انتخاب است",
      });
    }
    if (
      value.entry_border.includes(ALL_BORDERS_VALUE) &&
      value.status !== NEED_STATUS_AT_ORIGIN
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entry_border"],
        message: "همه مرز ها فقط برای وضعیت در کشور مبدا قابل انتخاب است",
      });
    }
    if (
      value.means_of_transport.includes(ALL_TRANSPORTS_VALUE) &&
      value.means_of_transport.length > 1
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["means_of_transport"],
        message: "همه روش های حمل باید به صورت تنهایی انتخاب شود",
      });
    }
  });

export type GoodsNeedFormInput = z.input<typeof schema>;
type GoodsNeedFormValue = z.output<typeof schema>;

function calcUnitPrice(quantity: unknown, subtotal: unknown) {
  const qty = Number(quantity || 0);
  const total = Number(subtotal || 0);
  if (!Number.isFinite(qty) || qty <= 0) return 0;
  if (!Number.isFinite(total) || total < 0) return 0;
  return total / qty;
}

function buildPayload(values: GoodsNeedFormValue) {
  return {
    ...values,
    entry_border: values.entry_border.join(", "),
    customs: values.customs.join(", "),
    means_of_transport: values.means_of_transport.join(", "),
    goods: values.goods.map((good) => {
      const { line_subtotal, ...rest } = good;
      return {
        ...rest,
        manufacturer_country: good.manufacturer_country.join(", "),
        price: calcUnitPrice(good.quantity, line_subtotal),
      };
    }),
  };
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

function normalizeFa(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(s: string, max = 34) {
  const t = (s ?? "").trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max)}...` : t;
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
  onChange: (v: string[]) => void;
  items: readonly T[];
  exclusiveValues?: string[];
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
                const isExclusive = props.exclusiveValues?.includes(it.value);
                return (
                  <CommandItem
                    key={it.value}
                    value={it.value}
                    onSelect={() => {
                      if (isSelected) {
                        props.onChange(
                          props.values.filter((value) => value !== it.value),
                        );
                        return;
                      }
                      if (isExclusive) {
                        props.onChange([it.value]);
                        return;
                      }
                      props.onChange([
                        ...props.values.filter(
                          (value) => !props.exclusiveValues?.includes(value),
                        ),
                        it.value,
                      ]);
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

async function searchHSCodes(query: string, signal?: AbortSignal) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const url = new URL(`${API_BASE}/hs-codes/`);
  if (query.trim()) url.searchParams.set("search", query.trim());
  const res = await authFetch(url.toString(), { method: "GET", signal });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "خطا در دریافت کد HS");
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
  })) as HSCodeOption[];
}

function HSCodePicker(props: {
  value: number;
  onChange: (value: number) => void;
  selectedCode?: string;
  error?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<HSCodeOption[]>([]);
  const [selected, setSelected] = React.useState<HSCodeOption | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    setLoading(true);
    searchHSCodes(query, ac.signal)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [open, query]);

  const selectedLabel = React.useMemo(() => {
    if (!selected) return "";
    const name = selected.goods_name_fa || selected.goods_name_en || "";
    const shortName = truncateText(name);
    return shortName ? `${selected.code} - ${shortName}` : selected.code;
  }, [selected]);
  const displayLabel =
    selectedLabel ||
    (props.value && props.selectedCode ? props.selectedCode : "");

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
                !displayLabel && "text-muted-foreground",
              )}
            >
              {displayLabel || "جستجو و انتخاب HS Code..."}
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
              placeholder="جستجو در سرور..."
              value={query}
              onValueChange={setQuery}
            />
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">
                در حال جستجو...
              </div>
            ) : null}
            <CommandEmpty>موردی پیدا نشد.</CommandEmpty>
            <CommandGroup className="max-h-[320px] overflow-auto">
              {items.map((item) => {
                const name = item.goods_name_fa || item.goods_name_en || "";
                const shortName = truncateText(name);
                const label = shortName
                  ? `${item.code} - ${shortName}`
                  : item.code;
                const isSelected = item.id === props.value;
                return (
                  <CommandItem
                    key={item.id}
                    value={String(item.id)}
                    onSelect={() => {
                      props.onChange(item.id);
                      setSelected(item);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate">{label}</span>
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

async function createGoodsNeed(values: ReturnType<typeof buildPayload>) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(`${API_BASE}/goods-needs/`, {
    method: "POST",
    body: JSON.stringify(values),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok)
    throw new Error(data?.detail || JSON.stringify(data) || "خطا در ایجاد بار");
  return data;
}

async function updateGoodsNeed(
  uuid: string,
  values: ReturnType<typeof buildPayload>,
) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(
    `${API_BASE}/goods-needs/${encodeURIComponent(uuid)}/`,
    {
      method: "PUT",
      body: JSON.stringify(values),
    },
  );
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok)
    throw new Error(
      data?.detail || JSON.stringify(data) || "خطا در ویرایش بار",
    );
  return data;
}

const emptyGood = {
  description: "",
  hs_code_id: 0,
  goods_status: "نو",
  quantity: 1,
  unit: "KG",
  manufacturer_country: ["CN"],
  price: 0,
  line_subtotal: 0,
  nw_kg: 0,
  gw_kg: 0,
};

export function GoodsNeedForm(props: {
  mode?: "create" | "edit";
  initialValues: GoodsNeedFormInput;
  onDone?: (uuid: string) => void;
}) {
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<GoodsNeedFormInput>({
    resolver: zodResolver(schema),
    defaultValues: props.initialValues,
    mode: "onChange",
  });
  const { control, register, handleSubmit, setValue, watch, formState } = form;
  const { errors } = formState;
  const goodsFA = useFieldArray({ control, name: "goods" });
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
        setValue("customs", selectedCustoms.slice(0, 1), {
          shouldValidate: true,
        });
      }
      if (selectedEntryBorder.includes(ALL_BORDERS_VALUE)) {
        setValue("entry_border", [], { shouldValidate: true });
      } else if (selectedEntryBorder.length > 1) {
        setValue("entry_border", selectedEntryBorder.slice(0, 1), {
          shouldValidate: true,
        });
      }
    }
  }, [isAtOrigin, selectedCustoms, selectedEntryBorder, setValue]);

  const onSubmit: SubmitHandler<GoodsNeedFormInput> = async (raw) => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const values = schema.parse(raw);
      const payload = buildPayload(values);
      const uuid = String(values.uuid || "");
      const saved =
        mode === "edit"
          ? await updateGoodsNeed(uuid, payload)
          : await createGoodsNeed(payload);
      setSuccess(mode === "edit" ? "بار ویرایش شد." : "بار ایجاد شد.");
      props.onDone?.(String(saved?.uuid ?? uuid));
    } catch (err: any) {
      setError(err?.message || "خطا");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error || success ? (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertTitle>{error ? "خطا" : "موفق"}</AlertTitle>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="overflow-hidden before:h-1 before:bg-amber-600 before:content-['']">
        <CardHeader>
          <CardTitle className="text-base">
            {mode === "edit" ? "ویرایش بار" : "ایجاد بار"}
          </CardTitle>
          <CardDescription>
            اطلاعات مشترک بار را وارد کنید؛ کالاها در بخش بعدی به صورت چند ردیفی
            ثبت می‌شوند.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <SearchableCombobox
                label="وضعیت بار"
                value={field.value || ""}
                onChange={field.onChange}
                items={proformaStatusOptions}
                placeholder="انتخاب وضعیت بار"
                error={errors.status?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="country_of_origin"
            render={({ field }) => (
              <SearchableCombobox
                label="کشور مبدا"
                value={field.value || ""}
                onChange={field.onChange}
                items={countryOptions}
                placeholder="انتخاب کشور"
                error={errors.country_of_origin?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="currency_type"
            render={({ field }) => (
              <SearchableCombobox
                label="نوع ارز"
                value={field.value || ""}
                onChange={field.onChange}
                items={currencyOptions}
                placeholder="انتخاب ارز"
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
                value={field.value || ""}
                onChange={field.onChange}
                items={feeTypeOptions}
                placeholder="انتخاب نوع فی"
                error={errors.fee_type?.message}
              />
            )}
          />
          <Field
            label="مبلغ فی (تومان) برای هر واحد ارز"
            error={errors.fee_amount?.message}
          >
            <Input type="number" step="0.01" {...register("fee_amount")} />
          </Field>
          <Controller
            control={control}
            name="entry_border"
            render={({ field }) =>
              isAtOrigin ? (
                <MultiSelectCombobox
                  label="مرز ورودی"
                  values={field.value || []}
                  onChange={field.onChange}
                  items={availableBorderOptions}
                  exclusiveValues={[ALL_BORDERS_VALUE]}
                  placeholder="اختیاری - انتخاب مرز"
                  error={errors.entry_border?.message}
                />
              ) : (
                <SearchableCombobox
                  label="مرز ورودی"
                  value={field.value?.[0] || ""}
                  onChange={(value) => field.onChange(value ? [value] : [])}
                  items={availableBorderOptions}
                  placeholder="اختیاری - انتخاب مرز"
                  error={errors.entry_border?.message}
                />
              )
            }
          />
          <Controller
            control={control}
            name="customs"
            render={({ field }) =>
              isAtOrigin ? (
                <MultiSelectCombobox
                  label="گمرک"
                  values={field.value || []}
                  onChange={field.onChange}
                  items={availableCustomsOptions}
                  exclusiveValues={[ALL_CUSTOMS_VALUE]}
                  placeholder="انتخاب گمرک"
                  error={errors.customs?.message}
                />
              ) : (
                <SearchableCombobox
                  label="گمرک"
                  value={field.value?.[0] || ""}
                  onChange={(value) => field.onChange(value ? [value] : [])}
                  items={availableCustomsOptions}
                  placeholder="انتخاب گمرک"
                  error={errors.customs?.message}
                />
              )
            }
          />
          <Controller
            control={control}
            name="means_of_transport"
            render={({ field }) => (
              <MultiSelectCombobox
                label="روش حمل"
                values={field.value || []}
                onChange={field.onChange}
                items={transportMeans}
                exclusiveValues={[ALL_TRANSPORTS_VALUE]}
                placeholder="انتخاب"
                error={errors.means_of_transport?.message}
              />
            )}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden before:h-1 before:bg-slate-900 before:content-['']">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">کالاهای بار</CardTitle>
            <CardDescription>
              برای هر بار می‌توانید چند کالا ثبت کنید.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => goodsFA.append(emptyGood)}
          >
            <PlusCircle className="h-4 w-4" />
            افزودن کالا
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {goodsFA.fields.map((field, idx) => {
            const rowErr: any = (errors as any)?.goods?.[idx];
            const row = watch(`goods.${idx}` as const);
            const calculatedUnitPrice = calcUnitPrice(
              row?.quantity,
              row?.line_subtotal,
            );
            return (
              <div key={field.id} className="rounded-2xl border bg-card p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="font-semibold">کالا {idx + 1}</div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => goodsFA.remove(idx)}
                    disabled={goodsFA.fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
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
                      <HSCodePicker
                        value={Number(field.value || 0)}
                        onChange={field.onChange}
                        selectedCode={String(
                          watch(`goods.${idx}.hs_code` as const) || "",
                        )}
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
                        placeholder="انتخاب وضعیت"
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
                        error={rowErr?.unit?.message}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name={`goods.${idx}.manufacturer_country` as const}
                    render={({ field }) => (
                      <MultiSelectCombobox
                        label="کشور سازنده"
                        values={field.value || []}
                        onChange={field.onChange}
                        items={countryOptions}
                        placeholder="انتخاب کشور"
                        error={rowErr?.manufacturer_country?.message}
                      />
                    )}
                  />
                  <Field
                    label="ارزش کل ردیف"
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
                      value={
                        Number.isFinite(calculatedUnitPrice)
                          ? calculatedUnitPrice
                          : 0
                      }
                      readOnly
                      className="bg-muted/50"
                    />
                  </Field>
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

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "در حال ذخیره..."
            : mode === "edit"
              ? "ذخیره تغییرات"
              : "ایجاد بار"}
        </Button>
      </div>
    </form>
  );
}
