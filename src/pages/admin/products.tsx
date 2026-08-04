import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
  getCategories,
  updateProduct,
  uploadImage,
} from "@/services/api";
import type { Category, Pagination, Product } from "@/types";
import { formatPrice } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";

type VariantForm = {
  id?: string;
  sku: string;
  size: string;
  color: string;
  stock: string;
  price: string;
  salePrice: string;
};

const emptyVariant = (): VariantForm => ({
  sku: "",
  size: "",
  color: "",
  stock: "0",
  price: "",
  salePrice: "",
});

const emptyForm = {
  name: "",
  description: "",
  price: "",
  salePrice: "",
  stock: "0",
  sku: "",
  categoryId: "",
  featured: false,
  newArrival: false,
  active: true,
  images: [] as string[],
  variants: [] as VariantForm[],
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load(nextPage = page) {
    const [productsRes, categoriesRes] = await Promise.all([
      getAdminProducts(nextPage),
      getCategories(),
    ]);
    setProducts(productsRes.data?.products || []);
    setPagination(productsRes.data?.pagination || null);
    setCategories(categoriesRes.data || []);
  }

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      salePrice: product.salePrice != null ? String(product.salePrice) : "",
      stock: String(product.stock),
      sku: product.sku,
      categoryId: product.categoryId,
      featured: product.featured,
      newArrival: product.newArrival,
      active: product.active,
      images: product.images || [],
      variants: (product.variants || []).map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.attributes?.Size || "",
        color: v.attributes?.Color || "",
        stock: String(v.stock),
        price: v.price != null ? String(v.price) : "",
        salePrice: v.salePrice != null ? String(v.salePrice) : "",
      })),
    });
    setOpen(true);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadImage(file);
      if (res.data?.url) {
        setForm((prev) => ({ ...prev, images: [...prev.images, res.data!.url] }));
        toast.success("Image uploaded");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function updateVariant(index: number, patch: Partial<VariantForm>) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  }

  async function onSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        stock: Number(form.stock),
        sku: form.sku,
        categoryId: form.categoryId,
        featured: form.featured,
        newArrival: form.newArrival,
        active: form.active,
        images: form.images,
        variants: form.variants
          .filter((v) => v.sku.trim())
          .map((v) => {
            const attributes: Record<string, string> = {};
            if (v.size.trim()) attributes.Size = v.size.trim();
            if (v.color.trim()) attributes.Color = v.color.trim();
            return {
              id: v.id,
              sku: v.sku.trim(),
              attributes,
              stock: Number(v.stock) || 0,
              price: v.price ? Number(v.price) : null,
              salePrice: v.salePrice ? Number(v.salePrice) : null,
              active: true,
            };
          }),
      };

      if (editing) {
        await updateProduct(editing.id, payload);
        toast.success("Product updated");
      } else {
        await createProduct(payload);
        toast.success("Product created");
      }

      setOpen(false);
      load(page);
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      load(page);
    } catch {
      toast.error("Delete failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Products</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage catalog</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button onClick={openCreate}>Add product</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Base price</Label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Sale price</Label>
                  <Input
                    type="number"
                    value={form.salePrice}
                    onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Base stock</Label>
                  <Input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Base SKU</Label>
                  <Input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select
                    value={form.categoryId || null}
                    onValueChange={(value) =>
                      value && setForm({ ...form, categoryId: String(value) })
                    }
                    items={categories.map((c) => ({ value: c.id, label: c.name }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Images</Label>
                <Input type="file" accept="image/*" onChange={onUpload} />
                {form.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.images.map((url) => (
                      <div
                        key={url}
                        className="relative size-20 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="size-full object-cover" />
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded bg-white/90 px-1.5 text-[10px] text-neutral-700"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              images: prev.images.filter((img) => img !== url),
                            }))
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-neutral-100 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Variants</p>
                    <p className="text-xs text-neutral-500">
                      Optional size/color options. Leave empty for simple products.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        variants: [...prev.variants, emptyVariant()],
                      }))
                    }
                  >
                    Add variant
                  </Button>
                </div>

                {form.variants.map((variant, index) => (
                  <div
                    key={variant.id || index}
                    className="space-y-2 rounded-xl border border-neutral-200 p-3"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="SKU"
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, { sku: e.target.value })}
                      />
                      <Input
                        placeholder="Stock"
                        type="number"
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, { stock: e.target.value })}
                      />
                      <Input
                        placeholder="Size"
                        value={variant.size}
                        onChange={(e) => updateVariant(index, { size: e.target.value })}
                      />
                      <Input
                        placeholder="Color"
                        value={variant.color}
                        onChange={(e) => updateVariant(index, { color: e.target.value })}
                      />
                      <Input
                        placeholder="Price override"
                        type="number"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, { price: e.target.value })}
                      />
                      <Input
                        placeholder="Sale override"
                        type="number"
                        value={variant.salePrice}
                        onChange={(e) => updateVariant(index, { salePrice: e.target.value })}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          variants: prev.variants.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.featured}
                    onCheckedChange={(v) => setForm({ ...form, featured: !!v })}
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.newArrival}
                    onCheckedChange={(v) => setForm({ ...form, newArrival: !!v })}
                  />
                  New arrival
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.active}
                    onCheckedChange={(v) => setForm({ ...form, active: !!v })}
                  />
                  Active
                </label>
              </div>
              <Button onClick={onSave} disabled={saving} className="w-full">
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Variants</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-neutral-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      {product.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="size-full object-cover"
                        />
                      ) : null}
                    </div>
                    <span className="font-medium">{product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{formatPrice(product.salePrice ?? product.price)}</td>
                <td className="px-4 py-3">{product.variants?.length || 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(product)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(product.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-neutral-500">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
