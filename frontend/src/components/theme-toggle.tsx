"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [animating, setAnimating] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const current = mounted
    ? theme === "system"
      ? resolvedTheme
      : theme
    : "light";
  const isDark = current === "dark";

  function toggle() {
    if (!mounted) return;
    setAnimating(true);
    setTheme(isDark ? "light" : "dark");
    window.setTimeout(() => setAnimating(false), 650);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label="تغییر تم"
      className={[
        "relative h-10 w-10 overflow-hidden rounded-2xl",
        "border-border/60 bg-background/60 backdrop-blur",
        "hover:bg-muted/40 transition-colors",
        animating ? "bulb-pop" : "",
      ].join(" ")}
    >
      {/* Centered glow (only in light mode) */}
      <span
        aria-hidden
        className={[
          "pointer-events-none absolute left-1/2 top-1/2",
          "-translate-x-1/2 -translate-y-1/2",
          "h-16 w-16 rounded-full",
          "opacity-0 transition-opacity duration-300",
          !isDark ? "opacity-100" : "opacity-0",
          "bulb-glow",
        ].join(" ")}
      />

      {/* Sparks (brief on toggle) */}
      <span
        aria-hidden
        className={[
          "pointer-events-none absolute inset-0",
          animating ? "bulb-sparks" : "",
        ].join(" ")}
      >
        <span className="bulb-spark" style={{ ["--a" as any]: "20deg" }} />
        <span className="bulb-spark" style={{ ["--a" as any]: "110deg" }} />
        <span className="bulb-spark" style={{ ["--a" as any]: "200deg" }} />
        <span className="bulb-spark" style={{ ["--a" as any]: "290deg" }} />
      </span>

      {/* Bulb icon */}
      <span className="relative">
        <Lightbulb
          className={[
            "h-5 w-5 transition-colors duration-200",
            isDark ? "text-foreground/85" : "text-primary",
            animating ? "bulb-wiggle" : "",
          ].join(" ")}
        />

        {/* Filament pulse (light mode only) */}
        <span
          aria-hidden
          className={[
            "pointer-events-none absolute left-1/2 top-[11px]",
            "-translate-x-1/2",
            "h-[2px] w-[10px] rounded-full",
            "opacity-0",
            !isDark ? "opacity-100" : "opacity-0",
            animating ? "bulb-filament" : "",
          ].join(" ")}
        />
      </span>
    </Button>
  );
}
