"use client";

import * as React from "react";
import {
  BadgeCheck,
  Check,
  Copy,
  ExternalLink,
  FileText,
  MessageCircle,
  PackageSearch,
  Route,
  User2,
} from "lucide-react";

import type {
  GoodsNeed,
  ProformaGood,
} from "@/components/marketplace/needs-list";
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
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "00989307878446";
const WHATSAPP_MESSAGE = "سلام، درباره همین پروفرما پیام می‌دهم.";

function formatNumLike(x: string | number | null | undefined) {
  if (x === null || x === undefined || x === "") return "—";

  const n = Number(x);
  if (!Number.isFinite(n)) return String(x);

  return new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: 2,
  }).format(n);
}

function safeText(x: unknown) {
  if (x === null || x === undefined || x === "") return "—";
  return String(x);
}

function lineTotal(good: ProformaGood) {
  const quantity = Number(good.quantity ?? 0);
  const price = Number(good.price ?? 0);

  if (!Number.isFinite(quantity) || !Number.isFinite(price)) return 0;

  return quantity * price;
}

function goodsTotal(need: GoodsNeed) {
  return (need.goods || []).reduce((sum, good) => sum + lineTotal(good), 0);
}

function buildWhatsAppLink(phone: string, text?: string) {
  const clean = String(phone || "").replace(/[^\d]/g, "");
  const msg = text ? `?text=${encodeURIComponent(text)}` : "";

  return `https://wa.me/${clean}${msg}`;
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

function GoodMobileCard({ good }: { good: ProformaGood }) {
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

            <Badge variant="outline" className="rounded-xl">
              {safeText(good.manufacturer_country)}
            </Badge>

            <Badge variant="secondary" className="rounded-xl">
              {safeText(good.goods_status)}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <KeyValue
            label="مقدار"
            value={`${formatNumLike(good.quantity)} ${safeText(good.unit)}`}
          />

          <KeyValue label="قیمت" value={formatNumLike(good.price)} />

          <KeyValue label="NW" value={formatNumLike(good.nw_kg)} />

          <KeyValue label="GW" value={formatNumLike(good.gw_kg)} />
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border bg-muted/40 px-3 py-2 text-right text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">جمع ردیف</span>

          <span className="font-bold tabular-nums">
            {formatNumLike(lineTotal(good))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function GoodsTable({ need }: { need: GoodsNeed }) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {need.goods?.length ? (
          need.goods.map((good, index) => (
            <GoodMobileCard key={good.uuid || index} good={good} />
          ))
        ) : (
          <div className="rounded-2xl border bg-muted/30 p-4 text-right text-sm text-muted-foreground">
            کالایی ثبت نشده است.
          </div>
        )}
      </div>

      <div className="hidden rounded-2xl border bg-card shadow-sm md:block">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold">اقلام پروفرما</div>

          <div className="text-xs text-muted-foreground tabular-nums">
            {need.goods?.length
              ? `${formatNumLike(need.goods.length)} ردیف`
              : "بدون کالا"}
          </div>
        </div>

        <ScrollArea className="h-[48dvh]">
          <Table dir="rtl">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px] text-right">ردیف</TableHead>
                <TableHead className="w-[32%] text-right">شرح</TableHead>
                <TableHead className="text-right">HS</TableHead>
                <TableHead className="text-right">کشور سازنده</TableHead>
                <TableHead className="text-right">مقدار</TableHead>
                <TableHead className="text-left">قیمت</TableHead>
                <TableHead className="text-left">جمع</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {need.goods?.length ? (
                need.goods.map((good, index) => (
                  <TableRow key={good.uuid || index}>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {formatNumLike(index + 1)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="font-medium leading-6">
                        {safeText(good.description)}
                      </div>

                      <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        <span>وضعیت: {safeText(good.goods_status)}</span>
                        <span className="mx-1">•</span>
                        <span>NW: {formatNumLike(good.nw_kg)}</span>
                        <span className="mx-1">•</span>
                        <span>GW: {formatNumLike(good.gw_kg)}</span>
                      </div>
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
                      {safeText(good.manufacturer_country)}
                    </TableCell>

                    <TableCell className="text-right tabular-nums">
                      {formatNumLike(good.quantity)} {safeText(good.unit)}
                    </TableCell>

                    <TableCell className="text-left tabular-nums">
                      {formatNumLike(good.price)}
                    </TableCell>

                    <TableCell className="text-left font-semibold tabular-nums">
                      {formatNumLike(lineTotal(good))}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="text-right" colSpan={7}>
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

function SummaryCard({ need }: { need: GoodsNeed }) {
  const total = goodsTotal(need);
  const freight = Number(need.freight_price ?? 0);
  const subtotal = total + (Number.isFinite(freight) ? freight : 0);

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
              ارقام به {safeText(need.currency_type)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <KeyValue label="ارزش کالا" value={formatNumLike(total)} />

        <KeyValue label="کرایه حمل" value={formatNumLike(need.freight_price)} />

        <KeyValue label="نوع فی" value={safeText(need.fee_type)} />

        <KeyValue label="مبلغ فی" value={formatNumLike(need.fee_amount)} />

        <Separator />

        <div className="rounded-2xl border bg-muted/40 p-3">
          <div className="flex flex-col gap-1 text-right sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">جمع کل</span>

            <span className="text-base font-bold tabular-nums">
              {formatNumLike(subtotal)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetaCard({ need }: { need: GoodsNeed }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2 text-right">
        <div className="text-sm font-semibold">اطلاعات پروفرما</div>

        <div className="text-xs text-muted-foreground">
          اطلاعات مبدا، مرز، گمرک و حمل
        </div>
      </CardHeader>

      <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
        <KeyValue
          label="فروشنده"
          value={safeText(need.user)}
          icon={<User2 className="h-4 w-4" />}
        />

        <KeyValue label="شناسه" value={safeText(need.uuid)} />

        <KeyValue label="وضعیت پروفرما" value={safeText(need.status)} />

        <KeyValue label="کشور مبدا" value={safeText(need.country_of_origin)} />

        <KeyValue label="مرز ورودی" value={safeText(need.entry_border)} />

        <KeyValue label="گمرک" value={safeText(need.customs)} />

        <KeyValue
          label="روش حمل"
          value={safeText(need.means_of_transport)}
          icon={<Route className="h-4 w-4" />}
        />

        <KeyValue
          label="حمل به دفعات"
          value={need.partial_shipment ? "بله" : "خیر"}
        />

        {need.terms_of_delivery ? (
          <KeyValue
            label="شرایط تحویل"
            value={safeText(need.terms_of_delivery)}
          />
        ) : null}

        {need.terms_of_payment ? (
          <KeyValue
            label="شرایط پرداخت"
            value={safeText(need.terms_of_payment)}
          />
        ) : null}

        {need.proforma_file ? (
          <Button
            asChild
            variant="outline"
            className="rounded-2xl sm:col-span-2"
          >
            <a
              href={need.proforma_file}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-row-reverse items-center justify-center gap-2"
            >
              <FileText className="h-4 w-4" />
              <span>مشاهده فایل پروفرما</span>
              <ExternalLink className="h-4 w-4 opacity-70" />
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ContactCard({ referenceText }: { referenceText: string }) {
  const waLink = buildWhatsAppLink(
    WHATSAPP_NUMBER,
    `${WHATSAPP_MESSAGE}\nشناسه پروفرما: ${referenceText}`,
  );

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2 text-right">
        <div className="text-sm font-semibold">ارتباط سریع</div>

        <div className="text-xs text-muted-foreground tabular-nums">
          واتساپ: {WHATSAPP_NUMBER}
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
  need,
  copied,
  onCopy,
  referenceText,
}: {
  need: GoodsNeed;
  copied: boolean;
  onCopy: () => void;
  referenceText: string;
}) {
  return (
    <div dir="rtl" className="space-y-4 text-right">
      <Card className="overflow-hidden rounded-2xl shadow-sm before:block before:h-1 before:bg-amber-600 before:content-['']">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center justify-start gap-2">
                <Badge variant="secondary">پروفرما</Badge>

                <Badge variant="outline">{safeText(need.status)}</Badge>

                <Badge variant="outline">{safeText(need.currency_type)}</Badge>

                <Badge variant="outline" className="tabular-nums">
                  {need.goods?.length
                    ? `${formatNumLike(need.goods.length)} ردیف کالا`
                    : "بدون کالا"}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="break-all text-lg font-bold tabular-nums sm:text-xl">
                  {safeText(need.uuid)}
                </div>

                <div className="text-sm leading-6 text-muted-foreground">
                  <span>فروشنده: {safeText(need.user)}</span>
                  <span className="mx-2">•</span>
                  <span>مرز: {safeText(need.entry_border)}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
              <KeyValue
                label="ارزش کالا"
                value={formatNumLike(goodsTotal(need))}
              />

              <KeyValue
                label="کرایه حمل"
                value={formatNumLike(need.freight_price)}
              />

              <KeyValue
                label="کالاها"
                value={formatNumLike(need.goods?.length || 0)}
                icon={<PackageSearch className="h-4 w-4" />}
              />
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
          <GoodsTable need={need} />
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <SummaryCard need={need} />
        </TabsContent>

        <TabsContent value="meta" className="mt-4">
          <MetaCard need={need} />
        </TabsContent>

        <TabsContent value="contact" className="mt-4 max-w-md">
          <ContactCard referenceText={referenceText} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProformaDetails({ need }: { need: GoodsNeed }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [copied, setCopied] = React.useState(false);
  const referenceText = safeText(need.uuid);

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
      need={need}
      copied={copied}
      onCopy={copyReference}
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
                جزئیات پروفرما
              </DialogTitle>

              <DialogDescription className="text-right">
                کالاها، خلاصه مالی و اطلاعات حمل پروفرما
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
              پروفرما {safeText(need.uuid)}
            </SheetTitle>

            <SheetDescription className="text-right">
              کالاها، خلاصه مالی و اطلاعات حمل پروفرما
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
