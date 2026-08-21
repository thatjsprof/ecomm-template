import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createCoupon, deleteCoupon, getCoupons } from "@/services/api";
import type { Coupon, CouponDiscountType } from "@/types";
import { couponDiscountLabel } from "@/lib/coupon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DISCOUNT_TYPES: { value: CouponDiscountType; label: string }[] = [
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FIXED", label: "Fixed amount" },
];

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<CouponDiscountType>("PERCENTAGE");
  const [amount, setAmount] = useState("10");
  const [maxRedemptions, setMaxRedemptions] = useState("100");
  const [expiresAt, setExpiresAt] = useState("");

  async function load() {
    const res = await getCoupons();
    setCoupons(res.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSave() {
    const redemptions = Number(maxRedemptions);
    if (!Number.isInteger(redemptions) || redemptions < 1) {
      toast.error("Enter a valid number of redemptions");
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid discount amount");
      return;
    }
    if (discountType === "PERCENTAGE" && value > 100) {
      toast.error("Percentage cannot exceed 100");
      return;
    }
    try {
      await createCoupon({
        code,
        discountType,
        amount: value,
        expiresAt: new Date(expiresAt).toISOString(),
        active: true,
        maxRedemptions: redemptions,
      });
      toast.success("Coupon created");
      setOpen(false);
      setCode("");
      setDiscountType("PERCENTAGE");
      setAmount("10");
      setMaxRedemptions("100");
      setExpiresAt("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create coupon");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete coupon?")) return;
    try {
      await deleteCoupon(id);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Coupons</h1>
          <p className="mt-1 text-sm text-neutral-500">Percentage or fixed-amount discounts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button>Add coupon</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Code</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Discount type</Label>
                <Select
                  value={discountType}
                  onValueChange={(value) => {
                    if (value === "PERCENTAGE" || value === "FIXED") {
                      setDiscountType(value);
                    }
                  }}
                  items={DISCOUNT_TYPES}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCOUNT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{discountType === "FIXED" ? "Amount" : "Percentage"}</Label>
                <Input
                  type="number"
                  min={discountType === "FIXED" ? 0.01 : 1}
                  max={discountType === "PERCENTAGE" ? 100 : undefined}
                  step={discountType === "FIXED" ? "0.01" : "1"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Number of redemptions</Label>
                <Input
                  type="number"
                  min={1}
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Expires at</Label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <Button onClick={onSave} className="w-full">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 space-y-3">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3"
          >
            <div>
              <p className="font-medium">{coupon.code}</p>
              <p className="text-xs text-neutral-500">
                {couponDiscountLabel(coupon)} · {coupon.redemptionCount ?? 0}/
                {coupon.maxRedemptions} redemptions
                {" · "}
                expires {new Date(coupon.expiresAt).toLocaleDateString()}
                {(coupon.redemptionCount ?? 0) >= coupon.maxRedemptions
                  ? " · limit reached"
                  : ""}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onDelete(coupon.id)}>
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
