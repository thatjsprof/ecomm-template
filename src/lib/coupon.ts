import type { CouponDiscountType } from "@/types";
import { formatPrice } from "@/utils/format";

export function couponDiscount(
  coupon: { discountType: CouponDiscountType; amount: string | number },
  subtotal: number
): number {
  const amount = Number(coupon.amount);
  if (!Number.isFinite(amount) || amount <= 0 || subtotal <= 0) return 0;
  if (coupon.discountType === "FIXED") {
    return Math.min(amount, subtotal);
  }
  return Math.min((subtotal * amount) / 100, subtotal);
}

export function couponDiscountLabel(coupon: {
  discountType: CouponDiscountType;
  amount: string | number;
}): string {
  if (coupon.discountType === "FIXED") {
    return `${formatPrice(coupon.amount)} off`;
  }
  return `${Number(coupon.amount)}% off`;
}
