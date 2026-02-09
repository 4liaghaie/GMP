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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function hasToken() {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("access"));
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

  React.useEffect(() => {
    setAuthed(hasToken());

    const onStorage = () => setAuthed(hasToken());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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

    if (
      pathname?.startsWith("/dashboard") ||
      pathname?.startsWith("/profile")
    ) {
      router.push("/");
    } else {
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
        // add more public links here later
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
      ],
    },
  ];

  const canShow = (auth: MobileLink["auth"]) => {
    if (auth === "any" || !auth) return true;
    if (auth === "authed") return authed;
    if (auth === "guest") return !authed;
    return true;
  };

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
              <Button variant="outline" size="sm" onClick={logout}>
                خروج
              </Button>
            </>
          )}
        </div>

        {/* Mobile: theme + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
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
