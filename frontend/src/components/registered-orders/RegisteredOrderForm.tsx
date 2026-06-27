"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type SubmitHandler,
} from "react-hook-form";
import {
  Calendar as JalaliCalendar,
  DateObject,
} from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { authFetch } from "@/lib/auth-api";
import { bankOptions as rawBankOptions } from "@/lib/bankList";
import { bankList as banksWithBranches } from "@/lib/branchList";
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

const currencySupplyOptions = [
  { value: "خرید ارز از سیستم بانکی", label: "خرید ارز از سیستم بانکی" },
  { value: "از محل ارز خود", label: "از محل ارز خود" },
  { value: "از محل صادرات خود", label: "از محل صادرات خود" },
  { value: "تهاتر", label: "تهاتر" },
  { value: "از محل صادرات دیگران", label: "از محل صادرات دیگران" },
  { value: "از محل ارز دیگران", label: "از محل ارز دیگران" },
  { value: "از محل صادرات", label: "از محل صادرات" },
];

const feeTypeOptions = [
  { value: "فی دریافتی", label: "فی دریافتی" },
  { value: "فی پرداختی", label: "فی پرداختی" },
];

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
  uuid: z.string().optional(),
  description: z.string().min(1, "شرح کالا الزامی است"),
  hs_code: z.string().optional(),
  hs_code_id: z.coerce.number().int().positive("کد HS الزامی است"),
  goods_status: z.string().min(1, "وضعیت کالا الزامی است"),
  price: z.coerce.number().nonnegative("ارزش باید صفر یا بیشتر باشد"),
});

const orderSchema = z.object({
  uuid: z.string().optional(),
  order_number: z.string().optional(),
  order_pdf: z.any().optional(),
  order_pdf_url: z.string().optional(),
  id: z.string().min(1, "شماره ثبت سفارش الزامی است"),
  freight_price: z.coerce
    .number()
    .nonnegative("کرایه حمل باید صفر یا بیشتر باشد"),
  currency_type: z.string().min(1, "نوع ارز الزامی است"),
  fee_type: z.string().min(1, "نوع فی الزامی است"),
  fee_amount: z.coerce
    .number()
    .nonnegative("مبلغ فی (تومان)باید صفر یا بیشتر باشد"),
  applicant_name: z.string().min(1, "نام متقاضیالزامی است"),
  currency_supply: z.string().min(1, "تامین ارز الزامی است"),
  bank_name: z.string().min(1, "نام بانک الزامی است"),
  bank_branch: z.string().min(1, "شعبه بانک الزامی است"),
  payment_instrument: z.string().optional().default(""),
  expire_date: z.string().min(1, "تاریخ انقضا الزامی است"),
  goods: z.array(goodSchema).min(1, "حداقل یک کالا اضافه کنید"),
});

export type RegisteredOrderFormInput = z.input<typeof orderSchema>;
type RegisteredOrderFormValues = z.output<typeof orderSchema>;
type GoodDraft = z.input<typeof goodSchema>;

function fmt(n: unknown) {
  const x = Number(n ?? 0);
  return Number.isFinite(x)
    ? x.toLocaleString("fa-IR", { maximumFractionDigits: 2 })
    : "۰";
}

function normalizeExpireDateValue(value: string) {
  return String(value || "").trim();
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

async function fetchHSCodes(
  query = "",
  signal?: AbortSignal,
): Promise<HSCodeOption[]> {
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

  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];
  return rows.map((x: any) => ({
    id: Number(x.id),
    code: String(x.code ?? ""),
    goods_name_fa: x.goods_name_fa ?? null,
    goods_name_en: x.goods_name_en ?? null,
  }));
}

async function createOrder(payload: FormData) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(`${API_BASE}/registered-orders/`, {
    method: "POST",
    body: payload,
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok)
    throw new Error(data?.detail || JSON.stringify(data) || "خطا در ثبت سفارش");
  return data;
}

async function updateOrder(uuid: string, payload: FormData) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(
    `${API_BASE}/registered-orders/${encodeURIComponent(uuid)}/`,
    {
      method: "PATCH",
      body: payload,
    },
  );
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok)
    throw new Error(
      data?.detail || JSON.stringify(data) || "خطا در ویرایش سفارش",
    );
  return data;
}

function buildOrderFormData(values: RegisteredOrderFormValues) {
  const formData = new FormData();
  formData.append("order_number", values.id);
  formData.append("freight_price", String(values.freight_price ?? 0));
  formData.append("currency_type", values.currency_type);
  formData.append("fee_type", values.fee_type);
  formData.append("fee_amount", String(values.fee_amount ?? 0));
  formData.append("applicant_name", values.applicant_name);
  formData.append("currency_supply", values.currency_supply);
  formData.append("bank_name", values.bank_name);
  formData.append("bank_branch", values.bank_branch);
  formData.append("payment_instrument", values.payment_instrument);
  formData.append("expire_date", normalizeExpireDateValue(values.expire_date));
  formData.append(
    "goods",
    JSON.stringify(
      values.goods.map((g) => ({
        description: g.description,
        hs_code_id: Number(g.hs_code_id),
        goods_status: g.goods_status,
        price: String(g.price ?? 0),
      })),
    ),
  );

  const file = selectedFile(values.order_pdf);
  if (file) formData.append("order_pdf", file);
  return formData;
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
        <p className="text-xs text-destructive">{props.error}</p>
      ) : null}
    </div>
  );
}

function Combobox(props: {
  items: Array<{ value: string; label: string }>;
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  error?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = props.items.find((item) => item.value === props.value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-11 w-full justify-between bg-background text-right font-normal",
            !selected && "text-muted-foreground",
            props.error && "border-destructive",
          )}
        >
          <span className="truncate">
            {selected?.label || props.placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={props.searchPlaceholder || "جستجو..."} />
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
                <Check
                  className={cn(
                    "ml-2 h-4 w-4",
                    item.value === props.value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function HSCodePicker(props: {
  value?: number;
  selectedLabel?: string;
  onChange: (id: number, option?: HSCodeOption) => void;
  error?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [items, setItems] = React.useState<HSCodeOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<HSCodeOption | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    fetchHSCodes(debouncedQuery, ac.signal)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [debouncedQuery]);

  React.useEffect(() => {
    if (!props.value) setSelected(null);
  }, [props.value]);

  const label = selected
    ? `${selected.code} - ${selected.goods_name_fa || selected.goods_name_en || ""}`
    : props.selectedLabel || "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-11 w-full justify-between bg-background text-right font-normal",
            !props.value && "text-muted-foreground",
            props.error && "border-destructive",
          )}
        >
          <span className="truncate">
            {props.value ? label || String(props.value) : "انتخاب HS Code"}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="کد یا نام کالا..."
          />
          <CommandEmpty>
            {loading ? "در حال جستجو..." : "نتیجه‌ای پیدا نشد."}
          </CommandEmpty>
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
                <Check
                  className={cn(
                    "ml-2 h-4 w-4",
                    item.id === props.value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="truncate">
                  {item.code} -{" "}
                  {item.goods_name_fa || item.goods_name_en || "بدون نام"}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function JalaliDateField(props: {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-11 w-full justify-between bg-background text-right font-normal",
            !props.value && "text-muted-foreground",
            props.error && "border-destructive",
          )}
        >
          <span>{props.value || "انتخاب تاریخ"}</span>
          <CalendarIcon className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <JalaliCalendar
          calendar={persian}
          locale={persian_fa}
          value={
            props.value
              ? new DateObject({
                  date: props.value,
                  calendar: persian,
                  locale: persian_fa,
                })
              : undefined
          }
          onChange={(date) => {
            props.onChange(date ? date.format("YYYY/MM/DD") : "");
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function emptyGood(): GoodDraft {
  return {
    description: "",
    hs_code: "",
    hs_code_id: 0,
    goods_status: "نو",
    price: 0,
  };
}

export function RegisteredOrderForm(props: {
  mode: "create" | "edit";
  initialValues: RegisteredOrderFormInput;
  onDone?: (idOrUuid: string) => void;
}) {
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [goodDialogOpen, setGoodDialogOpen] = React.useState(false);
  const [editingGoodIndex, setEditingGoodIndex] = React.useState<number | null>(
    null,
  );
  const [goodDraft, setGoodDraft] = React.useState<GoodDraft>(emptyGood());
  const [goodErrors, setGoodErrors] = React.useState<Record<string, string>>(
    {},
  );

  const form = useForm<RegisteredOrderFormInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: props.initialValues,
    mode: "onChange",
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    trigger,
    watch,
  } = form;

  const goodsFA = useFieldArray({ control, name: "goods" });
  const goods = useWatch({ control, name: "goods" }) || [];
  const selectedBank = watch("bank_name");
  const branchOptions = React.useMemo(
    () => getBranchOptions(selectedBank || ""),
    [selectedBank],
  );

  const steps = [
    {
      title: "اطلاعات کلی",
      description: "شماره ثبت، فایل PDF/JPG و تاریخ انقضا",
    },
    { title: "اطلاعات مالی", description: "بانک، تامین ارز، کرایه و فی" },
    { title: "کالاها", description: "مدیریت کالاها در جدول" },
  ];

  async function goNext() {
    const fields =
      step === 0
        ? (["id", "applicant_name", "expire_date"] as const)
        : step === 1
          ? ([
              "freight_price",
              "currency_type",
              "fee_type",
              "fee_amount",
              "currency_supply",
              "bank_name",
              "bank_branch",
            ] as const)
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
      price: Number(current?.price || current?.line_total || 0),
    });
    setGoodErrors({});
    setGoodDialogOpen(true);
  }

  function saveGoodDraft() {
    const parsed = goodSchema.safeParse({
      ...goodDraft,
      hs_code_id: Number(goodDraft.hs_code_id || 0),
      price: Number(goodDraft.price || 0),
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] || "goods");
        nextErrors[key] = issue.message;
      });
      setGoodErrors(nextErrors);
      return;
    }

    if (editingGoodIndex === null) {
      goodsFA.append(parsed.data);
    } else {
      goodsFA.update(editingGoodIndex, parsed.data);
    }
    setGoodDialogOpen(false);
    setGoodDraft(emptyGood());
    setGoodErrors({});
    trigger("goods");
  }

  const onSubmit: SubmitHandler<RegisteredOrderFormInput> = async (
    rawValues,
  ) => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const values = orderSchema.parse(rawValues);
      const file = selectedFile(values.order_pdf);
      if (props.mode === "create" && !file) {
        setError("فایل PDF یا JPG ثبت سفارش الزامی است.");
        setStep(0);
        return;
      }

      const payload = buildOrderFormData(values);
      const data =
        props.mode === "edit" && values.uuid
          ? await updateOrder(values.uuid, payload)
          : await createOrder(payload);

      setSuccess(
        props.mode === "edit" ? "ثبت سفارش ویرایش شد." : "ثبت سفارش ایجاد شد.",
      );
      props.onDone?.(data?.uuid || values.uuid || values.id);
    } catch (err: any) {
      setError(err?.message || "خطا در ذخیره ثبت سفارش");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form dir="rtl" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="overflow-hidden border-border/80">
        <CardHeader className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                {props.mode === "edit" ? "ویرایش ثبت سفارش" : "ثبت سفارش جدید"}
              </CardTitle>
              <CardDescription>
                فرم در سه مرحله تکمیل می‌شود؛ کالاها در مرحله آخر اضافه می‌شوند.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {steps.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setStep(index)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition",
                    index === step
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted",
                  )}
                >
                  {index + 1}. {item.title}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium">{steps[step].title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {steps[step].description}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-4 sm:p-6">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>خطا</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {success ? (
            <Alert>
              <AlertTitle>انجام شد</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          ) : null}

          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="شماره ثبت سفارش" error={errors.id?.message}>
                <Input className="h-11" {...register("id")} />
              </Field>
              <Field
                label="نام متقاضی در ثبت سفارش"
                error={errors.applicant_name?.message}
              >
                <Input className="h-11" {...register("applicant_name")} />
              </Field>
              <Field label="تاریخ انقضا" error={errors.expire_date?.message}>
                <Controller
                  control={control}
                  name="expire_date"
                  render={({ field }) => (
                    <JalaliDateField
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.expire_date?.message}
                    />
                  )}
                />
              </Field>
              <Field
                label="فایل PDF یا JPG ثبت سفارش"
                error={(errors.order_pdf as any)?.message}
              >
                <Input
                  className="h-11"
                  type="file"
                  accept="application/pdf,image/jpeg,.pdf,.jpg,.jpeg"
                  {...register("order_pdf")}
                />
                {props.initialValues.order_pdf_url ? (
                  <a
                    href={props.initialValues.order_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline-offset-4 hover:underline"
                  >
                    مشاهده فایل فعلی
                  </a>
                ) : null}
              </Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="نوع ارز" error={errors.currency_type?.message}>
                <Controller
                  control={control}
                  name="currency_type"
                  render={({ field }) => (
                    <Combobox
                      items={currencyOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="انتخاب ارز"
                    />
                  )}
                />
              </Field>
              <Field
                label="مانده کرایه حمل"
                error={errors.freight_price?.message}
              >
                <Input
                  className="h-11"
                  type="number"
                  step="0.01"
                  {...register("freight_price")}
                />
              </Field>
              <Field label="نوع فی" error={errors.fee_type?.message}>
                <Controller
                  control={control}
                  name="fee_type"
                  render={({ field }) => (
                    <Combobox
                      items={feeTypeOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="انتخاب نوع فی"
                    />
                  )}
                />
              </Field>
              <Field label="مبلغ فی (تومان)" error={errors.fee_amount?.message}>
                <Input
                  className="h-11"
                  type="number"
                  step="0.01"
                  {...register("fee_amount")}
                />
              </Field>
              <Field label="تامین ارز" error={errors.currency_supply?.message}>
                <Controller
                  control={control}
                  name="currency_supply"
                  render={({ field }) => (
                    <Combobox
                      items={currencySupplyOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="انتخاب تامین ارز"
                    />
                  )}
                />
              </Field>
              <Field label="بانک" error={errors.bank_name?.message}>
                <Controller
                  control={control}
                  name="bank_name"
                  render={({ field }) => (
                    <Combobox
                      items={bankOptions}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        setValue("bank_branch", "");
                      }}
                      placeholder="انتخاب بانک"
                    />
                  )}
                />
              </Field>
              <Field label="شعبه بانک" error={errors.bank_branch?.message}>
                <Controller
                  control={control}
                  name="bank_branch"
                  render={({ field }) => (
                    <Combobox
                      items={branchOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="انتخاب شعبه"
                    />
                  )}
                />
              </Field>
              <Field label="ابزار پرداخت">
                <Input className="h-11" {...register("payment_instrument")} />
              </Field>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">کالاها</h3>
                  <p className="text-sm text-muted-foreground">
                    کالاها را به جدول اضافه کنید و در صورت نیاز ویرایش کنید.
                  </p>
                </div>
                <Button type="button" onClick={openAddGood} className="gap-2">
                  <Plus className="h-4 w-4" />
                  افزودن کالا
                </Button>
              </div>

              {errors.goods?.message ? (
                <p className="text-sm text-destructive">
                  {errors.goods.message}
                </p>
              ) : null}

              <div className="overflow-hidden rounded-xl border">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="bg-muted/60">
                      <tr className="text-right">
                        <th className="p-3 font-medium">شرح کالا</th>
                        <th className="p-3 font-medium">HS Code</th>
                        <th className="p-3 font-medium">وضعیت</th>
                        <th className="p-3 font-medium">ارزش</th>
                        <th className="p-3 font-medium">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goods.length ? (
                        goods.map((good: any, index) => (
                          <tr
                            key={goodsFA.fields[index]?.id || index}
                            className="border-t"
                          >
                            <td className="p-3">{good.description || "-"}</td>
                            <td className="p-3">
                              {good.hs_code || good.hs_code_id || "-"}
                            </td>
                            <td className="p-3">{good.goods_status || "-"}</td>
                            <td className="p-3">
                              {fmt(good.price || good.line_total)}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditGood(index)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => goodsFA.remove(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-8 text-center text-muted-foreground"
                          >
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
            <Button
              type="button"
              variant="outline"
              disabled={step === 0 || submitting}
              onClick={() => setStep((s) => s - 1)}
            >
              مرحله قبل
            </Button>
            <div className="flex gap-3">
              {step < steps.length - 1 ? (
                <Button type="button" onClick={goNext}>
                  مرحله بعد
                </Button>
              ) : (
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "در حال ذخیره..."
                    : props.mode === "edit"
                      ? "ذخیره تغییرات"
                      : "ثبت سفارش"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={goodDialogOpen} onOpenChange={setGoodDialogOpen}>
        <DialogContent
          className="max-h-[90dvh] overflow-y-auto text-right sm:max-w-2xl"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle>
              {editingGoodIndex === null ? "افزودن کالا" : "ویرایش کالا"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="شرح کالا" error={goodErrors.description}>
              <Input
                className="h-11"
                value={goodDraft.description || ""}
                onChange={(event) =>
                  setGoodDraft((draft) => ({
                    ...draft,
                    description: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="HS Code" error={goodErrors.hs_code_id}>
              <HSCodePicker
                value={Number(goodDraft.hs_code_id || 0)}
                selectedLabel={goodDraft.hs_code}
                onChange={(id, option) =>
                  setGoodDraft((draft) => ({
                    ...draft,
                    hs_code_id: id,
                    hs_code: option
                      ? `${option.code} - ${option.goods_name_fa || option.goods_name_en || ""}`
                      : draft.hs_code,
                  }))
                }
              />
            </Field>
            <Field label="وضعیت کالا" error={goodErrors.goods_status}>
              <Combobox
                items={goodsStatusOptions}
                value={String(goodDraft.goods_status || "")}
                onChange={(value) =>
                  setGoodDraft((draft) => ({ ...draft, goods_status: value }))
                }
                placeholder="انتخاب وضعیت"
              />
            </Field>
            <Field label="ارزش کل" error={goodErrors.price}>
              <Input
                className="h-11"
                type="number"
                step="0.01"
                value={Number(goodDraft.price || 0)}
                onChange={(event) =>
                  setGoodDraft((draft) => ({
                    ...draft,
                    price: Number(event.target.value),
                  }))
                }
              />
            </Field>
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button type="button" onClick={saveGoodDraft}>
              {editingGoodIndex === null ? "افزودن به جدول" : "ذخیره کالا"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setGoodDialogOpen(false)}
            >
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
