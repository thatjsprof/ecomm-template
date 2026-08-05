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

type OptionGroup = {
  name: string;
  /** Comma-separated values, e.g. "12, 13" */
  valuesText: string;
};

type VariantRow = {
  id?: string;
  attributes: Record<string, string>;
  sku: string;
  stock: string;
  price: string;
  salePrice: string;
};

function parseOptionValues(text: string): string[] {
  return text
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function attributeSignature(attributes: Record<string, string>): string {
  return Object.keys(attributes)
    .sort()
    .map((key) => `${key}=${attributes[key]}`)
    .join("|");
}

function valuesSignature(attributes: Record<string, string>): string {
  return Object.values(attributes)
    .map((value) => value.trim().toLowerCase())
    .sort()
    .join("|");
}

function findMatchingVariant(
  attributes: Record<string, string>,
  previous: VariantRow[],
  used: Set<number>
): VariantRow | undefined {
  const exact = attributeSignature(attributes);
  const byValues = valuesSignature(attributes);

  const exactIndex = previous.findIndex(
    (v, i) => !used.has(i) && attributeSignature(v.attributes) === exact
  );
  if (exactIndex >= 0) {
    used.add(exactIndex);
    return previous[exactIndex];
  }

  const valuesIndex = previous.findIndex(
    (v, i) => !used.has(i) && valuesSignature(v.attributes) === byValues
  );
  if (valuesIndex >= 0) {
    used.add(valuesIndex);
    return previous[valuesIndex];
  }

  return undefined;
}

function formatAttributes(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" / ");
}

function cartesianCombinations(
  options: Array<{ name: string; values: string[] }>
): Record<string, string>[] {
  const usable = options.filter((o) => o.name && o.values.length > 0);
  if (usable.length === 0) return [];

  return usable.reduce<Record<string, string>[]>((acc, option) => {
    if (acc.length === 0) {
      return option.values.map((value) => ({ [option.name]: value }));
    }
    return acc.flatMap((combo) =>
      option.values.map((value) => ({ ...combo, [option.name]: value }))
    );
  }, []);
}

function skuSlug(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-_]/g, "");
}

function buildSku(baseSku: string, attributes: Record<string, string>): string {
  const parts = Object.values(attributes).map(skuSlug).filter(Boolean);
  const base = baseSku.trim();
  if (base && parts.length) return `${base}-${parts.join("-")}`;
  if (parts.length) return parts.join("-");
  return base;
}

function optionsFromVariants(
  variants: Array<{ attributes?: Record<string, string> | null }>
): OptionGroup[] {
  const order: string[] = [];
  const values = new Map<string, string[]>();

  for (const variant of variants) {
    for (const [key, value] of Object.entries(variant.attributes || {})) {
      if (!values.has(key)) {
        order.push(key);
        values.set(key, []);
      }
      const list = values.get(key)!;
      if (!list.includes(value)) list.push(value);
    }
  }

  return order.map((name) => ({
    name,
    valuesText: (values.get(name) || []).join(", "),
  }));
}

const emptyOption = (): OptionGroup => ({ name: "", valuesText: "" });

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
  options: [] as OptionGroup[],
  variants: [] as VariantRow[],
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
    const existingVariants = product.variants || [];
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
      options: optionsFromVariants(existingVariants),
      variants: existingVariants.map((v) => ({
        id: v.id,
        attributes: { ...(v.attributes || {}) },
        sku: v.sku,
        stock: String(v.stock),
        price: v.price != null ? String(v.price) : "",
        salePrice: v.salePrice != null ? String(v.salePrice) : "",
      })),
    });
    setOpen(true);
  }

  function updateOption(index: number, patch: Partial<OptionGroup>) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    }));
  }

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  }

  function generateCombinations() {
    setForm((prev) => {
      const optionDefs = prev.options
        .map((o) => ({
          name: o.name.trim(),
          values: parseOptionValues(o.valuesText),
        }))
        .filter((o) => o.name && o.values.length > 0);

      if (optionDefs.length === 0) {
        toast.error("Add at least one option with values (e.g. Size → 12, 13)");
        return prev;
      }

      const combos = cartesianCombinations(optionDefs);
      const used = new Set<number>();

      const variants: VariantRow[] = combos.map((attributes) => {
        const existing = findMatchingVariant(attributes, prev.variants, used);
        if (existing) {
          return {
            ...existing,
            attributes,
          };
        }
        return {
          attributes,
          sku: buildSku(prev.sku, attributes),
          stock: prev.stock || "0",
          price: prev.price || "",
          salePrice: prev.salePrice || "",
        };
      });

      toast.success(`Generated ${variants.length} combination${variants.length === 1 ? "" : "s"}`);
      return { ...prev, variants };
    });
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
          .map((v) => ({
            id: v.id,
            sku: v.sku.trim(),
            attributes: v.attributes,
            stock: Number(v.stock) || 0,
            price: v.price ? Number(v.price) : null,
            salePrice: v.salePrice ? Number(v.salePrice) : null,
            active: true,
          })),
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
      const res = await deleteProduct(id);
      toast.success(res.data?.message || "Product deleted");
      load(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
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
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Variant options</p>
                    <p className="text-xs text-neutral-500">
                      Define options first (e.g. Size → 12, 13 and Color → Black, Blue), then generate
                      every combination so you can set stock/price per row.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        options: [...prev.options, emptyOption()],
                      }))
                    }
                  >
                    Add option
                  </Button>
                </div>

                {form.options.map((option, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_2fr_auto] gap-2 rounded-xl border border-neutral-200 p-3"
                  >
                    <Input
                      placeholder="Option name (Size)"
                      value={option.name}
                      onChange={(e) => updateOption(index, { name: e.target.value })}
                    />
                    <Input
                      placeholder="Values (12, 13)"
                      value={option.valuesText}
                      onChange={(e) => updateOption(index, { valuesText: e.target.value })}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          options: prev.options.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}

                {form.options.length > 0 && (
                  <Button type="button" size="sm" onClick={generateCombinations}>
                    Generate combinations
                  </Button>
                )}

                {form.variants.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Combinations ({form.variants.length})
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-neutral-200">
                      <table className="w-full min-w-[560px] text-left text-xs">
                        <thead className="border-b border-neutral-100 bg-neutral-50 text-neutral-500">
                          <tr>
                            <th className="px-3 py-2 font-medium">Combination</th>
                            <th className="px-3 py-2 font-medium">SKU</th>
                            <th className="px-3 py-2 font-medium">Stock</th>
                            <th className="px-3 py-2 font-medium">Price</th>
                            <th className="px-3 py-2 font-medium">Sale</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.variants.map((variant, index) => (
                            <tr key={attributeSignature(variant.attributes)} className="border-b border-neutral-50">
                              <td className="px-3 py-2 font-medium text-neutral-800">
                                {formatAttributes(variant.attributes)}
                              </td>
                              <td className="px-3 py-2">
                                <Input
                                  className="h-8 text-xs"
                                  value={variant.sku}
                                  onChange={(e) => updateVariant(index, { sku: e.target.value })}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <Input
                                  className="h-8 text-xs"
                                  type="number"
                                  value={variant.stock}
                                  onChange={(e) => updateVariant(index, { stock: e.target.value })}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <Input
                                  className="h-8 text-xs"
                                  type="number"
                                  placeholder="Base"
                                  value={variant.price}
                                  onChange={(e) => updateVariant(index, { price: e.target.value })}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <Input
                                  className="h-8 text-xs"
                                  type="number"
                                  placeholder="—"
                                  value={variant.salePrice}
                                  onChange={(e) =>
                                    updateVariant(index, { salePrice: e.target.value })
                                  }
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-neutral-500">
                      New rows start with the product base stock and price (not split across
                      combinations). Regenerating keeps your entered stock/price/SKU when the
                      values still match — renaming an option (e.g. Size → Shoe size) won’t wipe
                      them.
                    </p>
                  </div>
                )}
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
                    <div>
                      <span className="font-medium">{product.name}</span>
                      {!product.active && (
                        <span className="ml-2 text-xs text-neutral-400">Hidden</span>
                      )}
                    </div>
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
