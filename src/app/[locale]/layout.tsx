import type { Metadata } from "next";
import { DEFAULT_LOCALE } from "@/lib/constants";
import { QueryProvider } from "@/components/shared/query-provider";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/toast";
import "../globals.css";

export const metadata: Metadata = {
  title: "GH-Store",
  description: "Premium digital marketplace for game top-ups, gift cards, and digital products",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRtl = locale === "ar";

  return (
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <QueryProvider>
            <Toaster />
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
