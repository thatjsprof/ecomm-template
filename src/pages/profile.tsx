import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageHead } from "@/components/seo/page-head";
import { useAuth } from "@/hooks/use-auth";
import {
  changePassword,
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
  updateProfile,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";
import type { SavedAddress } from "@/types";

const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(1, "New password is required")
    .min(6, "Password must be at least 6 characters"),
});

const addressSchema = z.object({
  label: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  isDefault: z.boolean().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type AddressForm = z.infer<typeof addressSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      country: siteConfig.defaultCountry,
      isDefault: false,
    },
  });

  async function loadAddresses() {
    try {
      const res = await getAddresses();
      setAddresses(res.data || []);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    if (user) {
      profileForm.reset({ name: user.name, email: user.email });
      loadAddresses();
    }
  }, [user, loading, router, profileForm]);

  async function onProfile(values: ProfileForm) {
    try {
      await updateProfile(values);
      await refresh();
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    }
  }

  async function onPassword(values: PasswordForm) {
    try {
      await changePassword(values.currentPassword, values.newPassword);
      passwordForm.reset();
      toast.success("Password updated");
    } catch {
      toast.error("Failed to update password");
    }
  }

  function startAddAddress() {
    setEditingId(null);
    setShowAddressForm(true);
    addressForm.reset({
      label: "",
      name: user?.name || "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: siteConfig.defaultCountry,
      isDefault: addresses.length === 0,
    });
  }

  function startEditAddress(row: SavedAddress) {
    setEditingId(row.id);
    setShowAddressForm(true);
    addressForm.reset({
      label: row.label || "",
      name: row.name,
      phone: row.phone,
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country,
      isDefault: row.isDefault,
    });
  }

  async function onAddress(values: AddressForm) {
    try {
      const payload = {
        label: values.label?.trim() || null,
        name: values.name,
        phone: values.phone,
        address: values.address,
        city: values.city,
        state: values.state,
        country: values.country,
        isDefault: values.isDefault,
      };

      if (editingId) {
        await updateAddress(editingId, payload);
        toast.success("Address updated");
      } else {
        await createAddress(payload);
        toast.success("Address saved");
      }

      setShowAddressForm(false);
      setEditingId(null);
      await loadAddresses();
    } catch {
      toast.error("Failed to save address");
    }
  }

  async function onDeleteAddress(id: string) {
    try {
      await deleteAddress(id);
      toast.success("Address deleted");
      if (editingId === id) {
        setShowAddressForm(false);
        setEditingId(null);
      }
      await loadAddresses();
    } catch {
      toast.error("Failed to delete address");
    }
  }

  async function onMakeDefault(id: string) {
    try {
      await setDefaultAddress(id);
      toast.success("Default address updated");
      await loadAddresses();
    } catch {
      toast.error("Failed to update default");
    }
  }

  if (loading || !user) {
    return (
      <>
        <PageHead title="Profile" noindex path="/profile" />
        <p className="py-24 text-center text-sm text-neutral-500">Loading…</p>
      </>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12 lg:px-8">
      <PageHead title="Profile" noindex path="/profile" />
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        ← Back to account
      </Link>
      <h1 className="mt-4 font-display text-4xl text-neutral-900">Profile</h1>

      <form onSubmit={profileForm.handleSubmit(onProfile)} className="mt-10 space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...profileForm.register("name")} />
          {profileForm.formState.errors.name && (
            <p className="text-xs text-red-500">{profileForm.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" {...profileForm.register("email")} />
          {profileForm.formState.errors.email && (
            <p className="text-xs text-red-500">{profileForm.formState.errors.email.message}</p>
          )}
        </div>
        <Button type="submit" className="rounded-lg">
          Save changes
        </Button>
      </form>

      <section className="mt-12 space-y-4 border-t border-neutral-200 pt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium">Saved addresses</h2>
          {!showAddressForm && (
            <Button type="button" variant="outline" size="sm" onClick={startAddAddress}>
              Add address
            </Button>
          )}
        </div>

        {addresses.length === 0 && !showAddressForm && (
          <p className="text-sm text-neutral-500">
            No saved addresses yet. Add one here or save one at checkout.
          </p>
        )}

        <div className="space-y-3">
          {addresses.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-neutral-200 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-neutral-900">
                    {row.label || "Address"}
                    {row.isDefault ? (
                      <span className="ml-2 text-xs font-normal text-neutral-500">
                        Default
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-neutral-600">
                    {row.name} · {row.phone}
                  </p>
                  <p className="text-neutral-600">
                    {row.address}, {row.city}, {row.state}, {row.country}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!row.isDefault && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onMakeDefault(row.id)}
                    >
                      Make default
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditAddress(row)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteAddress(row.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showAddressForm && (
          <form
            onSubmit={addressForm.handleSubmit(onAddress)}
            className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4"
          >
            <p className="text-sm font-medium text-neutral-900">
              {editingId ? "Edit address" : "New address"}
            </p>
            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input placeholder="Home, Work…" {...addressForm.register("label")} />
            </div>
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input {...addressForm.register("name")} />
              {addressForm.formState.errors.name && (
                <p className="text-xs text-red-500">
                  {addressForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...addressForm.register("phone")} />
              {addressForm.formState.errors.phone && (
                <p className="text-xs text-red-500">
                  {addressForm.formState.errors.phone.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input {...addressForm.register("address")} />
              {addressForm.formState.errors.address && (
                <p className="text-xs text-red-500">
                  {addressForm.formState.errors.address.message}
                </p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input {...addressForm.register("city")} />
                {addressForm.formState.errors.city && (
                  <p className="text-xs text-red-500">
                    {addressForm.formState.errors.city.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input {...addressForm.register("state")} />
                {addressForm.formState.errors.state && (
                  <p className="text-xs text-red-500">
                    {addressForm.formState.errors.state.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input {...addressForm.register("country")} />
              {addressForm.formState.errors.country && (
                <p className="text-xs text-red-500">
                  {addressForm.formState.errors.country.message}
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" {...addressForm.register("isDefault")} />
              Set as default address
            </label>
            <div className="flex gap-2 pt-1">
              <Button type="submit" className="rounded-lg">
                {editingId ? "Update address" : "Save address"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-lg"
                onClick={() => {
                  setShowAddressForm(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </section>

      <form
        onSubmit={passwordForm.handleSubmit(onPassword)}
        className="mt-12 space-y-4 border-t border-neutral-200 pt-10"
      >
        <h2 className="font-medium">Change password</h2>
        <div className="space-y-2">
          <Label>Current password</Label>
          <Input type="password" {...passwordForm.register("currentPassword")} />
          {passwordForm.formState.errors.currentPassword && (
            <p className="text-xs text-red-500">
              {passwordForm.formState.errors.currentPassword.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>New password</Label>
          <Input type="password" {...passwordForm.register("newPassword")} />
          {passwordForm.formState.errors.newPassword && (
            <p className="text-xs text-red-500">
              {passwordForm.formState.errors.newPassword.message}
            </p>
          )}
        </div>
        <Button type="submit" variant="outline" className="rounded-lg">
          Update password
        </Button>
      </form>
    </div>
  );
}
