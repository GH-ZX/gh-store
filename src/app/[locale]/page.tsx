import { APP_NAME } from "@/lib/constants";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRtl = locale === "ar";

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background px-4 pb-24 pt-16 md:pt-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {isRtl ? "سوقك الرقمي الموثوق" : "Your Trusted Digital Marketplace"}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              {isRtl
                ? "توب أب، بطاقات هدايا، رموز تفعيل، تراخيص برامج، واشتراكات رقمية"
                : "Game top-ups, gift cards, redeem codes, software licenses, and digital subscriptions"}
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href={`/${locale}/store`}
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-all hover:bg-primary/90 hover:shadow-lg"
              >
                {isRtl ? "تسوق الآن" : "Shop Now"}
              </a>
              <a
                href={`/${locale}/how-it-works`}
                className="inline-flex h-12 items-center justify-center rounded-lg border border-input bg-background px-8 text-sm font-medium transition-all hover:bg-accent"
              >
                {isRtl ? "كيف يعمل" : "How It Works"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group rounded-xl border bg-card p-6 transition-all hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold">{feature.title(isRtl)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description(isRtl)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const features = [
  {
    icon: "⚡",
    title: (rtl: boolean) => (rtl ? "توصيل فوري" : "Instant Delivery"),
    description: (rtl: boolean) =>
      rtl
        ? "احصل على منتجاتك الرقمية فورًا بعد الدفع"
        : "Receive your digital products instantly after payment",
  },
  {
    icon: "🔒",
    title: (rtl: boolean) => (rtl ? "دفع آمن" : "Secure Payment"),
    description: (rtl: boolean) =>
      rtl ? "بوابات دفع موثوقة ومشفرة بالكامل" : "Trusted, fully encrypted payment gateways",
  },
  {
    icon: "🎮",
    title: (rtl: boolean) => (rtl ? "آلاف المنتجات" : "Thousands of Products"),
    description: (rtl: boolean) =>
      rtl
        ? "أكبر تشكيلة من التوب أب والبطاقات الرقمية"
        : "The largest selection of top-ups and digital cards",
  },
  {
    icon: "💬",
    title: (rtl: boolean) => (rtl ? "دعم متواصل" : "24/7 Support"),
    description: (rtl: boolean) =>
      rtl ? "فريق دعم جاهز لمساعدتك في أي وقت" : "Support team ready to help you anytime",
  },
  {
    icon: "🏷️",
    title: (rtl: boolean) => (rtl ? "أفضل الأسعار" : "Best Prices"),
    description: (rtl: boolean) =>
      rtl ? "أسعار تنافسية مع تحديث يومي" : "Competitive prices updated daily",
  },
  {
    icon: "🌐",
    title: (rtl: boolean) => (rtl ? "منتجات عالمية" : "Global Products"),
    description: (rtl: boolean) =>
      rtl ? "منتجات رقمية من جميع أنحاء العالم" : "Digital products from around the world",
  },
] as const;
