"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Star, ShoppingCart, Check, Shield, Truck, ArrowLeft, ArrowRight, Gamepad2, Gift } from "lucide-react";
import { ProductGrid } from "@/components/store/product-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StoreProduct } from "@/hooks/use-products";
import { toGridProduct } from "@/lib/data/to-grid-product";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

interface ProductDetailClientProps {
  product: StoreProduct;
  relatedProducts: StoreProduct[];
  locale: string;
  isRtl: boolean;
}

/** A catalogue item from metadata for topup products */
interface CatalogueOption {
  id: number;
  name: string;
  amount: number;
}

/** An amount option from metadata for gift_card products */
interface AmountOption {
  id: number;
  title: string;
  unit_price: number;
  face_value: number | null;
  stock: number;
}

export function ProductDetailClient({ product, relatedProducts, locale, isRtl }: ProductDetailClientProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [addedToCart, setAddedToCart] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const isTopup = product.type === "topup";
  const isGiftCard = product.type === "gift_card";

  // ─── Extract metadata ─────────────────────────────
  const catalogue = useMemo<CatalogueOption[]>(() => {
    if (!isTopup || !product.metadata?.catalogue) return [];
    return (product.metadata.catalogue as CatalogueOption[]).sort((a, b) => a.amount - b.amount);
  }, [isTopup, product.metadata]);

  const amounts = useMemo<AmountOption[]>(() => {
    if (!isGiftCard || !product.metadata?.amounts) return [];
    return (product.metadata.amounts as AmountOption[]).sort((a, b) => a.unit_price - b.unit_price);
  }, [isGiftCard, product.metadata]);

  const dynamicFields = useMemo(() => {
    if (!isTopup || !product.metadata?.fields) return [];
    return product.metadata.fields as Array<{
      key: string;
      labelAr: string;
      labelEn: string;
      type: string;
      required: boolean;
      options?: string[];
    }>;
  }, [isTopup, product.metadata]);

  // ─── Selected catalogue item (for topup) ──────────
  const [selectedCatalogueIdx, setSelectedCatalogueIdx] = useState<number>(0);
  const selectedItem = catalogue[selectedCatalogueIdx];

  // ─── Selected amount (for gift_card) ──────────────
  const [selectedAmountIdx, setSelectedAmountIdx] = useState<number>(0);
  const selectedAmount = amounts[selectedAmountIdx];

  // ─── Price ─────────────────────────────────────────
  const displayPrice = isTopup
    ? selectedItem?.amount ?? product.basePrice
    : isGiftCard
      ? selectedAmount?.unit_price ?? product.basePrice
      : product.basePrice;

  const displayOriginalPrice = isGiftCard
    ? selectedAmount?.face_value ?? product.originalPrice ?? undefined
    : product.originalPrice ?? undefined;

  const hasDiscount = displayOriginalPrice != null && displayOriginalPrice > displayPrice;

  // ─── Cart ID ───────────────────────────────────────
  const cartItemId = useMemo(() => {
    const parts = [product.id];
    if (isTopup && selectedItem) parts.push(`cata-${selectedItem.id}`);
    if (isGiftCard && selectedAmount) parts.push(`amt-${selectedAmount.id}`);
    const fieldHash = Object.values(fieldValues).filter(Boolean).join(":");
    if (fieldHash) parts.push(fieldHash);
    return parts.join("--");
  }, [product.id, isTopup, selectedItem, isGiftCard, selectedAmount, fieldValues]);

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddToCart = () => {
    const label = isTopup && selectedItem
      ? `${product.nameEn} - ${selectedItem.name}`
      : isGiftCard && selectedAmount
        ? `${product.nameEn} - ${selectedAmount.title}`
        : product.nameEn;

    // The variant id is what the server uses to price this line; unitPrice
    // below is for display only.
    const variantId = isTopup
      ? (selectedItem?.id != null ? String(selectedItem.id) : null)
      : isGiftCard
        ? (selectedAmount?.id != null ? String(selectedAmount.id) : null)
        : null;

    addItem({
      id: cartItemId,
      productId: product.id,
      name: isRtl ? `${product.nameAr}${selectedItem ? ` - ${selectedItem.name}` : ""}` : label,
      imageUrl: product.imageUrl,
      quantity: 1,
      unitPrice: displayPrice,
      totalPrice: displayPrice,
      variantId,
      fields: Object.keys(fieldValues).length > 0 ? fieldValues : undefined,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const hasOptions = catalogue.length > 0 || amounts.length > 0;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        {/* ─── Breadcrumb ───────────────────────────── */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
            {isRtl ? "الرئيسية" : "Home"}
          </Link>
          <span>/</span>
          <Link href={`/${locale}/store`} className="hover:text-foreground transition-colors">
            {isRtl ? "المتجر" : "Store"}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {isRtl ? product.nameAr : product.nameEn}
          </span>
        </nav>

        {/* ─── Game/Voucher Hero ────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl mb-10">
          <div className="relative aspect-[21/9] md:aspect-[3/1] bg-gradient-to-br from-primary/20 to-background flex items-center">
            {/* Background image */}
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-contain object-center opacity-30 md:opacity-20 pointer-events-none"
              />
            )}
            {/* Content */}
            <div className="relative z-10 px-8 md:px-16 lg:px-24">
              <Badge variant="secondary" className="w-fit mb-4 text-xs font-medium gap-1.5">
                {isTopup ? <Gamepad2 className="size-3" /> : <Gift className="size-3" />}
                {isRtl ? product.categoryAr : product.categoryEn}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-xl">
                {isRtl ? product.nameAr : product.nameEn}
              </h1>
              {(product.descriptionAr || product.descriptionEn) && (
                <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-lg line-clamp-2">
                  {isRtl ? product.descriptionAr : product.descriptionEn}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── Options + Purchase ───────────────────── */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Options list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Topup: Catalogue selection */}
            {isTopup && catalogue.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  {isRtl ? "اختر الكمية" : "Select Amount"}
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {catalogue.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedCatalogueIdx(idx)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all hover:shadow-md",
                        idx === selectedCatalogueIdx
                          ? "border-primary ring-1 ring-primary bg-primary/5"
                          : "hover:border-border",
                      )}
                    >
                      <p className="font-semibold text-lg">{item.name}</p>
                      <p className="text-2xl font-bold text-primary mt-1">
                        ${item.amount.toFixed(2)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* GiftCard: Amount selection */}
            {isGiftCard && amounts.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  {isRtl ? "اختر الفئة" : "Select Amount"}
                </h2>
                <div className="space-y-2">
                  {amounts.map((amt, idx) => {
                    const discount = amt.face_value != null && amt.face_value > amt.unit_price;
                    const pct = discount
                      ? Math.round(((amt.face_value! - amt.unit_price) / amt.face_value!) * 100)
                      : 0;
                    return (
                      <button
                        key={amt.id}
                        onClick={() => setSelectedAmountIdx(idx)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-md w-full text-left",
                          idx === selectedAmountIdx
                            ? "border-primary ring-1 ring-primary bg-primary/5"
                            : "hover:border-border",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex size-6 items-center justify-center rounded-full border-2 transition-colors",
                            idx === selectedAmountIdx
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30",
                          )}>
                            {idx === selectedAmountIdx && <Check className="size-3.5" />}
                          </div>
                          <div>
                            <p className="font-medium">{amt.title}</p>
                            {amt.stock >= 0 && amt.stock < 10 && (
                              <p className="text-xs text-destructive">
                                {isRtl ? `متبقي ${amt.stock} فقط` : `Only ${amt.stock} left`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">
                            ${amt.unit_price.toFixed(2)}
                          </p>
                          {discount && (
                            <p className="text-xs text-muted-foreground line-through">
                              ${amt.face_value!.toFixed(2)}
                              <span className="text-destructive mr-1.5 line-through-none">
                                -{pct}%
                              </span>
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No options available */}
            {!hasOptions && !isTopup && !isGiftCard && (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="size-12 mx-auto mb-3 opacity-30" />
                <p>{isRtl ? "لا توجد خيارات متاحة لهذا المنتج" : "No options available for this product"}</p>
              </div>
            )}

            {/* Dynamic Fields (for topup) */}
            {dynamicFields.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-lg mb-4">
                  {isRtl ? "معلومات الطلب" : "Order Information"}
                </h3>
                <div className="space-y-4 max-w-lg">
                  {dynamicFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={`field-${field.key}`}>
                        {isRtl ? field.labelAr : field.labelEn}
                        {field.required && <span className="mr-1 text-destructive">*</span>}
                      </Label>
                      {field.type === "select" ? (
                        <Select
                          value={fieldValues[field.key] || ""}
                          onValueChange={(v) => v && handleFieldChange(field.key, v)}
                        >
                          <SelectTrigger id={`field-${field.key}`}>
                            <SelectValue placeholder={isRtl ? "اختر..." : "Select..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {(field.options || ["server-1", "server-2", "server-3"]).map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={`field-${field.key}`}
                          type="text"
                          placeholder={isRtl ? `أدخل ${field.labelAr}` : `Enter ${field.labelEn}`}
                          value={fieldValues[field.key] || ""}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Purchase card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border bg-card p-6 space-y-5">
              {/* Price */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  {isRtl ? "السعر" : "Price"}
                </p>
                <p className="text-4xl font-bold text-primary">
                  ${displayPrice.toFixed(2)}
                </p>
                {hasDiscount && (
                  <>
                    <p className="text-lg text-muted-foreground line-through mt-1">
                      ${displayOriginalPrice!.toFixed(2)}
                    </p>
                    <Badge variant="destructive" className="mt-2">
                      {isRtl
                        ? `وفر $${(displayOriginalPrice! - displayPrice).toFixed(2)}`
                        : `Save $${(displayOriginalPrice! - displayPrice).toFixed(2)}`}
                    </Badge>
                  </>
                )}
              </div>

              {/* Selected item info */}
              {isTopup && selectedItem && (
                <div className="text-center text-sm text-muted-foreground border-t pt-4">
                  {isRtl ? "الكمية المختارة:" : "Selected amount:"}{" "}
                  <span className="font-semibold text-foreground">{selectedItem.name}</span>
                </div>
              )}
              {isGiftCard && selectedAmount && (
                <div className="text-center text-sm text-muted-foreground border-t pt-4">
                  {isRtl ? "البطاقة المختارة:" : "Selected card:"}{" "}
                  <span className="font-semibold text-foreground">{selectedAmount.title}</span>
                </div>
              )}

              {/* Add to Cart */}
              <Button
                size="lg"
                className={cn(
                  "w-full gap-2 transition-all text-base",
                  addedToCart && "bg-green-600 hover:bg-green-600",
                )}
                onClick={handleAddToCart}
                disabled={!hasOptions && !(isTopup || isGiftCard)}
              >
                {addedToCart ? (
                  <>
                    <Check className="size-5" />
                    {isRtl ? "تمت الإضافة!" : "Added!"}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="size-5" />
                    {isRtl ? "أضف إلى السلة" : "Add to Cart"}
                  </>
                )}
              </Button>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 border-t pt-4">
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <Shield className="size-5 text-primary" />
                  <span className="text-[11px] text-muted-foreground">
                    {isRtl ? "دفع آمن" : "Secure"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <Truck className="size-5 text-primary" />
                  <span className="text-[11px] text-muted-foreground">
                    {isRtl ? "توصيل فوري" : "Instant"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <Check className="size-5 text-primary" />
                  <span className="text-[11px] text-muted-foreground">
                    {isRtl ? "مضمون" : "Guaranteed"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Reviews Section ───────────────────────── */}
        {product.reviewCount && product.reviewCount > 0 && product.rating ? (
          <section className="mt-16 border-t pt-12">
            <h2 className="text-2xl font-bold tracking-tight mb-8">
              {isRtl ? "التقييمات" : "Customer Reviews"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {generatedReviews.slice(0, 3).map((review, i) => (
                <div key={i} className="rounded-xl border p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={cn("size-3.5",
                          j < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {isRtl ? review.contentAr : review.contentEn}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">— {review.author}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ─── Related Products ──────────────────────── */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 border-t pt-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {isRtl ? "منتجات مشابهة" : "Related Products"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRtl ? "قد تعجبك هذه المنتجات أيضاً" : "You might also like these products"}
                </p>
              </div>
              <Link href={`/${locale}/store`}>
                <Button variant="ghost" size="sm" className="gap-1">
                  {isRtl ? "عرض الكل" : "View All"}
                  {isRtl ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
                </Button>
              </Link>
            </div>
            <ProductGrid products={relatedProducts.map(toGridProduct)} columns={4} />
          </section>
        )}
      </div>
    </main>
  );
}

// ─── Generated Reviews for Demo ──────────────────────────
interface Review {
  author: string;
  rating: number;
  contentAr: string;
  contentEn: string;
  date: string;
}

const generatedReviews: Review[] = [
  { author: "Ahmed M.", rating: 5, contentAr: "توصيل سريع جداً! استلمت الطلب فوراً بعد الدفع. خدمة ممتازة.", contentEn: "Very fast delivery! Received immediately after payment. Excellent service.", date: "2 days ago" },
  { author: "Sara K.", rating: 4, contentAr: "منتج جيد وسعر مناسب. أنصح بالتعامل معهم.", contentEn: "Good product at a fair price. I recommend dealing with them.", date: "1 week ago" },
  { author: "Mohammed A.", rating: 5, contentAr: "أفضل موقع لشحن الألعاب. أسعار منافسة ودعم ممتاز.", contentEn: "Best site for game top-ups. Competitive prices and great support.", date: "2 weeks ago" },
  { author: "Layla H.", rating: 5, contentAr: "اشتريت عدة مرات ولم أواجه أي مشكلة. موقع موثوق.", contentEn: "I've bought multiple times with no issues. Trustworthy site.", date: "3 weeks ago" },
  { author: "Khalid R.", rating: 4, contentAr: "سريع وسهل. سأطلب مرة أخرى بالتأكيد.", contentEn: "Fast and easy. I'll definitely order again.", date: "1 month ago" },
];
