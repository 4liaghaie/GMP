"use client";

import * as React from "react";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";

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
const NEED_STATUS_AT_ORIGIN = "در کشور مبدا";
const ALL_CUSTOMS_VALUE = "ALL_CUSTOMS";
const needStatusOptions = [
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
];
const paymentTerms = [
  { value: "TT", label: "TT (حواله بانکی)" },
  { value: "LC", label: "LC (اعتبار اسنادی)" },
  { value: "CAD", label: "CAD (اسناد در مقابل پرداخت)" },
  { value: "DP", label: "D/P (اسناد در مقابل پرداخت)" },
  { value: "DA", label: "D/A (اسناد در مقابل قبول)" },
];
const transportMeans = [
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
const customsOptions = iranCustoms.map((customs) => ({
  value: String(customs.ctmVCodeInt),
  label: `${customs.ctmNameStr} (${customs.ctmVCodeInt})`,
}));
const allCustomsOption = { value: ALL_CUSTOMS_VALUE, label: "تمام گمرکات" };
const countryOptions = countries.map((country) => ({
  value: country.code,
  label: `${country.persianName} (${country.code})`,
}));

const schema = z.object({
  uuid: z.string().optional(),
  hs_code: z.string().optional(),
  description: z.string().min(1, "توضیحات کالا الزامی است"),
  hs_code_id: z.coerce.number().int().positive("کد HS الزامی است"),
  status: z.string().min(1, "وضعیت نیاز کالا الزامی است"),
  goods_status: z.string().min(1, "وضعیت کالا الزامی است"),
  quantity: z.coerce.number().positive("مقدار باید بیشتر از صفر باشد"),
  unit: z.string().min(1, "واحد الزامی است"),
  manufacturer_country: z.string().min(1, "کشور سازنده الزامی است"),
  country_of_origin: z.string().min(1, "کشور مبدا الزامی است"),
  price: z.coerce.number().nonnegative("قیمت باید صفر یا بیشتر باشد"),
  currency_type: z.string().min(1, "نوع ارز الزامی است"),
  fee_type: z.string().min(1, "نوع فی الزامی است"),
  fee_amount: z.coerce.number().nonnegative("مبلغ فی باید صفر یا بیشتر باشد"),
  entry_border: z.string().min(1, "مرز ورودی الزامی است"),
  customs: z.string().min(1, "گمرک الزامی است"),
  terms_of_delivery: z.string().min(1, "شرایط تحویل الزامی است"),
  terms_of_payment: z.string().min(1, "شرایط پرداخت الزامی است"),
  partial_shipment: z.boolean().default(false),
  means_of_transport: z.string().min(1, "روش حمل الزامی است"),
  nw_kg: z.coerce.number().nonnegative("وزن خالص باید صفر یا بیشتر باشد"),
  gw_kg: z.coerce.number().nonnegative("وزن ناخالص باید صفر یا بیشتر باشد"),
}).superRefine((value, ctx) => {
  if (value.customs === ALL_CUSTOMS_VALUE && value.status !== NEED_STATUS_AT_ORIGIN) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customs"],
      message: "تمام گمرکات فقط برای وضعیت در کشور مبدا قابل انتخاب است",
    });
  }
});

export type GoodsNeedFormInput = z.input<typeof schema>;
type GoodsNeedFormValue = z.output<typeof schema>;

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

function truncateText(s: string, max = 30) {
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
    const shortName = truncateText(name, 30);
    return shortName ? `${selected.code} — ${shortName}` : selected.code;
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
              placeholder="جستجو در سرور (کد یا نام)..."
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
                const shortName = truncateText(name, 30);
                const label = shortName
                  ? `${item.code} — ${shortName}`
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

async function createGoodsNeed(values: GoodsNeedFormValue) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(`${API_BASE}/goods-needs/`, {
    method: "POST",
    body: JSON.stringify(values),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(
      data?.detail || JSON.stringify(data) || "خطا در ایجاد نیاز کالا",
    );
  }
  return data;
}

async function updateGoodsNeed(uuid: string, values: GoodsNeedFormValue) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(
    `${API_BASE}/goods-needs/${encodeURIComponent(uuid)}/`,
    {
      method: "PUT",
      body: JSON.stringify(values),
    },
  );
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(
      data?.detail || JSON.stringify(data) || "خطا در ویرایش نیاز کالا",
    );
  }
  return data;
}

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
  const { register, handleSubmit, setValue, watch, formState } = form;
  const { errors } = formState;
  const mode = props.mode || "create";
  const selectedStatus = String(watch("status") || "");
  const selectedCustoms = String(watch("customs") || "");
  const availableCustomsOptions = React.useMemo(
    () =>
      selectedStatus === NEED_STATUS_AT_ORIGIN
        ? [allCustomsOption, ...customsOptions]
        : customsOptions,
    [selectedStatus],
  );

  React.useEffect(() => {
    form.reset(props.initialValues);
  }, [form, props.initialValues]);

  React.useEffect(() => {
    if (
      selectedStatus !== NEED_STATUS_AT_ORIGIN &&
      selectedCustoms === ALL_CUSTOMS_VALUE
    ) {
      setValue("customs", "", { shouldValidate: true });
    }
  }, [selectedCustoms, selectedStatus, setValue]);

  const onSubmit: SubmitHandler<GoodsNeedFormInput> = async (raw) => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const values = schema.parse(raw);
      const uuid = String(values.uuid || "");
      const saved =
        mode === "edit"
          ? await updateGoodsNeed(uuid, values)
          : await createGoodsNeed(values);
      setSuccess(
        mode === "edit" ? "نیاز کالا ویرایش شد." : "نیاز کالا ایجاد شد.",
      );
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
            {mode === "edit" ? "ویرایش نیاز کالا" : "ایجاد نیاز کالا"}
          </CardTitle>
          <CardDescription>
            نیاز فقط برای یک کالا ثبت می‌شود تا صاحبان ثبت سفارش مشابه بتوانند
            آن را پیدا کنند.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="توضیحات کالا" error={errors.description?.message}>
            <Input {...register("description")} />
          </Field>

          <HSCodePicker
            value={Number(watch("hs_code_id") || 0)}
            onChange={(value) =>
              setValue("hs_code_id", value, { shouldValidate: true })
            }
            selectedCode={String(watch("hs_code") || "")}
            error={errors.hs_code_id?.message}
          />

          <SearchableCombobox
            label="وضعیت نیاز کالا"
            value={String(watch("status") || "")}
            onChange={(value) =>
              setValue("status", value, { shouldValidate: true })
            }
            items={needStatusOptions}
            placeholder="انتخاب وضعیت نیاز کالا"
            error={errors.status?.message}
          />

          <SearchableCombobox
            label="وضعیت کالا"
            value={String(watch("goods_status") || "")}
            onChange={(value) =>
              setValue("goods_status", value, { shouldValidate: true })
            }
            items={goodsStatusOptions}
            placeholder="انتخاب وضعیت کالا"
            error={errors.goods_status?.message}
          />

          <Field label="مقدار" error={errors.quantity?.message}>
            <Input type="number" step="0.01" {...register("quantity")} />
          </Field>

          <SearchableCombobox
            label="واحد"
            value={String(watch("unit") || "")}
            onChange={(value) =>
              setValue("unit", value, { shouldValidate: true })
            }
            items={unitOptions}
            placeholder="انتخاب واحد"
            error={errors.unit?.message}
          />

          <SearchableCombobox
            label="کشور سازنده"
            value={String(watch("manufacturer_country") || "")}
            onChange={(value) =>
              setValue("manufacturer_country", value, { shouldValidate: true })
            }
            items={countryOptions}
            placeholder="انتخاب کشور..."
            searchPlaceholder="جستجو: نام فارسی / انگلیسی / کد..."
            error={errors.manufacturer_country?.message}
          />

          <SearchableCombobox
            label="کشور مبدا"
            value={String(watch("country_of_origin") || "")}
            onChange={(value) =>
              setValue("country_of_origin", value, { shouldValidate: true })
            }
            items={countryOptions}
            placeholder="انتخاب کشور..."
            searchPlaceholder="جستجو: نام فارسی / انگلیسی / کد..."
            error={errors.country_of_origin?.message}
          />

          <Field label="قیمت" error={errors.price?.message}>
            <Input type="number" step="0.0001" {...register("price")} />
          </Field>

          <SearchableCombobox
            label="نوع ارز"
            value={String(watch("currency_type") || "")}
            onChange={(value) =>
              setValue("currency_type", value, { shouldValidate: true })
            }
            items={currencyOptions}
            placeholder="انتخاب نوع ارز"
            searchPlaceholder="جستجو در ارزها..."
            error={errors.currency_type?.message}
          />

          <SearchableCombobox
            label="نوع فی"
            value={String(watch("fee_type") || "")}
            onChange={(value) =>
              setValue("fee_type", value, { shouldValidate: true })
            }
            items={feeTypeOptions}
            placeholder="انتخاب نوع فی"
            error={errors.fee_type?.message}
          />

          <Field
            label="مبلغ فی برای هر واحد ارز ثبت سفارش"
            error={errors.fee_amount?.message}
          >
            <Input type="number" step="0.01" {...register("fee_amount")} />
          </Field>

          <SearchableCombobox
            label="مرز ورودی"
            value={String(watch("entry_border") || "")}
            onChange={(value) =>
              setValue("entry_border", value, { shouldValidate: true })
            }
            items={borderOptions}
            placeholder="انتخاب مرز ورودی"
            searchPlaceholder="جستجو در مرزها..."
            error={errors.entry_border?.message}
          />

          <SearchableCombobox
            label="گمرک"
            value={String(watch("customs") || "")}
            onChange={(value) =>
              setValue("customs", value, { shouldValidate: true })
            }
            items={availableCustomsOptions}
            placeholder="انتخاب گمرک"
            searchPlaceholder="جستجو در گمرک‌ها..."
            error={errors.customs?.message}
          />

          <SearchableCombobox
            label="شرایط تحویل"
            value={String(watch("terms_of_delivery") || "")}
            onChange={(value) =>
              setValue("terms_of_delivery", value, { shouldValidate: true })
            }
            items={deliveryTerms}
            placeholder="انتخاب..."
            error={errors.terms_of_delivery?.message}
          />

          <SearchableCombobox
            label="شرایط پرداخت"
            value={String(watch("terms_of_payment") || "")}
            onChange={(value) =>
              setValue("terms_of_payment", value, { shouldValidate: true })
            }
            items={paymentTerms}
            placeholder="انتخاب..."
            error={errors.terms_of_payment?.message}
          />

          <SearchableCombobox
            label="روش حمل"
            value={String(watch("means_of_transport") || "")}
            onChange={(value) =>
              setValue("means_of_transport", value, { shouldValidate: true })
            }
            items={transportMeans}
            placeholder="انتخاب..."
            error={errors.means_of_transport?.message}
          />

          <Field label="وزن خالص (kg)" error={errors.nw_kg?.message}>
            <Input type="number" step="0.01" {...register("nw_kg")} />
          </Field>

          <Field label="وزن ناخالص (kg)" error={errors.gw_kg?.message}>
            <Input type="number" step="0.01" {...register("gw_kg")} />
          </Field>

          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={Boolean(watch("partial_shipment"))}
              onChange={(event) =>
                setValue("partial_shipment", event.target.checked, {
                  shouldValidate: true,
                })
              }
            />
            حمل به دفعات مجاز است
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>~
          {submitting
            ? "در حال ذخیره..."
            : mode === "edit"
              ? "ذخیره تغییرات"
              : "ایجاد نیاز کالا"}
        </Button>
      </div>
    </form>
  );
}
