import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import {
  createOrder,
  getAddresses,
  getMyOrders,
  getShippingOptions,
  initPayment,
  uploadPaymentReceipt,
  validateCoupon,
} from "@/services/api";
import { PageHead } from "@/components/seo/page-head";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/utils/format";
import { siteConfig } from "@/config/site";
import { NIGERIA, nigerianStateItems, preferredShippingOption, preferredShippingOptionId } from "@/lib/nigeria";
import { cn } from "@/lib/utils";
import type { SavedAddress, ShippingOption } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAYMENT_PROVIDERS = [
  {
    value: "korapay" as const,
    label: "Korapay",
    logo: "/payments/korapay.png",
  },
  ...(siteConfig.bankTransfer.enabled
    ? [
        {
          value: "bank_transfer" as const,
          label: "Bank Transfer",
          logo: null as string | null,
        },
      ]
    : []),
];

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  paymentProvider: z.enum(["korapay", "bank_transfer"]),
  shippingOptionId: z.string().min(1, "Shipping option is required"),
  couponCode: z.string().optional(),
  saveAddress: z.boolean().optional(),
  addressLabel: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function SavedAddressesSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  );
}

function AddressFieldsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

function ShippingOptionsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[4.5rem] w-full rounded-xl" />
      <Skeleton className="h-[4.5rem] w-full rounded-xl" />
    </div>
  );
}

function CheckoutPageSkeleton({ showSavedAddresses = false }: { showSavedAddresses?: boolean }) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
      <PageHead title="Checkout" noindex path="/checkout" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="mt-2 h-4 w-full max-w-md" />
      <div className="mt-10 grid gap-12 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          {showSavedAddresses && (
            <div>
              <Skeleton className="mb-3 h-4 w-16" />
              <SavedAddressesSkeleton />
            </div>
          )}
          <AddressFieldsSkeleton />
          <div>
            <Skeleton className="mb-3 h-4 w-20" />
            <ShippingOptionsSkeleton />
          </div>
        </div>
        <Skeleton className="h-96 self-start rounded-2xl lg:col-span-2" />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal, ready: cartReady, clearCart } = useCart();
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState("");
  const [guestCheckout, setGuestCheckout] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [shippingLoading, setShippingLoading] = useState(true);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [payerBank, setPayerBank] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
  const [submittingBank, setSubmittingBank] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentProvider: "korapay",
      country: NIGERIA,
      shippingOptionId: "",
      saveAddress: true,
      addressLabel: "",
    },
  });

  useEffect(() => {
    if (!cartReady) return;
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [cartReady, items, router]);

  useEffect(() => {
    let cancelled = false;
    setShippingLoading(true);

    getShippingOptions()
      .then((res) => {
        if (cancelled || !res.success || !res.data?.options?.length) return;
        setShippingOptions(res.data.options);
      })
      .catch(() => {
        toast.error("Could not load shipping options");
      })
      .finally(() => {
        if (!cancelled) setShippingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [setValue]);

  function applyAddress(row: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    email?: string;
  }) {
    if (row.name) setValue("name", row.name);
    if (row.email) setValue("email", row.email);
    if (row.phone) setValue("phone", row.phone);
    if (row.address) setValue("address", row.address);
    if (row.city) setValue("city", row.city);
    if (row.state) setValue("state", row.state);
    setValue("country", NIGERIA);
  }

  useEffect(() => {
    if (!user) {
      setAddressesLoading(false);
      setSavedAddresses([]);
      return;
    }

    setValue("name", user.name);
    setValue("email", user.email);
    setAddressesLoading(true);

    let cancelled = false;

    getAddresses()
      .then((res) => {
        if (cancelled) return;
        const list = res.data || [];
        setSavedAddresses(list);

        if (list.length > 0) {
          const preferred = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(preferred.id);
          applyAddress({ ...preferred, email: user.email });
          setValue("saveAddress", false);
          return;
        }

        setSelectedAddressId("new");

        // Fallback: last order address if address book is empty
        return getMyOrders().then((ordersRes) => {
          if (cancelled) return;
          const shipping = ordersRes.data?.[0]?.shippingAddress;
          if (!shipping) return;
          applyAddress(shipping);
        });
      })
      .catch(() => {
        /* ignore */
      })
      .finally(() => {
        if (!cancelled) setAddressesLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, setValue]);

  const shippingOptionId = watch("shippingOptionId");
  const paymentProvider = watch("paymentProvider");
  const saveAddress = watch("saveAddress");
  const selectedState = watch("state");
  const selectedPayment =
    PAYMENT_PROVIDERS.find((provider) => provider.value === paymentProvider) ||
    PAYMENT_PROVIDERS[0];
  const selectedShipping = selectedState
    ? preferredShippingOption(shippingOptions, selectedState)
    : null;

  useEffect(() => {
    if (shippingLoading) return;
    if (!selectedState) {
      if (shippingOptionId) setValue("shippingOptionId", "");
      return;
    }
    const nextId = preferredShippingOptionId(
      shippingOptions,
      selectedState,
      shippingOptionId
    );
    if (nextId !== shippingOptionId) {
      setValue("shippingOptionId", nextId, { shouldValidate: true });
    }
  }, [selectedState, shippingOptions, shippingLoading, shippingOptionId, setValue]);
  const shipping = selectedShipping?.price ?? 0;
  const total = Math.max(0, subtotal - discount + shipping);
  const showAccountPrompt = !authLoading && !user && !guestCheckout;
  const usingNewAddress = !user || selectedAddressId === "new";

  function selectSavedAddress(id: string) {
    setSelectedAddressId(id);
    if (id === "new") {
      setValue("phone", "");
      setValue("address", "");
      setValue("city", "");
      setValue("state", "");
      setValue("country", NIGERIA);
      setValue("name", user?.name || "");
      setValue("email", user?.email || "");
      setValue("saveAddress", true);
      return;
    }

    const row = savedAddresses.find((a) => a.id === id);
    if (!row || !user) return;
    applyAddress({ ...row, email: user.email });
    setValue("saveAddress", false);
  }

  async function applyCoupon() {
    const code = watch("couponCode");
    if (!code) return;
    try {
      const res = await validateCoupon(code);
      if (res.success && res.data) {
        setDiscount((subtotal * res.data.percentage) / 100);
        setCouponApplied(res.data.code);
        toast.success(`${res.data.percentage}% discount applied`);
      }
    } catch {
      toast.error("Invalid coupon");
      setDiscount(0);
      setCouponApplied("");
    }
  }

  async function onSubmit(values: FormData) {
    if (values.paymentProvider === "bank_transfer") {
      setTransferAmount((prev) => prev || String(total));
      setReceiptOpen(true);
      return;
    }

    try {
      const orderRes = await createOrder({
        items: items.map((i) => ({
          productId: i.product.id,
          variantId: i.variant?.id || null,
          quantity: i.quantity,
        })),
        shippingAddress: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          address: values.address,
          city: values.city,
          state: values.state,
          country: NIGERIA,
        },
        paymentProvider: values.paymentProvider,
        couponCode: couponApplied || undefined,
        shippingOptionId: values.shippingOptionId,
        saveAddress: Boolean(user && values.saveAddress),
        addressLabel: values.addressLabel || undefined,
      });

      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || "Failed to create order");
      }

      const paymentRes = await initPayment(values.paymentProvider, orderRes.data.id);
      if (!paymentRes.success || !paymentRes.data?.authorizationUrl) {
        throw new Error(paymentRes.message || "Failed to initialize payment");
      }

      window.location.href = paymentRes.data.authorizationUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    }
  }

  async function submitBankTransfer(values: FormData) {
    if (!receiptFile) {
      toast.error("Please upload your payment receipt");
      return;
    }
    if (!payerBank.trim()) {
      toast.error("Please enter the bank you transferred from");
      return;
    }
    const amountValue = Number(transferAmount);
    if (!transferAmount || !Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error("Please enter the amount transferred");
      return;
    }

    setSubmittingBank(true);
    try {
      const uploadRes = await uploadPaymentReceipt(receiptFile);
      if (!uploadRes.success || !uploadRes.data?.url) {
        throw new Error(uploadRes.message || "Failed to upload receipt");
      }

      const orderRes = await createOrder({
        items: items.map((i) => ({
          productId: i.product.id,
          variantId: i.variant?.id || null,
          quantity: i.quantity,
        })),
        shippingAddress: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          address: values.address,
          city: values.city,
          state: values.state,
          country: NIGERIA,
        },
        paymentProvider: "bank_transfer",
        couponCode: couponApplied || undefined,
        shippingOptionId: values.shippingOptionId,
        saveAddress: Boolean(user && values.saveAddress),
        addressLabel: values.addressLabel || undefined,
        paymentReceiptUrl: uploadRes.data.url,
        paymentPayerBank: payerBank.trim(),
        paymentAmount: amountValue,
        paymentNote: receiptNote.trim() || undefined,
      });

      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || "Failed to create order");
      }

      clearCart();
      setReceiptOpen(false);
      toast.success("Order submitted — awaiting payment confirmation");
      router.push(
        `/payment/pending?order=${encodeURIComponent(orderRes.data.orderNumber)}`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmittingBank(false);
    }
  }

  function copyAccountNumber() {
    void navigator.clipboard.writeText(siteConfig.bankTransfer.accountNumber);
    toast.success("Account number copied");
  }

  if (!cartReady || items.length === 0) {
    return <CheckoutPageSkeleton />;
  }

  if (authLoading) {
    return <CheckoutPageSkeleton showSavedAddresses />;
  }

  if (showAccountPrompt) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 lg:px-8">
        <PageHead title="Checkout" noindex path="/checkout" />
        <h1 className="font-display text-4xl text-neutral-900">Checkout</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500">
          Sign in to use a saved shipping address, or continue as a guest. You can always enter a
          different address either way.
        </p>

        <div className="mt-10 space-y-3">
          <Link
            href="/login?next=/checkout"
            className={cn(buttonVariants({ size: "lg" }), "w-full rounded-lg")}
          >
            Sign in
          </Link>
          <Link
            href="/register?next=/checkout"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "w-full rounded-lg"
            )}
          >
            Create an account
          </Link>
          <Button
            type="button"
            size="lg"
            variant="ghost"
            className="w-full rounded-lg"
            onClick={() => setGuestCheckout(true)}
          >
            Continue as guest
          </Button>
        </div>

        <div className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
          <p className="font-medium text-neutral-900">Order summary</p>
          <p className="mt-2">
            {items.reduce((n, i) => n + i.quantity, 0)} item
            {items.reduce((n, i) => n + i.quantity, 0) === 1 ? "" : "s"} · {formatPrice(subtotal)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
      <PageHead title="Checkout" noindex path="/checkout" />
      <h1 className="font-display text-4xl text-neutral-900">Checkout</h1>
      {user ? (
        <p className="mt-2 text-sm text-neutral-500">
          Signed in as {user.email}. Choose a saved address or enter a new one.{" "}
          <Link href="/profile" className="text-neutral-900 underline">
            Manage addresses
          </Link>
        </p>
      ) : (
        <p className="mt-2 text-sm text-neutral-500">
          Checking out as a guest.{" "}
          <Link href="/login?next=/checkout" className="text-neutral-900 underline">
            Sign in instead
          </Link>
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-10 grid gap-12 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          {user && (
            <div>
              <Label className="mb-3 block">Ship to</Label>
              {addressesLoading ? (
                <SavedAddressesSkeleton />
              ) : (
              <div className="space-y-3">
                {savedAddresses.map((row) => (
                  <label
                    key={row.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-4 text-sm transition-colors",
                      selectedAddressId === row.id
                        ? "border-neutral-900 bg-neutral-50"
                        : "border-neutral-200 hover:border-neutral-400"
                    )}
                  >
                    <input
                      type="radio"
                      name="savedAddress"
                      className="mt-0.5"
                      checked={selectedAddressId === row.id}
                      onChange={() => selectSavedAddress(row.id)}
                    />
                    <span>
                      <span className="block font-medium text-neutral-900">
                        {row.label || "Address"}
                        {row.isDefault ? (
                          <span className="ml-2 text-xs font-normal text-neutral-500">
                            Default
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-neutral-500">
                        {row.name} · {row.phone}
                      </span>
                      <span className="block text-neutral-500">
                        {row.address}, {row.city}, {row.state}, {row.country}
                      </span>
                    </span>
                  </label>
                ))}
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-4 text-sm transition-colors",
                    selectedAddressId === "new"
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-400"
                  )}
                >
                  <input
                    type="radio"
                    name="savedAddress"
                    className="mt-0.5"
                    checked={selectedAddressId === "new"}
                    onChange={() => selectSavedAddress("new")}
                  />
                  <span className="font-medium text-neutral-900">Use a new address</span>
                </label>
              </div>
              )}
            </div>
          )}

          {user && addressesLoading ? (
            <AddressFieldsSkeleton />
          ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Full name</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register("phone")} />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Input {...register("address")} />
              {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...register("city")} />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <input type="hidden" {...register("state")} />
              <Select
                value={selectedState || null}
                onValueChange={(value) =>
                  value && setValue("state", String(value), { shouldValidate: true })
                }
                items={nigerianStateItems(selectedState)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {nigerianStateItems(selectedState).map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Country</Label>
              <input type="hidden" {...register("country")} />
              <Select
                value={NIGERIA}
                disabled
                items={[{ value: NIGERIA, label: NIGERIA }]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NIGERIA}>{NIGERIA}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          )}

          {user && usingNewAddress && !addressesLoading && (
            <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input type="checkbox" {...register("saveAddress")} />
                Save this address to my account
              </label>
              {saveAddress && (
                <div className="space-y-2">
                  <Label>Label (optional)</Label>
                  <Input placeholder="Home, Work…" {...register("addressLabel")} />
                </div>
              )}
            </div>
          )}

          <div>
            <Label className="mb-3 block">Shipping</Label>
            {shippingLoading ? (
              <ShippingOptionsSkeleton />
            ) : !selectedState ? (
              <p className="text-sm text-neutral-500">
                Select a state to see delivery options.
              </p>
            ) : !selectedShipping ? (
              <p className="text-sm text-neutral-500">
                No shipping options available for {selectedState}.
              </p>
            ) : (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm">
                <input type="hidden" {...register("shippingOptionId")} />
                <div className="flex items-start justify-between gap-4">
                  <span>
                    <span className="block font-medium text-neutral-900">
                      {selectedShipping.name}
                    </span>
                    <span className="mt-0.5 block text-neutral-500">
                      {selectedShipping.description}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium text-neutral-900">
                    {selectedShipping.price === 0 ? "Free" : formatPrice(selectedShipping.price)}
                  </span>
                </div>
              </div>
            )}
            {errors.shippingOptionId && (
              <p className="mt-2 text-xs text-red-500">{errors.shippingOptionId.message}</p>
            )}
          </div>

          <div>
            <Label className="mb-1 block">Payment</Label>
            <p className="mb-3 text-xs text-neutral-500">
              All transactions are secure and encrypted.
            </p>
            <p className="mb-3 text-sm font-medium text-neutral-900">
              Total amount due: {formatPrice(total)}
            </p>
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              {PAYMENT_PROVIDERS.map((provider, index) => {
                const selected = paymentProvider === provider.value;
                return (
                  <div
                    key={provider.value}
                    className={cn(
                      index > 0 && "border-t border-neutral-200",
                      selected && "bg-neutral-50"
                    )}
                  >
                    <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-4 text-sm">
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          value={provider.value}
                          className="shrink-0"
                          {...register("paymentProvider")}
                        />
                        <span className="font-medium text-neutral-900">{provider.label}</span>
                      </span>
                      {provider.logo ? (
                        <Image
                          src={provider.logo}
                          alt={provider.label}
                          width={800}
                          height={375}
                          className="h-6 w-auto object-contain"
                        />
                      ) : (
                        <span className="rounded bg-neutral-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Bank
                        </span>
                      )}
                    </label>

                    {provider.value === "bank_transfer" && selected && (
                      <div className="border-t border-neutral-200 bg-white px-4 py-4 text-sm">
                        <p className="text-neutral-600">
                          Kindly transfer exactly{" "}
                          <span className="font-semibold text-neutral-900">
                            {formatPrice(total)}
                          </span>{" "}
                          to the following bank account.
                        </p>
                        <dl className="mt-4 space-y-2">
                          <div className="flex flex-wrap justify-between gap-2">
                            <dt className="text-neutral-500">Account Name</dt>
                            <dd className="font-medium text-neutral-900">
                              {siteConfig.bankTransfer.accountName}
                            </dd>
                          </div>
                          <div className="flex flex-wrap justify-between gap-2">
                            <dt className="text-neutral-500">Bank Name</dt>
                            <dd className="font-medium text-neutral-900">
                              {siteConfig.bankTransfer.bankName}
                            </dd>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <dt className="text-neutral-500">Account Number</dt>
                            <dd className="flex items-center gap-2 font-medium text-neutral-900">
                              {siteConfig.bankTransfer.accountNumber}
                              <button
                                type="button"
                                onClick={copyAccountNumber}
                                className="text-xs font-normal text-neutral-500 underline hover:text-neutral-900"
                              >
                                Copy
                              </button>
                            </dd>
                          </div>
                        </dl>
                        <p className="mt-4 text-xs leading-relaxed text-neutral-500">
                          Once you have made the transfer, click &quot;I have made the
                          transfer&quot;. You will be required to provide proof of payment.
                          Your order is only created after the receipt is submitted, and an
                          admin will confirm payment before fulfillment.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Button
              type="submit"
              className="mt-4 w-full rounded-lg"
              disabled={isSubmitting || shippingLoading || !shippingOptionId}
            >
              {isSubmitting
                ? "Processing…"
                : paymentProvider === "bank_transfer"
                  ? "I have made the transfer"
                  : `Pay with ${selectedPayment.label}`}
            </Button>
          </div>
        </div>

        <div className="self-start rounded-2xl border border-neutral-200 bg-neutral-50 p-6 lg:col-span-2">
          <h2 className="font-medium text-neutral-900">Order summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            {items.map((item) => (
              <div
                key={`${item.product.id}:${item.variant?.id || "base"}`}
                className="flex justify-between text-neutral-600"
              >
                <span>
                  {item.product.name}
                  {item.variant
                    ? ` (${Object.values(item.variant.attributes || {}).join(" / ")})`
                    : ""}{" "}
                  × {item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <Input placeholder="Coupon code" {...register("couponCode")} />
            <Button type="button" variant="outline" onClick={applyCoupon}>
              Apply
            </Button>
          </div>

          <div className="mt-6 space-y-2 border-t border-neutral-200 pt-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{selectedShipping ? selectedShipping.name : "Shipping"}</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between text-base font-medium text-neutral-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </form>

      <Dialog
        open={receiptOpen}
        onOpenChange={(open) => {
          if (submittingBank) return;
          setReceiptOpen(open);
          if (!open) {
            setReceiptFile(null);
            setPayerBank("");
            setTransferAmount("");
            setReceiptNote("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={!submittingBank}>
          <DialogHeader>
            <DialogTitle>Proof of payment</DialogTitle>
            <DialogDescription>
              Upload your transfer receipt. Your order will be created after this and an admin
              will confirm payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt (image or PDF)</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/*,.pdf,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
              {receiptFile && (
                <p className="text-xs text-neutral-500">{receiptFile.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="payerBank">Bank transferred from</Label>
              <Input
                id="payerBank"
                placeholder="e.g. GTBank, Access Bank"
                value={payerBank}
                onChange={(e) => setPayerBank(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transferAmount">Amount transferred</Label>
              <Input
                id="transferAmount"
                type="number"
                min={0}
                step="0.01"
                placeholder={String(total)}
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiptNote">Note (optional)</Label>
              <Input
                id="receiptNote"
                placeholder="Payer name or transfer reference"
                value={receiptNote}
                onChange={(e) => setReceiptNote(e.target.value)}
              />
            </div>
            <p className="text-xs text-neutral-500">
              Amount due: <span className="font-medium text-neutral-900">{formatPrice(total)}</span>
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submittingBank}
              onClick={() => setReceiptOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                submittingBank || !receiptFile || !payerBank.trim() || !transferAmount
              }
              onClick={handleSubmit(submitBankTransfer)}
            >
              {submittingBank ? "Submitting…" : "Submit receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
