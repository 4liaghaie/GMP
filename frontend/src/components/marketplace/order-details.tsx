"use client";

import * as React from "react";
import {
  BadgeCheck,
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  User2,
} from "lucide-react";

import type {
  MarketplaceOrder,
  OrderGood,
} from "@/components/marketplace/orders-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBankBranch } from "@/lib/bankBranch";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "989307878446";
const WHATSAPP_MESSAGE = "سلام، درباره همین ثبت سفارش پیام می‌دهم.";

function formatNumLike(x: string | number | null | undefined) {
  if (x === null || x === undefined || x === "") return "—";
  const n = Number(x);
  if (!Number.isFinite(n)) return String(x);
  return new Intl.NumberFormat("fa-IR").format(n);
}

function safeText(x: unknown) {
  if (x === null || x === undefined || x === "") return "—";
  return String(x);
}

function formatExpireDate(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";

  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(raw);
  if (!match) return raw;

  const year = Number(match[1]);
  if (year < 1700) return raw;

  const date = new Date(year, Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return raw;

  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const jy = parts.find((part) => part.type === "year")?.value ?? "";
  const jm = parts.find((part) => part.type === "month")?.value ?? "";
  const jd = parts.find((part) => part.type === "day")?.value ?? "";

  return `${jy}/${jm}/${jd}`;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);

    onChange();
    media.addEventListener?.("change", onChange);

    return () => media.removeEventListener?.("change", onChange);
  }, [query]);

  return matches;
}

function buildWhatsAppLink(phone: string, text?: string) {
  const clean = String(phone || "").replace(/[^\d]/g, "");
  const msg = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${clean}${msg}`;
}

function KeyValue({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border bg-card p-3 text-right sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex items-center justify-start gap-2 text-xs text-muted-foreground">
        {icon ? (
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-muted">
            {icon}
          </span>
        ) : null}
        <span>{label}</span>
      </div>

      <div className="break-words text-right text-sm font-semibold tabular-nums sm:text-left">
        {value}
      </div>
    </div>
  );
}

function GoodMobileCard({ good }: { good: OrderGood }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="space-y-3 p-4 text-right">
        <div className="space-y-2">
          <div className="text-sm font-semibold leading-6">
            {safeText(good.description)}
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2">
            <Badge variant="outline" className="rounded-xl tabular-nums">
              HS: {safeText(good.hs_code)}
            </Badge>
            <Badge variant="secondary" className="rounded-xl">
              {safeText(good.goods_status)}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">ارزش</span>
          <span className="font-semibold tabular-nums">
            {formatNumLike(good.price ?? good.line_total)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function GoodsTable({ order }: { order: MarketplaceOrder }) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {order.goods?.length ? (
          order.goods.map((good) => (
            <GoodMobileCard key={good.uuid} good={good} />
          ))
        ) : (
          <div className="rounded-2xl border bg-muted/30 p-4 text-right text-sm text-muted-foreground">
            کالایی ثبت نشده است.
          </div>
        )}
      </div>

      <div className="hidden rounded-2xl border bg-card shadow-sm md:block">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold">اقلام کالا</div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {order.goods?.length
              ? `${formatNumLike(order.goods.length)} ردیف`
              : "بدون کالا"}
          </div>
        </div>

        <ScrollArea className="h-[48dvh]">
          <Table dir="rtl">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px] text-right">ردیف</TableHead>
                <TableHead className="w-[45%] text-right">شرح</TableHead>
                <TableHead className="text-right">HS</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="text-left">ارزش</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {order.goods?.length ? (
                order.goods.map((good, index) => (
                  <TableRow key={good.uuid}>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {formatNumLike(index + 1)}
                    </TableCell>

                    <TableCell className="text-right leading-6">
                      {safeText(good.description)}
                    </TableCell>

                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className="rounded-xl tabular-nums"
                      >
                        {safeText(good.hs_code)}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      {safeText(good.goods_status)}
                    </TableCell>

                    <TableCell className="text-left font-semibold tabular-nums">
                      {formatNumLike(good.price ?? good.line_total)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="text-right" colSpan={5}>
                    کالایی ثبت نشده است.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </>
  );
}

function SummaryCard({ order }: { order: MarketplaceOrder }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-start gap-2 text-right">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border bg-muted">
            <BadgeCheck className="h-4 w-4" />
          </span>

          <div>
            <div className="text-sm font-semibold">خلاصه مالی</div>
            <div className="text-xs text-muted-foreground">
              ارقام به {safeText(order.currency_type)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <KeyValue label="ارزش کالا" value={formatNumLike(order.total_value)} />
        <KeyValue
          label="کرایه حمل"
          value={formatNumLike(order.freight_price)}
        />
        <KeyValue label="نوع فی" value={safeText(order.fee_type)} />
        <KeyValue
          label="مبلغ فی (تومان)"
          value={formatNumLike(order.fee_amount)}
        />

        <Separator />

        <div className="rounded-2xl border bg-muted/40 p-3">
          <div className="flex flex-col gap-1 text-right sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">جمع کل</span>
            <span className="text-base font-bold tabular-nums">
              {formatNumLike(order.sub_total)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetaCard({
  order,
  visibleOrderNumber,
}: {
  order: MarketplaceOrder;
  visibleOrderNumber: string | null;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2 text-right">
        <div className="text-sm font-semibold">اطلاعات سفارش</div>
        <div className="text-xs text-muted-foreground">
          فقط فیلدهای فعال ثبت سفارش نمایش داده می‌شوند.
        </div>
      </CardHeader>

      <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
        <KeyValue
          label="فروشنده"
          value={safeText(order.user)}
          icon={<User2 className="h-4 w-4" />}
        />

        {order.applicant_name ? (
          <KeyValue
            label="متقاضی"
            value={safeText(order.applicant_name)}
            icon={<User2 className="h-4 w-4" />}
          />
        ) : null}

        {visibleOrderNumber ? (
          <KeyValue
            label="شماره ثبت سفارش"
            value={visibleOrderNumber}
            icon={<BadgeCheck className="h-4 w-4" />}
          />
        ) : null}

        <KeyValue label="شناسه" value={safeText(order.uuid)} />
        <KeyValue label="تامین ارز" value={safeText(order.currency_supply)} />
        <KeyValue label="بانک" value={safeText(order.bank_name)} />
        <KeyValue
          label="شعبه بانک"
          value={safeText(
            order.bank_branch_display || formatBankBranch(order.bank_branch),
          )}
        />
        <KeyValue
          label="ابزار پرداخت"
          value={safeText(order.payment_instrument)}
        />
        <KeyValue label="انقضا" value={formatExpireDate(order.expire_date)} />
      </CardContent>
    </Card>
  );
}

function ContactCard({ referenceText }: { referenceText: string }) {
  const displayPhone = WHATSAPP_NUMBER;
  const waLink = buildWhatsAppLink(
    WHATSAPP_NUMBER,
    `${WHATSAPP_MESSAGE}\nشناسه سفارش: ${referenceText}`,
  );

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2 text-right">
        <div className="text-sm font-semibold">ارتباط سریع</div>
        <div className="text-xs text-muted-foreground tabular-nums">
          واتساپ: {displayPhone}
        </div>
      </CardHeader>

      <CardContent className="grid gap-2">
        <Button asChild className="rounded-2xl">
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-row-reverse items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span>پیام واتساپ</span>
            <ExternalLink className="h-4 w-4 opacity-70" />
          </a>
        </Button>

        <Button asChild variant="outline" className="rounded-2xl">
          <a
            href={buildWhatsAppLink(WHATSAPP_NUMBER)}
            target="_blank"
            rel="noreferrer"
          >
            باز کردن چت
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function DetailsContent({
  order,
  copied,
  onCopy,
  visibleOrderNumber,
  referenceText,
}: {
  order: MarketplaceOrder;
  copied: boolean;
  onCopy: () => void;
  visibleOrderNumber: string | null;
  referenceText: string;
}) {
  return (
    <div dir="rtl" className="space-y-4 text-right">
      <Card className="overflow-hidden rounded-2xl shadow-sm before:block before:h-1 before:bg-slate-900 before:content-['']">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center justify-start gap-2">
                <Badge variant="secondary">ثبت سفارش</Badge>
                <Badge variant="outline">{safeText(order.currency_type)}</Badge>
                <Badge variant="outline" className="tabular-nums">
                  {order.goods?.length
                    ? `${formatNumLike(order.goods.length)} ردیف کالا`
                    : "بدون کالا"}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="break-all text-lg font-bold tabular-nums sm:text-xl">
                  {safeText(order.uuid)}
                </div>

                <div className="text-sm leading-6 text-muted-foreground">
                  <span>فروشنده: {safeText(order.user)}</span>
                  {order.applicant_name ? (
                    <>
                      <span className="mx-2">•</span>
                      <span>متقاضی: {safeText(order.applicant_name)}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
              <KeyValue
                label="ارزش کالا"
                value={formatNumLike(order.total_value)}
              />
              <KeyValue
                label="کرایه حمل"
                value={formatNumLike(order.freight_price)}
              />
              <KeyValue label="جمع کل" value={formatNumLike(order.sub_total)} />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-fit rounded-xl"
              onClick={onCopy}
            >
              {copied ? (
                <Check className="ms-2 h-4 w-4" />
              ) : (
                <Copy className="ms-2 h-4 w-4" />
              )}
              کپی شناسه
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="goods" className="w-full" dir="rtl">
        <div className="w-full overflow-x-auto pb-1">
          <TabsList className="flex min-w-max justify-start rounded-2xl md:w-auto">
            <TabsTrigger className="rounded-2xl px-5" value="goods">
              کالاها
            </TabsTrigger>
            <TabsTrigger className="rounded-2xl px-5" value="summary">
              مالی
            </TabsTrigger>
            <TabsTrigger className="rounded-2xl px-5" value="meta">
              اطلاعات
            </TabsTrigger>
            <TabsTrigger className="rounded-2xl px-5" value="contact">
              ارتباط
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="goods" className="mt-4">
          <GoodsTable order={order} />
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <SummaryCard order={order} />
        </TabsContent>

        <TabsContent value="meta" className="mt-4">
          <MetaCard order={order} visibleOrderNumber={visibleOrderNumber} />
        </TabsContent>

        <TabsContent value="contact" className="mt-4 max-w-md">
          <ContactCard referenceText={referenceText} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function OrderDetails({ order }: { order: MarketplaceOrder }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [copied, setCopied] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setIsAdmin((localStorage.getItem("role") || "") === "admin");
  }, []);

  const visibleOrderNumber = isAdmin ? safeText(order.order_number) : null;
  const referenceText = visibleOrderNumber || safeText(order.uuid);

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(String(referenceText));
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      setCopied(false);
    }
  }

  const content = (
    <DetailsContent
      order={order}
      copied={copied}
      onCopy={copyReference}
      visibleOrderNumber={visibleOrderNumber}
      referenceText={referenceText}
    />
  );

  if (isDesktop) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="cursor-pointer rounded-xl">
            جزئیات
          </Button>
        </DialogTrigger>

        <DialogContent
          dir="rtl"
          className={cn(
            "h-[90dvh] overflow-hidden p-0 text-right md:max-w-[1100px] md:rounded-2xl lg:max-w-[1200px]",
            "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
          )}
        >
          <div className="border-b bg-background">
            <DialogHeader className="p-5 text-right">
              <DialogTitle className="text-right text-lg">
                جزئیات ثبت سفارش
              </DialogTitle>
              <DialogDescription className="text-right">
                کالاها، خلاصه مالی و اطلاعات فعال سفارش
              </DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="h-[calc(90dvh-92px)]">
            <div className="p-5">{content}</div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="cursor-pointer rounded-xl">
          جزئیات
        </Button>
      </SheetTrigger>

      <SheetContent
        dir="rtl"
        side="bottom"
        className={cn(
          "h-[92dvh] overflow-hidden rounded-t-2xl p-0 text-right",
          "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
        )}
      >
        <div className="border-b bg-background">
          <SheetHeader className="p-4 text-right">
            <SheetTitle className="break-all text-right text-lg tabular-nums">
              ثبت سفارش {safeText(order.uuid)}
            </SheetTitle>
            <SheetDescription className="text-right">
              کالاها، خلاصه مالی و اطلاعات فعال سفارش
            </SheetDescription>
          </SheetHeader>
        </div>

        <ScrollArea className="h-[calc(92dvh-154px)]">
          <div className="p-4">{content}</div>
        </ScrollArea>

        <div className="sticky bottom-0 z-10 border-t bg-background/95 p-4 backdrop-blur">
          <SheetClose asChild>
            <Button className="w-full rounded-2xl" variant="outline">
              بستن
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
