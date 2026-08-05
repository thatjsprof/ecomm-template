import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
  getCategories,
  updateProduct,
  uploadImage,
} from "@/services/api";
import type { Category, Pagination, Product, ProductOption } from "@/types";
import { formatPrice } from "@/utils/format";
import { productFormErrorMessage, productFormSchema } from "@/lib/product-form";
import { cn } from "@/lib/utils";
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
import {
  optionsFromVariants,
  ProductOptionsEditor,
  type VariantRow,
} from "@/components/admin/product-options-editor";

function moveImage(images: string[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= images.length || to >= images.length) {
    return images;
  }
  const next = [...images];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  salePrice: "",
  stock: "0",
  categoryId: "",
  featured: false,
  newArrival: false,
  active: true,
  images: [] as string[],
  options: [] as ProductOption[],
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
  const [dragImageIndex, setDragImageIndex] = useState<number | null>(null);

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
      categoryId: product.categoryId,
      featured: product.featured,
      newArrival: product.newArrival,
      active: product.active,
      images: product.images || [],
      options: optionsFromVariants(existingVariants, product.optionConfig),
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

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const res = await uploadImage(file);
        if (res.data?.url) uploaded.push(res.data.url);
      }
      if (uploaded.length) {
        setForm((prev) => ({ ...prev, images: [...prev.images, ...uploaded] }));
        toast.success(
          uploaded.length === 1 ? "Image uploaded" : `${uploaded.length} images uploaded`
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      e.target.value = "";
    }
  }

  async function onSave() {
    setSaving(true);
    try {
      const optionConfig = form.options
        .map((o) => ({
          name: o.name.trim(),
          values: o.values
            .map((v) => ({
              value: v.value.trim(),
              image: v.image || null,
            }))
            .filter((v) => v.value),
        }))
        .filter((o) => o.name && o.values.length > 0);

      const parsed = productFormSchema.safeParse({
        name: form.name,
        description: form.description,
        price: form.price,
        salePrice: form.salePrice,
        stock: form.stock,
        categoryId: form.categoryId,
        featured: form.featured,
        newArrival: form.newArrival,
        active: form.active,
        images: form.images,
        optionConfig: optionConfig.length ? optionConfig : null,
        variants: form.variants
          .filter((v) => v.sku.trim())
          .map((v) => ({
            id: v.id,
            sku: v.sku,
            attributes: v.attributes,
            stock: Number(v.stock) || 0,
            price: v.price ? Number(v.price) : null,
            salePrice: v.salePrice ? Number(v.salePrice) : null,
            active: true,
          })),
      });

      if (!parsed.success) {
        throw new Error(productFormErrorMessage(parsed.error));
      }

      if (editing) {
        await updateProduct(editing.id, parsed.data);
        toast.success("Product updated");
      } else {
        await createProduct(parsed.data);
        toast.success("Product created");
      }

      setOpen(false);
      load(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
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
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Base price</Label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Sale price</Label>
                  <Input
                    type="number"
                    value={form.salePrice}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, salePrice: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Base stock</Label>
                  <Input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select
                    value={form.categoryId || null}
                    onValueChange={(value) =>
                      value &&
                      setForm((prev) => ({ ...prev, categoryId: String(value) }))
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
                <Input type="file" accept="image/*" multiple onChange={onUpload} />
                {form.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.images.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        draggable
                        onDragStart={() => setDragImageIndex(index)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (dragImageIndex == null) return;
                          setForm((prev) => ({
                            ...prev,
                            images: moveImage(prev.images, dragImageIndex, index),
                          }));
                          setDragImageIndex(null);
                        }}
                        onDragEnd={() => setDragImageIndex(null)}
                        className={cn(
                          "group relative size-20 cursor-grab overflow-hidden rounded-lg border bg-neutral-50 active:cursor-grabbing",
                          dragImageIndex === index
                            ? "border-neutral-900 opacity-60"
                            : "border-neutral-200"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="pointer-events-none size-full object-cover" />
                        {index === 0 ? (
                          <span className="pointer-events-none absolute left-1 top-1 rounded bg-black/70 px-1 text-[9px] font-medium uppercase tracking-wide text-white">
                            Cover
                          </span>
                        ) : (
                          <span className="pointer-events-none absolute left-1 top-1 rounded bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                            <GripVertical className="size-3" />
                          </span>
                        )}
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded bg-white/90 px-1.5 text-[10px] text-neutral-700"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== index),
                            }))
                          }
                        >
                          ×
                        </button>
                        {form.images.length > 1 && (
                          <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/50 to-transparent px-0.5 pb-0.5 pt-3 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              disabled={index === 0}
                              className="rounded bg-white/90 p-0.5 text-neutral-700 disabled:opacity-30"
                              aria-label="Move image left"
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  images: moveImage(prev.images, index, index - 1),
                                }))
                              }
                            >
                              <ChevronLeft className="size-3" />
                            </button>
                            <button
                              type="button"
                              disabled={index === form.images.length - 1}
                              className="rounded bg-white/90 p-0.5 text-neutral-700 disabled:opacity-30"
                              aria-label="Move image right"
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  images: moveImage(prev.images, index, index + 1),
                                }))
                              }
                            >
                              <ChevronRight className="size-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <ProductOptionsEditor
                options={form.options}
                variants={form.variants}
                images={form.images}
                baseStock={form.stock}
                basePrice={form.price}
                baseSalePrice={form.salePrice}
                onOptionsChange={(options) => setForm((prev) => ({ ...prev, options }))}
                onVariantsChange={(variants) => setForm((prev) => ({ ...prev, variants }))}
                onImagesChange={(images) => setForm((prev) => ({ ...prev, images }))}
              />

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.featured}
                    onCheckedChange={(v) =>
                      setForm((prev) => ({ ...prev, featured: !!v }))
                    }
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.newArrival}
                    onCheckedChange={(v) =>
                      setForm((prev) => ({ ...prev, newArrival: !!v }))
                    }
                  />
                  New arrival
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.active}
                    onCheckedChange={(v) => setForm((prev) => ({ ...prev, active: !!v }))}
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
