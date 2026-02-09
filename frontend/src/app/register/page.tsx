// src/app/register/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Loader2, LockKeyhole, UserRound } from "lucide-react";

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
    username: z.string().min(3, "نام کاربری حداقل ۳ کاراکتر است").max(150),
    password: z.string().min(8, "رمز عبور حداقل ۸ کاراکتر است").max(128),
    password2: z.string().min(8, "تکرار رمز عبور حداقل ۸ کاراکتر است").max(128),
    first_name: z.string().max(50).optional().or(z.literal("")),
    last_name: z.string().max(50).optional().or(z.literal("")),
    email: z.string().email("ایمیل معتبر نیست").optional().or(z.literal("")),
    phone: z.string().max(20).optional().or(z.literal("")),
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

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
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
        username: values.username.trim(),
        password: values.password,
        password2: values.password2,
        first_name: values.first_name?.trim() || undefined,
        last_name: values.last_name?.trim() || undefined,
        email: values.email?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
      });

      localStorage.setItem("access", res.access);
      localStorage.setItem("refresh", res.refresh);
      localStorage.setItem("role", res.role);

      setOk("ثبت‌نام با موفقیت انجام شد.");
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.message ?? "خطا");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className=" overflow-x-hidden">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-[-140px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-[-120px] top-[120px] h-[320px] w-[320px] rounded-full bg-foreground/10 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-120px] h-[340px] w-[340px] rounded-full bg-primary/10 blur-3xl" />
        </div>

        <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 lg:grid-cols-2 lg:items-start">
          {/* Left panel */}
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
                  نام کاربری / رمز عبور
                </Badge>
              </div>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                یک نام کاربری و رمز عبور انتخاب کنید. اطلاعات پروفایل اختیاری
                است و بعداً هم قابل ویرایش خواهد بود.
              </p>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border bg-muted/30 px-4 py-4">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border bg-background">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">رمز قوی</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    حداقل ۸ کاراکتر. ترجیحاً ترکیبی از حروف، اعداد و نمادها.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Right card */}
          <section className="order-1 lg:order-2">
            <Card className="rounded-3xl border bg-background/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl">ثبت‌نام</CardTitle>
                  <Badge variant="outline">
                    <span className="inline-flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      ایجاد حساب
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
                  <div className="space-y-2">
                    <Label htmlFor="username">نام کاربری</Label>
                    <Input
                      id="username"
                      className="h-12 rounded-2xl"
                      placeholder="مثال: milad"
                      autoComplete="username"
                      {...form.register("username")}
                      onChange={(e) => {
                        resetMessages();
                        form.setValue("username", e.target.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                    {form.formState.errors.username?.message && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">رمز عبور</Label>
                      <Input
                        id="password"
                        className="h-12 rounded-2xl"
                        type="password"
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
                      {form.formState.errors.password?.message && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password2">تکرار رمز عبور</Label>
                      <Input
                        id="password2"
                        className="h-12 rounded-2xl"
                        type="password"
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
                      <Label htmlFor="first_name">نام (اختیاری)</Label>
                      <Input
                        id="first_name"
                        className="h-12 rounded-2xl"
                        {...form.register("first_name")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">نام خانوادگی (اختیاری)</Label>
                      <Input
                        id="last_name"
                        className="h-12 rounded-2xl"
                        {...form.register("last_name")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">ایمیل (اختیاری)</Label>
                    <Input
                      id="email"
                      className="h-12 rounded-2xl"
                      inputMode="email"
                      {...form.register("email")}
                    />
                    {form.formState.errors.email?.message && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">موبایل (اختیاری)</Label>
                    <Input
                      id="phone"
                      className="h-12 rounded-2xl"
                      inputMode="tel"
                      {...form.register("phone")}
                    />
                  </div>

                  <Button
                    className="h-12 w-full rounded-2xl"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        در حال ثبت‌نام...
                      </>
                    ) : (
                      <>
                        ثبت‌نام و ورود
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
                    قبلاً حساب دارم (ورود)
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              با ادامه، قوانین و شرایط استفاده را می‌پذیرید.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
