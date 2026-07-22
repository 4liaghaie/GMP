"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  User,
  LogOut,
  Home,
  Bell,
  Boxes,
  ClipboardList,
  CircleHelp,
  FilePlus2,
  Info,
  PackageSearch,
  Store,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  getNotifications,
  markNotificationRead,
  type UserNotification,
} from "@/lib/auth-api";
import { notificationTargetHref } from "@/lib/notification-links";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const AUTH_EVENT = "auth-changed";

function hasToken() {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("access"));
}

function emitAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

type MobileLink = {
  href: string;
  label: string;
  icon?: React.ReactNode;
  auth?: "authed" | "guest" | "any";
};

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [authed, setAuthed] = React.useState(false);
  const [role, setRole] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<UserNotification[]>(
    [],
  );

  // ✅ keep authed in sync in the SAME tab + other tabs
  React.useEffect(() => {
    const sync = () => {
      setAuthed(hasToken());
      setRole(localStorage.getItem("role") || "");
    };

    // initial
    sync();

    // other tabs/windows (storage fires only across tabs)
    window.addEventListener("storage", sync);

    // same tab (we dispatch this manually after login/logout)
    window.addEventListener(AUTH_EVENT, sync as EventListener);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(AUTH_EVENT, sync as EventListener);
    };
  }, []);

  React.useEffect(() => {
    if (!authed) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    let cancelled = false;
    getNotifications({ unread: true })
      .then((items) => {
        if (!cancelled) {
          setNotifications(items);
          setUnreadCount(items.filter((item) => !item.read).length);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotifications([]);
          setUnreadCount(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authed, pathname]);

  // close menu on route change
  React.useEffect(() => setOpen(false), [pathname]);

  // close on Esc
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");

    localStorage.removeItem("otp_step");
    localStorage.removeItem("otp_phone");
    localStorage.removeItem("reg_otp_step");
    localStorage.removeItem("reg_otp_phone");

    setAuthed(false);
    setOpen(false);

    // ✅ notify navbar (and any other listeners) immediately
    emitAuthChanged();

    if (
      pathname?.startsWith("/dashboard") ||
      pathname?.startsWith("/profile")
    ) {
      router.push("/");
    } else {
      // optional: if you depend on server components that read cookies/session
      router.refresh();
    }
  }

  const recentNotifications = notifications.slice(0, 5);
  const desktopLinks = [
    { href: "/", label: "خانه" },
    { href: authed ? "/marketplace" : "/login", label: "فرصت‌های همکاری" },
    { href: authed ? "/add-need" : "/login", label: "ثبت کالا" },
    { href: authed ? "/add-order" : "/login", label: "ثبت سفارش" },
    { href: "/how-it-works", label: "نحوه کار" },
    { href: "/about", label: "درباره ما" },
  ];
  const publicMobileLinks: MobileLink[] = [
    { href: "/", label: "خانه", icon: <Home className="h-5 w-5" /> },
    {
      href: "/how-it-works",
      label: "نحوه کار",
      icon: <CircleHelp className="h-5 w-5" />,
    },
    {
      href: "/about",
      label: "درباره ما",
      icon: <Info className="h-5 w-5" />,
    },
  ];
  const accountMobileLinks: MobileLink[] = [
    {
      href: "/dashboard",
      label: "داشبورد",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: "/my-orders",
      label: "ثبت سفارش‌های من",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      href: "/my-needs",
      label: "بارهای من",
      icon: <Boxes className="h-5 w-5" />,
    },
    {
      href: "/profile",
      label: "پروفایل",
      icon: <User className="h-5 w-5" />,
    },
    {
      href: "/notifications",
      label: unreadCount ? `اعلان‌ها (${unreadCount})` : "اعلان‌ها",
      icon: <Bell className="h-5 w-5" />,
    },
  ];
  const mobileQuickActions: MobileLink[] = [
    {
      href: "/marketplace",
      label: "بازار ثبت سفارش",
      icon: <Store className="h-5 w-5" />,
    },
    {
      href: "/marketplace/needs",
      label: "بازار بار",
      icon: <PackageSearch className="h-5 w-5" />,
    },
    {
      href: "/add-order",
      label: "ثبت سفارش جدید",
      icon: <FilePlus2 className="h-5 w-5" />,
    },
    {
      href: "/add-need",
      label: "ثبت باری جدید",
      icon: <Boxes className="h-5 w-5" />,
    },
  ];

  async function markRead(id: number) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch {
      // Keep the overlay quiet; the full notifications page can show failures.
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 text-[#092e54] shadow-[0_8px_30px_-28px_rgba(8,40,73,.55)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07182c]/90 dark:text-white">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-5 px-4 lg:px-8">
        {/* Left: Brand */}
        <Link href="/" className="flex min-w-0 items-center gap-3 md:order-3">
          <div className="relative h-12 w-14 shrink-0 overflow-hidden">
            <Image
              src="/logo2.png"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="min-w-0 leading-tight">
            <p className="truncate text-base font-black tracking-[.18em]">
              GMP
            </p>
            <p className="truncate text-[9px] font-medium tracking-wide text-slate-500 max-sm:hidden dark:text-slate-400">
              CUSTOMS MARKETPLACE
            </p>
          </div>
        </Link>

        <nav
          className="order-2 hidden flex-1 items-center justify-center gap-1 lg:flex"
          aria-label="ناوبری اصلی"
        >
          {desktopLinks.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className={[
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-[#e9f8f9] hover:text-[#078e9d] dark:hover:bg-white/5",
                pathname === link.href
                  ? "text-[#078e9d]"
                  : "text-[#173c60] dark:text-slate-200",
              ].join(" ")}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="order-1 hidden items-center gap-2 md:flex">
          <ThemeToggle />

          {!authed ? (
            <>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-10 min-w-20 rounded-lg border-[#0a4774]/35 bg-transparent text-[#0a3158] dark:text-white"
              >
                <Link href="/login">ورود</Link>
              </Button>
              <Button
                asChild
                variant="default"
                size="sm"
                className="h-10 min-w-20 rounded-lg bg-[#078e9d] hover:bg-[#087d89]"
              >
                <Link href="/register">ثبت‌نام</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">داشبورد</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/profile">پروفایل</Link>
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative gap-2">
                    <Bell className="h-4 w-4" />
                    اعلان‌ها
                    {unreadCount ? (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-none text-destructive-foreground">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0" dir="rtl">
                  <div className="border-b p-3">
                    <div className="font-semibold">اعلان‌ها</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {unreadCount
                        ? `${unreadCount} اعلان خوانده‌نشده`
                        : "اعلان خوانده‌نشده ندارید"}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-auto p-2">
                    {recentNotifications.length ? (
                      recentNotifications.map((item) => (
                        <div
                          key={item.id}
                          className={[
                            "rounded-xl border p-3 text-sm",
                            !item.read ? "bg-muted/60" : "bg-background",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium">{item.title}</span>
                            {!item.read ? (
                              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                                جدید
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                            {item.message}
                          </p>
                          {!item.read ? (
                            <button
                              type="button"
                              onClick={() => markRead(item.id)}
                              className="mt-2 text-xs font-medium text-primary hover:underline"
                            >
                              خواندم
                            </button>
                          ) : null}
                          <Link
                            href={notificationTargetHref(item, role)}
                            className="mr-3 mt-2 inline-block text-xs font-medium text-primary hover:underline"
                          >
                            مشاهده مورد
                          </Link>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        اعلانی وجود ندارد.
                      </div>
                    )}
                  </div>
                  <div className="border-t p-2">
                    <Button asChild className="w-full rounded-xl" size="sm">
                      <Link href="/notifications">مشاهده همه اعلان‌ها</Link>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="sm" onClick={logout}>
                خروج
              </Button>
            </>
          )}
        </div>

        {/* Mobile: theme + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          {authed ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-label="اعلان‌ها"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount ? (
                    <span className="absolute -left-1 -top-1 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] leading-none text-destructive-foreground">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0" dir="rtl">
                <div className="border-b p-3">
                  <div className="font-semibold">اعلان‌ها</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {unreadCount
                      ? `${unreadCount} اعلان خوانده‌نشده`
                      : "اعلان خوانده‌نشده ندارید"}
                  </div>
                </div>
                <div className="max-h-80 overflow-auto p-2">
                  {recentNotifications.length ? (
                    recentNotifications.map((item) => (
                      <div
                        key={item.id}
                        className={[
                          "rounded-xl border p-3 text-sm",
                          !item.read ? "bg-muted/60" : "bg-background",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium">{item.title}</span>
                          {!item.read ? (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                              جدید
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                          {item.message}
                        </p>
                        {!item.read ? (
                          <button
                            type="button"
                            onClick={() => markRead(item.id)}
                            className="mt-2 text-xs font-medium text-primary hover:underline"
                          >
                            خواندم
                          </button>
                        ) : null}
                        <Link
                          href={notificationTargetHref(item, role)}
                          className="mr-3 mt-2 inline-block text-xs font-medium text-primary hover:underline"
                        >
                          مشاهده مورد
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      اعلانی وجود ندارد.
                    </div>
                  )}
                </div>
                <div className="border-t p-2">
                  <Button asChild className="w-full rounded-xl" size="sm">
                    <Link href="/notifications">مشاهده همه اعلان‌ها</Link>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            aria-label="باز کردن منو"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          dir="rtl"
          className="top-0 bottom-0 left-0 right-auto h-dvh w-[min(88vw,390px)] max-w-none grid-rows-[auto_1fr] translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-y-0 border-r-0 p-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left md:hidden"
        >
          <div className="flex items-center justify-between border-b bg-[#072f53] px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="relative h-11 w-12 overflow-hidden rounded-xl bg-white">
                <Image
                  src="/logo2.png"
                  alt="GMP"
                  fill
                  className="object-contain p-1"
                />
              </span>
              <div>
                <DialogTitle className="text-right text-base font-black">
                  منوی GMP
                </DialogTitle>
                <p className="mt-1 text-[11px] text-white/60">
                  Customs Marketplace Platform
                </p>
              </div>
            </div>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hover:text-white"
                aria-label="بستن منو"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background">
            <div className="space-y-6 p-4">
              {authed ? (
                <div className="rounded-2xl border border-[#078e9d]/20 bg-[#eef9fa] p-4 dark:bg-[#078e9d]/10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#078e9d] text-white">
                        <User className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-black">حساب کاربری</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          به GMP خوش آمدید
                        </p>
                      </div>
                    </div>
                    {unreadCount ? (
                      <span className="rounded-full bg-destructive px-2 py-1 text-[10px] font-bold text-white">
                        {unreadCount} اعلان
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#eef9fa] p-4 text-center dark:bg-[#078e9d]/10">
                  <p className="text-sm font-black">
                    برای مشاهده بازار وارد شوید
                  </p>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    دسترسی به فرصت‌ها پس از ورود و تایید حساب امکان‌پذیر است.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 rounded-xl bg-background"
                    >
                      <Link href="/login">ورود</Link>
                    </Button>
                    <Button
                      asChild
                      className="h-10 rounded-xl bg-[#078e9d] hover:bg-[#087d89]"
                    >
                      <Link href="/register">ثبت‌نام</Link>
                    </Button>
                  </div>
                </div>
              )}

              {authed ? (
                <section>
                  <p className="mb-3 px-1 text-xs font-bold text-muted-foreground">
                    دسترسی سریع
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {mobileQuickActions.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex min-h-24 flex-col items-start justify-between rounded-2xl border bg-card p-3 text-sm font-bold shadow-sm transition-colors hover:border-[#078e9d]/40 hover:bg-[#eef9fa] dark:hover:bg-[#078e9d]/10"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e7f7f8] text-[#078e9d] dark:bg-[#078e9d]/15">
                          {link.icon}
                        </span>
                        <span>{link.label}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {authed ? (
                <section>
                  <p className="mb-2 px-1 text-xs font-bold text-muted-foreground">
                    حساب من
                  </p>
                  <nav className="space-y-1">
                    {accountMobileLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={[
                          "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
                          pathname === link.href
                            ? "bg-[#e7f7f8] text-[#078e9d] dark:bg-[#078e9d]/15"
                            : "hover:bg-muted/50",
                        ].join(" ")}
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </Link>
                    ))}
                  </nav>
                </section>
              ) : null}

              <section>
                <p className="mb-2 px-1 text-xs font-bold text-muted-foreground">
                  راهنما
                </p>
                <nav className="space-y-1">
                  {publicMobileLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={[
                        "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
                        pathname === link.href
                          ? "bg-[#e7f7f8] text-[#078e9d] dark:bg-[#078e9d]/15"
                          : "hover:bg-muted/50",
                      ].join(" ")}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </nav>
              </section>
            </div>

            {authed ? (
              <div className="mt-auto border-t p-4">
                <button
                  type="button"
                  onClick={logout}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 text-sm font-bold text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" /> خروج از حساب
                </button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}

/**
 * ✅ Use this helper in your login/register code AFTER setting tokens:
 *
 *   localStorage.setItem("access", access);
 *   localStorage.setItem("refresh", refresh);
 *   localStorage.setItem("role", role);
 *   window.dispatchEvent(new Event("auth-changed"));
 *
 */
