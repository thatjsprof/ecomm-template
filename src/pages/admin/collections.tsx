import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createCollection,
  deleteCollection,
  getAdminCollections,
  getAdminProducts,
  updateCollection,
  uploadImage,
} from "@/services/api";
import type { Collection, Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const emptyForm = {
  name: "",
  description: "",
  image: null as string | null,
  active: true,
  showInHero: false,
  ctaLabel: "Shop Now",
  sortOrder: "0",
  productIds: [] as string[],
};

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [collectionsRes, productsRes] = await Promise.all([
      getAdminCollections(),
      getAdminProducts(1, 100),
    ]);
    setCollections(collectionsRes.data || []);
    setProducts(productsRes.data?.products || []);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(collection: Collection) {
    setEditing(collection);
    setForm({
      name: collection.name,
      description: collection.description || "",
      image: collection.image,
      active: collection.active,
      showInHero: collection.showInHero,
      ctaLabel: collection.ctaLabel || "Shop Now",
      sortOrder: String(collection.sortOrder ?? 0),
      productIds: collection.productIds || collection.products?.map((p) => p.id) || [],
    });
    setOpen(true);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadImage(file);
      if (res.data?.url) {
        setForm((prev) => ({ ...prev, image: res.data!.url }));
        toast.success("Image uploaded");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function toggleProduct(id: string) {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter((pid) => pid !== id)
        : [...prev.productIds, id],
    }));
  }

  async function onSave() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        image: form.image,
        active: form.active,
        showInHero: form.showInHero,
        ctaLabel: form.ctaLabel.trim() || "Shop Now",
        sortOrder: Number(form.sortOrder) || 0,
        productIds: form.productIds,
      };
      if (editing) {
        await updateCollection(editing.id, payload);
        toast.success("Collection updated");
      } else {
        await createCollection(payload);
        toast.success("Collection created");
      }
      setOpen(false);
      load();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this collection?")) return;
    try {
      await deleteCollection(id);
      toast.success("Collection deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Collections</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Curated product groups for the shop and home hero slideshow
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button onClick={openCreate}>Add collection</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit collection" : "Add collection"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-1">
                <Label>Hero image</Label>
                <Input type="file" accept="image/*" onChange={onUpload} />
                {form.image && (
                  <div className="relative mt-2 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.image} alt="" className="h-40 w-full object-cover" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label>Button text (CTA)</Label>
                <Input
                  value={form.ctaLabel}
                  placeholder="Shop Now"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, ctaLabel: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Sort order</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, sortOrder: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-col justify-end gap-2 pb-1">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.active}
                      onCheckedChange={(v) =>
                        setForm((prev) => ({ ...prev, active: Boolean(v) }))
                      }
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.showInHero}
                      onCheckedChange={(v) =>
                        setForm((prev) => ({ ...prev, showInHero: Boolean(v) }))
                      }
                    />
                    Show in hero
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Products</Label>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-neutral-200 p-3">
                  {products.length === 0 && (
                    <p className="text-xs text-neutral-500">No products yet.</p>
                  )}
                  {products.map((product) => (
                    <label key={product.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.productIds.includes(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                      <span className="truncate">{product.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={onSave} disabled={saving} className="w-full">
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 space-y-3">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
              {collection.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={collection.image} alt="" className="size-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{collection.name}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {collection._count?.products ?? collection.productIds?.length ?? 0} products
                {collection.showInHero ? " · Hero" : ""}
                {!collection.active ? " · Hidden" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEdit(collection)}>
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600"
                onClick={() => onDelete(collection.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {collections.length === 0 && (
          <p className="text-sm text-neutral-500">No collections yet.</p>
        )}
      </div>
    </div>
  );
}
