import { ProductService } from "@/lib/services/product.service";
import { StoreClient } from "./store-client";

/**
 * Store listing page — server component.
 * Fetches all active products + categories and passes them as initial data.
 */
export default async function StorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
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
    />
  );
}
