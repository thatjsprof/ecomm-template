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
  validateCoupon,
} from "@/services/api";
import { PageHead } from "@/components/seo/page-head";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/utils/format";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import type { SavedAddress, ShippingOption } from "@/types";

const PAYMENT_PROVIDERS = [
  {
    value: "korapay" as const,
    label: "Korapay",
    logo: "/payments/korapay.png",
  },
];

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  paymentProvider: z.enum(["korapay"]),
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
  const { items, subtotal, ready: cartReady } = useCart();
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState("");
  const [guestCheckout, setGuestCheckout] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [shippingLoading, setShippingLoading] = useState(true);
  const [addressesLoading, setAddressesLoading] = useState(false);

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
      country: siteConfig.defaultCountry,
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
        setValue("shippingOptionId", res.data.options[0].id);
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
    if (row.country) setValue("country", row.country);
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
  const selectedPayment =
    PAYMENT_PROVIDERS.find((provider) => provider.value === paymentProvider) ||
    PAYMENT_PROVIDERS[0];
  const selectedShipping =
    shippingOptions.find((option) => option.id === shippingOptionId) || null;
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
      setValue("country", siteConfig.defaultCountry);
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
          country: values.country,
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
              <Input {...register("state")} />
              {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Country</Label>
              <Input {...register("country")} />
              {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
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
            ) : shippingOptions.length === 0 ? (
              <p className="text-sm text-neutral-500">No shipping options available.</p>
            ) : (
              <div className="space-y-3">
                {shippingOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-start justify-between gap-4 rounded-xl border px-4 py-4 text-sm transition-colors ${shippingOptionId === option.id
                        ? "border-neutral-900 bg-neutral-50"
                        : "border-neutral-200 hover:border-neutral-400"
                      }`}
                  >
                    <span className="flex items-start gap-2">
                      <input
                        type="radio"
                        value={option.id}
                        className="mt-0.5"
                        {...register("shippingOptionId")}
                      />
                      <span>
                        <span className="block font-medium text-neutral-900">{option.name}</span>
                        <span className="mt-0.5 block text-neutral-500">{option.description}</span>
                      </span>
                    </span>
                    <span className="shrink-0 font-medium text-neutral-900">
                      {option.price === 0 ? "Free" : formatPrice(option.price)}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {errors.shippingOptionId && (
              <p className="mt-2 text-xs text-red-500">{errors.shippingOptionId.message}</p>
            )}
          </div>

          <div>
            <Label className="mb-3 block">Payment method</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {PAYMENT_PROVIDERS.map((provider) => (
                <label
                  key={provider.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-4 text-sm transition-colors",
                    paymentProvider === provider.value
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-400"
                  )}
                >
                  <input
                    type="radio"
                    value={provider.value}
                    className="shrink-0"
                    {...register("paymentProvider")}
                  />
                  <Image
                    src={provider.logo}
                    alt={provider.label}
                    width={646}
                    height={303}
                    className="h-7 w-auto object-contain"
                  />
                  <span className="font-medium text-neutral-900">{provider.label}</span>
                </label>
              ))}
            </div>
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

          <Button
            type="submit"
            className="mt-6 w-full rounded-lg"
            disabled={isSubmitting || shippingLoading || !shippingOptionId}
          >
            {isSubmitting ? "Processing…" : `Pay with ${selectedPayment.label}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
