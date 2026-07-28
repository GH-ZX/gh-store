import { notFound } from "next/navigation";
import { ProductService } from "@/lib/services/product.service";
import { ProductDetailClient } from "./product-detail-client";

/**
 * Product detail page — server component.
 * Fetches the product by slug and related products from the same category.
 */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isRtl = locale === "ar";

  const product = await ProductService.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch related products from the same category (excluding current product)
  const categoryProducts = await ProductService.getProducts({
    categorySlug: product.categorySlug,
  });
  const relatedProducts = categoryProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
      locale={locale}
      isRtl={isRtl}
    />
  );
}
