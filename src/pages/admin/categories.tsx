import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  uploadImage,
} from "@/services/api";
import type { Category } from "@/types";
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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);

  async function load() {
    const res = await getCategories();
    setCategories(res.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setImage(null);
    setOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setName(category.name);
    setImage(category.image);
    setOpen(true);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadImage(file);
      if (res.data?.url) {
        setImage(res.data.url);
        toast.success("Image uploaded");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function onSave() {
    try {
      if (editing) {
        await updateCategory(editing.id, { name, image });
        toast.success("Category updated");
      } else {
        await createCategory({ name, image });
        toast.success("Category created");
      }
      setOpen(false);
      load();
    } catch {
      toast.error("Save failed");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      toast.success("Category deleted");
      load();
    } catch {
      toast.error("Delete failed — category may have products");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Categories</h1>
          <p className="mt-1 text-sm text-neutral-500">Organize products</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button onClick={openCreate}>Add category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Image</Label>
                <Input type="file" accept="image/*" onChange={onUpload} />
                {image && (
                  <div className="relative mt-2 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt="Category preview"
                      className="h-40 w-full object-contain object-center"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="absolute right-2 top-2 bg-white/90"
                      onClick={() => setImage(null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
              <Button onClick={onSave} className="w-full">
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 space-y-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                {category.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.image}
                    alt={category.name}
                    className="size-full object-contain object-center"
                  />
                ) : null}
              </div>
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-neutral-500">
                  {category._count?.products ?? 0} products · {category.slug}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => openEdit(category)}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(category.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
