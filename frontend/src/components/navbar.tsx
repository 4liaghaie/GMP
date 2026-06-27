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
  LogIn,
  UserPlus,
  LogOut,
  Home,
  Bell,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  getNotifications,
  markNotificationRead,
  type UserNotification,
} from "@/lib/auth-api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

type MobileGroup = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  links: MobileLink[];
};

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [authed, setAuthed] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<UserNotification[]>(
    [],
  );

  // ✅ keep authed in sync in the SAME tab + other tabs
  React.useEffect(() => {
    const sync = () => setAuthed(hasToken());

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

  // ✅ Mobile navigation structure (easy to extend later)
  const mobileGroups: MobileGroup[] = [
    {
      id: "general",
      title: "عمومی",
      icon: <Home className="h-4 w-4" />,
      links: [
        {
          href: "/",
          label: "خانه",
          icon: <Home className="h-4 w-4" />,
          auth: "any",
        },
      ],
    },
    {
      id: "account",
      title: "حساب کاربری",
      icon: <User className="h-4 w-4" />,
      links: [
        {
          href: "/login",
          label: "ورود",
          icon: <LogIn className="h-4 w-4" />,
          auth: "guest",
        },
        {
          href: "/register",
          label: "ثبت‌نام",
          icon: <UserPlus className="h-4 w-4" />,
          auth: "guest",
        },
        {
          href: "/dashboard",
          label: "داشبورد",
          icon: <LayoutDashboard className="h-4 w-4" />,
          auth: "authed",
        },
        {
          href: "/profile",
          label: "پروفایل",
          icon: <User className="h-4 w-4" />,
          auth: "authed",
        },
        {
          href: "/notifications",
          label: unreadCount ? `اعلان‌ها (${unreadCount})` : "اعلان‌ها",
          icon: <Bell className="h-4 w-4" />,
          auth: "authed",
        },
      ],
    },
  ];

  const canShow = (auth: MobileLink["auth"]) => {
    if (auth === "any" || !auth) return true;
    if (auth === "authed") return authed;
    if (auth === "guest") return !authed;
    return true;
  };

  const recentNotifications = notifications.slice(0, 5);

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
    <header className="sticky top-0 z-50 border-b bg-background/30 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Left: Brand */}
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border bg-white/20">
            <Image
              src="/logo2.png"
              alt="Logo"
              fill
              className="object-contain p-1"
              priority
            />
          </div>

          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">GMP</p>
            <p className="truncate text-xs text-muted-foreground max-sm:hidden">
              Gomrok Marketplace
            </p>
          </div>
        </Link>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />

          {!authed ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">ورود</Link>
              </Button>
              <Button asChild variant="default" size="sm">
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
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Accordion Panel */}
      <div
        id="mobile-nav"
        className={["md:hidden border-t", open ? "block" : "hidden"].join(" ")}
      >
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Accordion type="multiple" className="w-full">
            {mobileGroups.map((group) => {
              const visibleLinks = group.links.filter((l) => canShow(l.auth));
              if (visibleLinks.length === 0) return null;

              return (
                <AccordionItem key={group.id} value={group.id}>
                  <AccordionTrigger className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {group.icon}
                      <span className="text-sm">{group.title}</span>
                    </span>
                  </AccordionTrigger>

                  <AccordionContent>
                    <div className="grid gap-1 pb-1">
                      {visibleLinks.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          className={[
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                            "hover:bg-accent hover:text-accent-foreground",
                            pathname === l.href ? "bg-accent/60" : "",
                          ].join(" ")}
                        >
                          {l.icon}
                          <span>{l.label}</span>
                        </Link>
                      ))}

                      {authed && (
                        <button
                          type="button"
                          onClick={logout}
                          className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                        >
                          <LogOut className="h-4 w-4" />
                          خروج
                        </button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
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
