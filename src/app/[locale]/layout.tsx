import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/components/shared/auth-provider";
import { QueryProvider } from "@/components/shared/query-provider";
import { Toaster } from "@/components/ui/toast";
import { DEFAULT_LOCALE } from "@/lib/constants";
import { ThemeProvider } from "@/lib/theme";
import type { Metadata } from "next";
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
      <body className="flex min-h-screen flex-col bg-background font-sans antialiased">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
