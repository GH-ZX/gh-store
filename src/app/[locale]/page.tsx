import { ProductService } from "@/lib/services/product.service";
import { HomepageClient } from "./homepage-client";

/**
 * Homepage — server component that fetches data and passes to the client component.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRtl = locale === "ar";

  // Fetch data server-side
  const [featuredProducts, categories] = await Promise.all([
    ProductService.getFeaturedProducts(),
    ProductService.getCategories(),
  ]);

  return (
    <HomepageClient
      locale={locale}
      isRtl={isRtl}
      initialFeatured={featuredProducts}
      initialCategories={categories}
    />
  );
}
