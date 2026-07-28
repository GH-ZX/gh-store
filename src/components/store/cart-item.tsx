"use client";

import { useParams } from "next/navigation";
import { Trash2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/stores/cart-store";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const params = useParams<{ locale: string }>();
  const isRtl = params?.locale === "ar";

  return (
    <div className="hover:bg-muted/30 flex items-start gap-4 rounded-xl border p-4 transition-colors">
      {/* Product image placeholder */}
      <div className="bg-muted flex size-16 shrink-0 items-center justify-center rounded-lg">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="size-full rounded-lg object-cover" />
        ) : (
          <div className="text-muted-foreground/30 text-xs">{isRtl ? "صورة" : "Image"}</div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium">{item.name}</h4>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-7 shrink-0"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        {/* Fields */}
        {item.fields && Object.keys(item.fields).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(item.fields).map(([key, value]) => (
              <span
                key={key}
                className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs"
              >
                {key}: {value}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          {/* Quantity controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1}
            >
              <Minus className="size-3" />
            </Button>
            <span className="flex h-7 w-8 items-center justify-center text-sm font-medium tabular-nums">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            >
              <Plus className="size-3" />
            </Button>
          </div>

          {/* Price */}
          <span className="text-sm font-bold">${item.totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
