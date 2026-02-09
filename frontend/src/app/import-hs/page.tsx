// src/app/import-hs/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronRight,
  FileSpreadsheet,
  Loader2,
  Upload,
  ShieldCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { authFetch, clearTokens, getMe } from "@/lib/auth-api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const API = process.env.NEXT_PUBLIC_API_BASE!;

const schema = z.object({
  target: z.enum(["seasons", "headings", "hscodes"]),
  file: z
    .instanceof(File, { message: "فایل را انتخاب کنید" })
    .refine(
      (f) =>
        [".csv", ".xlsx"].some((ext) => f.name.toLowerCase().endsWith(ext)),
      { message: "فقط فایل CSV یا XLSX قابل قبول است" },
    ),
  dry_run: z.boolean(),
});

type FormData = z.infer<typeof schema>;

type ImportResponse = {
  model: string;
  dry_run: boolean;
  total_rows: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  row_errors?: Array<{
    row: number;
    code?: string;
    error: any;
  }>;
};

const endpoints: Record<FormData["target"], string> = {
  seasons: "/import/seasons/",
  headings: "/import/headings/",
  hscodes: "/import/hscodes/",
};

function firstErrorMessage(data: any, fallback: string) {
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;

  const keys = Object.keys(data);
  if (keys.length) {
    const v = data[keys[0]];
    if (typeof v === "string") return v;
    if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  }
  return fallback;
}

export default function ImportHsPage() {
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ImportResponse | null>(null);

  const [authChecked, setAuthChecked] = React.useState(false);
  const [meRole, setMeRole] = React.useState<string | null>(null);

  // ✅ Strong guard: verify session + role via API (not just localStorage)
  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const me = await getMe(); // uses authFetch -> refresh -> retry
        if (!mounted) return;

        setMeRole(me.role);

        if (me.role !== "admin") {
          router.replace("/forbidden");
          return;
        }

        setAuthChecked(true);
      } catch (e: any) {
        // If token invalid/expired, getMe throws. Go login.
        clearTokens();
        router.replace("/login");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      target: "hscodes",
      file: undefined as any,
      dry_run: false,
    },
    mode: "onTouched",
  });

  function resetMessages() {
    setError(null);
    setMessage(null);
    setResult(null);
  }

  async function onSubmit(values: FormData) {
    setLoading(true);
    resetMessages();

    try {
      // extra safety: if role not admin for any reason
      if (meRole !== "admin") {
        router.replace("/forbidden");
        return;
      }

      const fd = new FormData();
      fd.append("file", values.file);
      fd.append("dry_run", values.dry_run ? "true" : "false");

      const res = await authFetch(`${API}${endpoints[values.target]}`, {
        method: "POST",
        body: fd,
        // IMPORTANT: do NOT set Content-Type manually for FormData
        headers: {},
      });

      // Handle auth/permission centrally
      if (res.status === 401) {
        clearTokens();
        router.replace("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/forbidden");
        return;
      }

      const data = (await res.json().catch(() => ({}))) as ImportResponse & {
        detail?: string;
      };

      if (!res.ok && res.status !== 207) {
        throw new Error(firstErrorMessage(data, "خطا در ایمپورت فایل"));
      }

      setResult(data);

      if ((data?.errors ?? 0) > 0) {
        setError(
          `ایمپورت انجام شد ولی ${data.errors} خطا وجود دارد. (برخی ردیف‌ها وارد نشدند)`,
        );
      } else {
        setMessage("ایمپورت با موفقیت انجام شد.");
      }
    } catch (e: any) {
      setError(e?.message ?? "خطا");
    } finally {
      setLoading(false);
    }
  }

  const target = form.watch("target");
  const dryRun = form.watch("dry_run");
  const file = form.watch("file") as File | undefined;

  const helpText =
    target === "seasons"
      ? "ستون‌های لازم: code (اختیاری: description, season_notes)"
      : target === "headings"
        ? "ستون‌های لازم: code, season_code (اختیاری: description, heading_notes)"
        : "ستون‌های لازم: code, goods_name_fa, goods_name_en, profit, season_code (اختیاری: customs_duty_rate, import_duty_rate, priority, SUQ, heading_code)";

  // Avoid flashing protected UI while redirecting/checking
  if (!authChecked) {
    return (
      <div className=" overflow-x-hidden">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4">
          <div className="flex items-center gap-2 rounded-2xl border bg-background/80 px-4 py-3 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال بررسی دسترسی...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" overflow-x-hidden">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-[-140px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-[-120px] top-[140px] h-[320px] w-[320px] rounded-full bg-foreground/10 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-120px] h-[340px] w-[340px] rounded-full bg-primary/10 blur-3xl" />
        </div>

        <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 lg:grid-cols-2 lg:items-start">
          {/* Left panel */}
          <section className="order-2 space-y-4 lg:order-1">
            <div className="rounded-3xl border bg-background/70 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">ابزار مدیریتی</p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight">
                    ایمپورت از Excel / CSV
                  </h1>
                </div>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  Import
                </Badge>
              </div>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                فایل‌های <span className="font-medium">CSV</span> یا{" "}
                <span className="font-medium">XLSX</span> را آپلود کنید تا
                Season / Heading / HSCode به صورت{" "}
                <span className="font-medium">upsert</span> (ایجاد یا بروزرسانی
                بر اساس کد) وارد شوند.
              </p>

              <div className="mt-5 grid gap-3">
                <div className="flex items-start gap-3 rounded-2xl border bg-muted/30 px-4 py-4">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border bg-background">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">ایمن و قابل کنترل</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      با فعال‌کردن «Dry Run» می‌توانید فقط اعتبارسنجی کنید و
                      چیزی در دیتابیس ذخیره نشود.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border bg-muted/30 px-4 py-4">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border bg-background">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">ساختار ستون‌ها</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {helpText}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right card */}
          <section className="order-1 lg:order-2">
            <Card className="rounded-3xl border bg-background/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl">ایمپورت فایل</CardTitle>
                  <Badge variant="outline">CSV / XLSX</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>خطا</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {message && (
                  <Alert>
                    <AlertTitle>اطلاع</AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                {result && (
                  <Alert>
                    <AlertTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      نتیجه ایمپورت
                    </AlertTitle>
                    <AlertDescription className="mt-2 space-y-2 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">مدل: {result.model}</Badge>
                        <Badge variant="outline">
                          ردیف‌ها: {result.total_rows}
                        </Badge>
                        <Badge variant="outline">
                          ساخته شد: {result.created}
                        </Badge>
                        <Badge variant="outline">
                          بروزرسانی شد: {result.updated}
                        </Badge>
                        <Badge variant="outline">رد شد: {result.skipped}</Badge>
                        <Badge
                          variant={result.errors ? "destructive" : "secondary"}
                        >
                          خطا: {result.errors}
                        </Badge>
                        {result.dry_run && (
                          <Badge variant="secondary">Dry Run</Badge>
                        )}
                      </div>

                      {!!result.row_errors?.length && (
                        <div className="mt-2 rounded-2xl border bg-muted/30 p-3">
                          <div className="mb-2 flex items-center gap-2 font-semibold">
                            <AlertTriangle className="h-4 w-4" />
                            خطاهای ردیفی (تا ۲۰۰ مورد)
                          </div>
                          <div className="max-h-56 overflow-auto text-xs leading-5">
                            <ul className="list-disc space-y-1 pr-5">
                              {result.row_errors.slice(0, 20).map((re, i) => (
                                <li key={i}>
                                  ردیف {re.row}
                                  {re.code ? ` (کد: ${re.code})` : ""}:{" "}
                                  {typeof re.error === "string"
                                    ? re.error
                                    : JSON.stringify(re.error)}
                                </li>
                              ))}
                            </ul>
                            {result.row_errors.length > 20 && (
                              <p className="mt-2 text-muted-foreground">
                                + {result.row_errors.length - 20} خطای دیگر...
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  {/* Target picker */}
                  <div className="space-y-2">
                    <Label>نوع ایمپورت</Label>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <Button
                        type="button"
                        variant={target === "seasons" ? "default" : "outline"}
                        className="h-12 justify-between rounded-2xl"
                        onClick={() => {
                          resetMessages();
                          form.setValue("target", "seasons", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        disabled={loading}
                      >
                        Season
                        <ChevronRight className="mr-2 h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant={target === "headings" ? "default" : "outline"}
                        className="h-12 justify-between rounded-2xl"
                        onClick={() => {
                          resetMessages();
                          form.setValue("target", "headings", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        disabled={loading}
                      >
                        Heading
                        <ChevronRight className="mr-2 h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant={target === "hscodes" ? "default" : "outline"}
                        className="h-12 justify-between rounded-2xl"
                        onClick={() => {
                          resetMessages();
                          form.setValue("target", "hscodes", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        disabled={loading}
                      >
                        HSCode
                        <ChevronRight className="mr-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* File input */}
                  <div className="space-y-2">
                    <Label htmlFor="file">فایل</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="file"
                          type="file"
                          className="h-12 rounded-2xl file:mr-4 file:rounded-xl file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium"
                          accept=".csv,.xlsx"
                          onChange={(e) => {
                            resetMessages();
                            const f = e.target.files?.[0];
                            form.setValue("file", f as any, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          disabled={loading}
                        />
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <FileSpreadsheet className="h-4 w-4" />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 rounded-2xl"
                        disabled={loading}
                        onClick={() => {
                          resetMessages();
                          form.setValue("file", undefined as any, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          const el = document.getElementById(
                            "file",
                          ) as HTMLInputElement | null;
                          if (el) el.value = "";
                        }}
                      >
                        پاک کردن
                      </Button>
                    </div>

                    {file?.name && (
                      <p className="text-xs text-muted-foreground">
                        فایل انتخاب‌شده:{" "}
                        <span className="font-medium">{file.name}</span>
                      </p>
                    )}

                    {form.formState.errors.file?.message && (
                      <p className="text-sm text-destructive">
                        {String(form.formState.errors.file.message)}
                      </p>
                    )}
                  </div>

                  {/* Dry run */}
                  <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold">Dry Run</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        فقط اعتبارسنجی انجام شود و چیزی ذخیره نشود.
                      </p>
                    </div>
                    <Switch
                      checked={dryRun}
                      onCheckedChange={(v) => {
                        resetMessages();
                        form.setValue("dry_run", Boolean(v), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-2xl"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        در حال آپلود و ایمپورت...
                      </>
                    ) : (
                      <>
                        شروع ایمپورت
                        <Upload className="mr-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <Separator />

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full rounded-2xl"
                    disabled={loading}
                    onClick={() => {
                      resetMessages();
                      setMessage(
                        "نکته: ابتدا Seasons را ایمپورت کنید، سپس Headings، و در نهایت HSCodes.",
                      );
                    }}
                  >
                    راهنما: ترتیب پیشنهادی ایمپورت
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              برای فایل‌های بزرگ، پیشنهاد می‌شود ابتدا Dry Run انجام دهید.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
