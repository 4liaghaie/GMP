"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Shield,
  UserRound,
} from "lucide-react";
import { register as registerApi } from "@/lib/auth-api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد.")
      .max(128),
    password2: z
      .string()
      .min(8, "تکرار رمز عبور باید حداقل ۸ کاراکتر باشد.")
      .max(128),
    first_name: z.string().max(50).optional().or(z.literal("")),
    last_name: z.string().max(50).optional().or(z.literal("")),
    email: z
      .string()
      .trim()
      .min(1, "ایمیل الزامی است.")
      .email("ایمیل معتبر نیست."),
    phone: z
      .string()
      .trim()
      .min(1, "شماره موبایل الزامی است.")
      .max(20),
  })
  .refine((v) => v.password === v.password2, {
    message: "تکرار رمز عبور با رمز عبور یکسان نیست.",
    path: ["password2"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();

  React.useEffect(() => {
    const access = localStorage.getItem("access");
    if (access) router.replace("/dashboard");
  }, [router]);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showPassword2, setShowPassword2] = React.useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      password2: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
    },
    mode: "onTouched",
  });

  function resetMessages() {
    setError(null);
    setOk(null);
  }

  async function onSubmit(values: FormData) {
    resetMessages();
    setLoading(true);

    try {
      const res = await registerApi({
        password: values.password,
        password2: values.password2,
        first_name: values.first_name?.trim() || undefined,
        last_name: values.last_name?.trim() || undefined,
        email: values.email.trim(),
        phone: values.phone.trim(),
      });

      setOk(
        res.detail ||
          "درخواست ثبت‌نام شما ثبت شد و بعد از تایید ادمین امکان ورود دارید.",
      );
      form.reset();
      window.setTimeout(() => router.push("/login"), 1800);
    } catch (e: any) {
      setError(e?.message ?? "خطا");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-x-hidden">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-[-140px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-[-120px] top-[120px] h-[320px] w-[320px] rounded-full bg-foreground/10 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-120px] h-[340px] w-[340px] rounded-full bg-primary/10 blur-3xl" />
        </div>

        <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 lg:grid-cols-2 lg:items-start">
          <section className="order-2 space-y-4 lg:order-1">
            <div className="rounded-3xl border bg-background/70 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">ثبت‌نام</p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight">
                    ساخت حساب کاربری
                  </h1>
                </div>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  ایمیل / رمز عبور
                </Badge>
              </div>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                ایمیل و شماره موبایل الزامی است. سیستم برای شما یک نام کاربری
                تصادفی می‌سازد تا سایر کاربران فقط با همان نام شما را بشناسند.
              </p>

              <div className="mt-5 grid gap-3">
                <div className="flex items-start gap-3 rounded-2xl border bg-muted/30 px-4 py-4">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border bg-background">
                    <LockKeyhole className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">رمز عبور قوی</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      از رمز عبور حداقل ۸ کاراکتری و ترجیحاً منحصربه‌فرد استفاده
                      کنید.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border bg-muted/30 px-4 py-4">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border bg-background">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">ناشناس برای کاربران</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      فقط ادمین‌ها ایمیل و شماره موبایل شما را می‌بینند و کاربران
                      عادی فقط نام کاربری تولیدشده را مشاهده می‌کنند.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="order-1 lg:order-2">
            <Card className="rounded-3xl border bg-background/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl">ثبت‌نام</CardTitle>
                  <Badge variant="outline">
                    <span className="inline-flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      حساب جدید
                    </span>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>خطا</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {ok && (
                  <Alert>
                    <AlertTitle>اطلاع</AlertTitle>
                    <AlertDescription>{ok}</AlertDescription>
                  </Alert>
                )}

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">رمز عبور</Label>

                      <div className="relative">
                        <Input
                          id="password"
                          className="h-12 rounded-2xl pl-12"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          {...form.register("password")}
                          onChange={(e) => {
                            resetMessages();
                            form.setValue("password", e.target.value, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>

                      {form.formState.errors.password?.message && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password2">تکرار رمز عبور</Label>

                      <div className="relative">
                        <Input
                          id="password2"
                          className="h-12 rounded-2xl pl-12"
                          type={showPassword2 ? "text" : "password"}
                          autoComplete="new-password"
                          {...form.register("password2")}
                          onChange={(e) => {
                            resetMessages();
                            form.setValue("password2", e.target.value, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword2((prev) => !prev)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                        >
                          {showPassword2 ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>

                      {form.formState.errors.password2?.message && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.password2.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">نام</Label>
                      <Input
                        id="first_name"
                        className="h-12 rounded-2xl"
                        {...form.register("first_name")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">نام خانوادگی</Label>
                      <Input
                        id="last_name"
                        className="h-12 rounded-2xl"
                        {...form.register("last_name")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">ایمیل</Label>
                    <Input
                      id="email"
                      className="h-12 rounded-2xl"
                      inputMode="email"
                      autoComplete="email"
                      {...form.register("email")}
                    />
                    {form.formState.errors.email?.message && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">شماره موبایل</Label>
                    <Input
                      id="phone"
                      className="h-12 rounded-2xl"
                      inputMode="tel"
                      autoComplete="tel"
                      {...form.register("phone")}
                    />
                    {form.formState.errors.phone?.message && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <Button
                    className="h-12 w-full rounded-2xl"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        در حال ساخت حساب...
                      </>
                    ) : (
                      <>
                        ثبت‌نام و ادامه
                        <ChevronRight className="mr-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <Separator />

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full rounded-2xl"
                    disabled={loading}
                    onClick={() => router.push("/login")}
                  >
                    قبلاً حساب دارم
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
