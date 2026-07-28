"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

export interface DynamicField {
  key: string;
  labelAr: string;
  labelEn: string;
  type: "text" | "number" | "email" | "password" | "select" | "uid" | "server" | "region";
  isRequired: boolean;
  placeholderAr?: string;
  placeholderEn?: string;
  options?: { label: string; value: string }[];
}

interface CheckoutFormProps {
  fields: DynamicField[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  isSubmitting: boolean;
  className?: string;
}

/**
 * Builds a Zod schema dynamically from an array of DynamicField definitions.
 * Each field becomes a zod.string() that is either required or optional.
 */
function buildSchema(fields: DynamicField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    const base = z.string();
    shape[field.key] = field.isRequired
      ? base.min(1, `${field.labelEn} is required`)
      : base.optional();
  }

  return z.object(shape);
}

export function CheckoutForm({ fields, onSubmit, isSubmitting, className }: CheckoutFormProps) {
  const params = useParams<{ locale: string }>();
  const isRtl = params?.locale === "ar";

  // Rebuild schema whenever fields change
  const schema = useMemo(() => buildSchema(fields), [fields]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema) as any,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
      {fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key}>
            {isRtl ? field.labelAr : field.labelEn}
            {field.isRequired && <span className="mr-1 text-destructive">*</span>}
          </Label>

          {field.type === "select" ? (
            <Select>
              <SelectTrigger id={field.key}>
                <SelectValue
                  placeholder={isRtl ? field.placeholderAr : field.placeholderEn}
                />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={field.key}
              type={field.type === "password" ? "password" : "text"}
              placeholder={isRtl ? field.placeholderAr : field.placeholderEn}
              {...register(field.key)}
              className={errors[field.key] ? "border-destructive" : ""}
            />
          )}

          {errors[field.key] && (
            <p className="text-xs text-destructive">
              {errors[field.key]?.message as string}
            </p>
          )}
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        {isRtl ? "تأكيد الطلب" : "Place Order"}
      </Button>
    </form>
  );
}
