"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { clearTokens, getMe, updateProfile } from "@/lib/auth-api";

const schema = z.object({
  username: z.string().optional().or(z.literal("")),
  phone: z.string().trim().min(1, "شماره موبایل الزامی است.").max(20),
  first_name: z.string().max(50).optional().or(z.literal("")),
  last_name: z.string().max(50).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .min(1, "ایمیل الزامی است.")
    .email("ایمیل معتبر نیست."),
});

type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      phone: "",
      first_name: "",
      last_name: "",
      email: "",
    },
    mode: "onTouched",
  });

  React.useEffect(() => {
    const access =
      typeof window !== "undefined" ? localStorage.getItem("access") : null;
    if (!access) {
      router.replace("/login");
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const me = await getMe();

        form.reset({
          username: me.username ?? "",
          phone: me.phone ?? "",
          first_name: me.first_name ?? "",
          last_name: me.last_name ?? "",
          email: me.email ?? "",
        });
      } catch (e: any) {
        const msg = e?.message ?? "خطا";
        setError(msg);
        if (msg.includes("وارد") || msg.includes("login")) {
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router, form]);

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setError(null);
    setOk(null);

    try {
      const updated = await updateProfile({
        first_name: values.first_name?.trim() || "",
        last_name: values.last_name?.trim() || "",
        email: values.email.trim(),
        phone: values.phone.trim(),
      });

      form.reset({
        username: updated.username ?? form.getValues("username") ?? "",
        phone: updated.phone ?? form.getValues("phone") ?? "",
        first_name: updated.first_name ?? "",
        last_name: updated.last_name ?? "",
        email: updated.email ?? "",
      });

      setOk("پروفایل با موفقیت ذخیره شد.");
    } catch (e: any) {
      setError(e?.message ?? "خطا");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    clearTokens();
    router.push("/login");
  }

  return (
    <div className="">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="mx-auto w-full max-w-xl">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">پروفایل</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                اطلاعات حساب شما. نام کاربری به‌صورت خودکار ساخته می‌شود و برای
                کاربران دیگر عمومی است، اما اطلاعات تماس فقط برای ادمین‌ها قابل
                مشاهده است.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                داشبورد
              </Button>
              <Button variant="outline" onClick={logout}>
                خروج
              </Button>
            </div>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">اطلاعات حساب</CardTitle>
              <CardDescription>
                ایمیل و شماره موبایل برای حساب شما الزامی است و فقط ادمین‌ها به
                آن‌ها دسترسی دارند.
              </CardDescription>
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

              {loading ? (
                <div className="space-y-3">
                  <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                  <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                  <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                </div>
              ) : (
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="username">نام کاربری</Label>
                    <Input
                      id="username"
                      readOnly
                      className="opacity-90"
                      {...form.register("username")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">شماره موبایل</Label>
                    <Input
                      id="phone"
                      className="opacity-90"
                      placeholder="09..."
                      {...form.register("phone")}
                    />
                    {form.formState.errors.phone?.message && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">نام</Label>
                      <Input
                        id="first_name"
                        {...form.register("first_name")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name">نام خانوادگی</Label>
                      <Input
                        id="last_name"
                        {...form.register("last_name")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">ایمیل</Label>
                    <Input
                      id="email"
                      inputMode="email"
                      placeholder="name@example.com"
                      {...form.register("email")}
                    />
                    {form.formState.errors.email?.message && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
