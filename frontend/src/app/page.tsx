// src/app/page.tsx (or src/app/landing/page.tsx)
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="relative">
      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        {/* Hero */}
        <section className="grid gap-6 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              نسخه اولیه • سریع، شفاف، قابل پیگیری
            </div>

            <h1 className="text-3xl font-bold leading-tight md:text-5xl">
              اتصال دارندگان <span className="text-primary">ثبت‌سفارش</span> به
              دارندگان <span className="text-primary">کالا</span> در گمرک
            </h1>

            <p className="text-base leading-7 text-muted-foreground md:text-lg">
              یک پلتفرم دوطرفه برای هماهنگی سریع‌تر، کاهش خواب سرمایه، و ایجاد
              مسیر مذاکره و توافق شفاف بین طرفین.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/login">شروع</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/marketplace">مشاهده ثبت سفارش‌ها</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
              <div className="rounded-xl border bg-card p-3">
                <p className="text-sm font-semibold">شفافیت</p>
                <p className="text-xs text-muted-foreground">
                  ثبت پیشنهاد و توافق
                </p>
              </div>
              <div className="rounded-xl border bg-card p-3">
                <p className="text-sm font-semibold">سرعت</p>
                <p className="text-xs text-muted-foreground">
                  مچینگ هوشمند اولیه
                </p>
              </div>
              <div className="rounded-xl border bg-card p-3">
                <p className="text-sm font-semibold">پیگیری</p>
                <p className="text-xs text-muted-foreground">تاریخچه و گزارش</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span className="rounded-full border bg-card px-2 py-1">
                بدون افشای اطلاعات حساس
              </span>
              <span className="rounded-full border bg-card px-2 py-1">
                مناسب برای مذاکره B2B
              </span>
              <span className="rounded-full border bg-card px-2 py-1">
                قابل استفاده روی موبایل
              </span>
            </div>
          </div>

          {/* Right column card */}
          <div className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>دو مسیر اصلی</CardTitle>
                <CardDescription>
                  هر طرف یک پروفایل می‌سازد، نیاز/دارایی را ثبت می‌کند، سپس با
                  پیشنهادهای هدفمند وارد مذاکره می‌شود.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">دارندگان ثبت‌سفارش</p>
                    <Badge variant="secondary">خریدار/متقاضی</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    نیاز به کالای مشخص داخل گمرک دارند و می‌خواهند با
                    تأمین‌کنندگان معتبر وارد مذاکره شوند.
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">دارندگان کالا</p>
                    <Badge variant="secondary">فروشنده/دارنده</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    کالا در اختیار دارند و برای ترخیص/تکمیل فرآیند، به ثبت‌سفارش
                    متناظر نیاز دارند.
                  </p>
                </div>

                <Separator />

                <div className="grid gap-3 sm:grid-cols-2">
                  <Card className="border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        ثبت نیاز / ثبت کالا
                      </CardTitle>
                      <CardDescription>
                        فرم ساده + جزئیات قابل پیگیری
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm leading-6 text-muted-foreground">
                      اطلاعات کلیدی مثل HSCode، وزن/ارزش، مبدأ، شرایط تحویل و
                      وضعیت مدارک ثبت می‌شود تا پیشنهادها دقیق‌تر شوند.
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        پیشنهاد و مذاکره
                      </CardTitle>
                      <CardDescription>شفاف، مستند، مرحله‌ای</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm leading-6 text-muted-foreground">
                      طرفین روی یک پیشنهاد (قیمت/کارمزد/شرایط) توافق می‌کنند و
                      وضعیت هر مرحله ثبت می‌شود تا اختلاف و ابهام کم شود.
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild className="w-full" size="lg">
                    <Link href="/register">ساخت حساب و شروع</Link>
                  </Button>
                </div>

                <p className="text-xs leading-6 text-muted-foreground">
                  نکته: این صفحه برای معرفی سرویس است. در نسخه‌های بعدی، «مچینگ»
                  بر اساس HSCode، کشور مبدأ، بازه ارزش و زمان ثبت تقویت می‌شود.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-10 md:mt-14">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold md:text-2xl">
                چطور کار می‌کند؟
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                فرآیند ساده ۳ مرحله‌ای برای رسیدن به توافق.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">۱) ثبت اطلاعات</CardTitle>
                <CardDescription>نیاز یا کالا را وارد کنید</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                حداقل اطلاعات لازم را ثبت کنید تا در لیست‌ها نمایش داده شوید و
                امکان پیشنهاد گرفتن/دادن داشته باشید.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">۲) پیدا کردن تطابق</CardTitle>
                <CardDescription>فیلتر و جستجو</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                با فیلترهای اصلی (کالا/HSCode، کشور، بازه ارزش، تاریخ) موارد
                نزدیک را پیدا کنید.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">۳) پیشنهاد و توافق</CardTitle>
                <CardDescription>ثبت مرحله‌ای</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                پیشنهاد ارسال کنید، مذاکره کنید، و نتیجه را با وضعیت‌های روشن
                ثبت کنید تا قابلیت پیگیری حفظ شود.
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
