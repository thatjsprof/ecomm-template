import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createCoupon, deleteCoupon, getCoupons } from "@/services/api";
import type { Coupon } from "@/types";
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

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [percentage, setPercentage] = useState("10");
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
    try {
      await createCoupon({
        code,
        percentage: Number(percentage),
        expiresAt: new Date(expiresAt).toISOString(),
        active: true,
        maxRedemptions: redemptions,
      });
      toast.success("Coupon created");
      setOpen(false);
      setCode("");
      setPercentage("10");
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
          <p className="mt-1 text-sm text-neutral-500">Percentage discounts</p>
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
                <Label>Percentage</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
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
                {coupon.percentage}% off · {coupon.redemptionCount ?? 0}/
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
