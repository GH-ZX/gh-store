"use client";

import { useParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  confirmLabel?: string;
  confirmLabelAr?: string;
  cancelLabel?: string;
  cancelLabelAr?: string;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  titleAr,
  description,
  descriptionAr,
  confirmLabel,
  confirmLabelAr,
  cancelLabel,
  cancelLabelAr,
  variant = "default",
}: ConfirmDialogProps) {
  const params = useParams<{ locale: string }>();
  const isRtl = params?.locale === "ar";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isRtl && titleAr ? titleAr : title || (isRtl ? "تأكيد" : "Confirm")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isRtl && descriptionAr
              ? descriptionAr
              : description || (isRtl ? "هل أنت متأكد؟" : "Are you sure?")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {isRtl && cancelLabelAr ? cancelLabelAr : cancelLabel || (isRtl ? "إلغاء" : "Cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {isRtl && confirmLabelAr
              ? confirmLabelAr
              : confirmLabel || (isRtl ? "تأكيد" : "Confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
