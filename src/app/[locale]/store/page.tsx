import { ProductService } from "@/lib/services/product.service";
import { StoreClient } from "./store-client";

/**
 * Store listing page — server component.
 * Fetches all active products + categories and passes them as initial data.
 */
export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { locale } = await params;
  const { q, type } = await searchParams;
  const isRtl = locale === "ar";

  const [products, categories] = await Promise.all([
    ProductService.getProducts(),
    ProductService.getCategories(),
  ]);

  return (
    <StoreClient
      locale={locale}
      isRtl={isRtl}
      initialProducts={products}
      initialCategories={categories}
      initialSearchQuery={q || ""}
      initialType={type || ""}
    />
  );
}
