// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "GMP",
  description: "پلتفرم ارتباط دارندگان ثبت سفارش و دارندگان کالا در گمرک",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className="h-full">
      <body className="min-h-screen h-full font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div
            className="flex min-h-screen flex-col
        bg-[radial-gradient(500px_circle_at_15%_10%,color-mix(in_oklch,var(--color-primary)_18%,transparent)_0%,transparent_55%),radial-gradient(900px_circle_at_85%_0%,color-mix(in_oklch,var(--color-primary)_10%,transparent)_0%,transparent_60%),linear-gradient(to_bottom,var(--color-background),color-mix(in_oklch,var(--color-background)_92%,black_8%))]
        dark:bg-[radial-gradient(1200px_circle_at_15%_10%,color-mix(in_oklch,var(--color-primary)_22%,transparent)_0%,transparent_55%),radial-gradient(900px_circle_at_85%_0%,color-mix(in_oklch,var(--color-primary)_14%,transparent)_0%,transparent_60%),linear-gradient(to_bottom,var(--color-background),color-mix(in_oklch,var(--color-background)_88%,white_6%))]"
          >
            <SiteHeader />

            <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-10">
              {children}
            </main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
