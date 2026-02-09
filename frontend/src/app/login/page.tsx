// src/app/login/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronRight,
  Loader2,
  LockKeyhole,
  Shield,
  UserRound,
} from "lucide-react";

import { login } from "@/lib/auth-api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const schema = z.object({
  username: z.string().min(3, "نام کاربری حداقل ۳ کاراکتر است").max(150),
  password: z.string().min(8, "رمز عبور حداقل ۸ کاراکتر است").max(128),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();

  React.useEffect(() => {
    const access = localStorage.getItem("access");
    if (access) router.replace("/dashboard");
  }, [router]);

  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
    mode: "onTouched",
  });

  function resetMessages() {
    setError(null);
    setMessage(null);
  }

  async function onSubmit(values: FormData) {
    setLoading(true);
    resetMessages();

    try {
      const res = await login({
        username: values.username.trim(),
        password: values.password,
      });

      localStorage.setItem("access", res.access);
      localStorage.setItem("refresh", res.refresh);
      localStorage.setItem("role", res.role);

      setMessage("ورود با موفقیت انجام شد.");
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
          <div className="absolute right-[-120px] top-[140px] h-[320px] w-[320px] rounded-full bg-foreground/10 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-120px] h-[340px] w-[340px] rounded-full bg-primary/10 blur-3xl" />
        </div>

        <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 lg:grid-cols-2 lg:items-start">
          {/* Left panel */}
          <section className="order-2 space-y-4 lg:order-1">
            <div className="rounded-3xl border bg-background/70 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">ورود به پنل</p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight">
                    ورود با نام کاربری و رمز عبور
                  </h1>
                </div>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  حساب کاربری
                </Badge>
              </div>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                برای ورود، نام کاربری و رمز عبور خود را وارد کنید. پس از ورود
                می‌توانید اطلاعات پروفایل را در بخش حساب کاربری ویرایش کنید.
              </p>

              <div className="mt-5 grid gap-3">
                <div className="flex items-start gap-3 rounded-2xl border bg-muted/30 px-4 py-4">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border bg-background">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">امنیت</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      از رمزهای قوی و منحصربه‌فرد استفاده کنید.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border bg-muted/30 px-4 py-4">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border bg-background">
                    <LockKeyhole className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">حریم خصوصی</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      اطلاعات شما فقط برای احراز هویت استفاده می‌شود.
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
                  <CardTitle className="text-xl">ورود</CardTitle>
                  <Badge variant="outline">نام کاربری / رمز عبور</Badge>
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

                  <div className="space-y-2">
                    <Label htmlFor="password">رمز عبور</Label>
                    <Input
                      id="password"
                      className="h-12 rounded-2xl"
                      type="password"
                      autoComplete="current-password"
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

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-2xl"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        در حال ورود...
                      </>
                    ) : (
                      <>
                        ورود
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
                    onClick={() => router.push("/register")}
                  >
                    حساب ندارم (ثبت‌نام)
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
