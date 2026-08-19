import { useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  createShippingOption,
  deleteShippingOption,
  getAdminShippingOptions,
  updateShippingOption,
} from "@/services/api";
import type { ShippingOption } from "@/types";
import { formatPrice } from "@/utils/format";
import { cn } from "@/lib/utils";
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

const emptyForm = {
  name: "",
  description: "",
  price: "0",
  active: true,
};

function moveOption(options: ShippingOption[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= options.length || to >= options.length) {
    return options;
  }
  const next = [...options];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function AdminShippingPage() {
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingOption | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function load() {
    const res = await getAdminShippingOptions();
    setOptions(res.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  function openEdit(option: ShippingOption) {
    setEditing(option);
    setForm({
      name: option.name,
      description: option.description || "",
      price: String(option.price),
      active: option.active !== false,
    });
    setOpen(true);
  }

  async function onSave() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      active: form.active,
    };

    try {
      if (editing) {
        await updateShippingOption(editing.id, payload);
        toast.success("Shipping option updated");
      } else {
        const nextSortOrder =
          options.length > 0
            ? Math.max(...options.map((option) => option.sortOrder ?? 0)) + 1
            : 0;
        await createShippingOption({ ...payload, sortOrder: nextSortOrder });
        toast.success("Shipping option created");
      }
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch {
      toast.error(editing ? "Update failed" : "Create failed");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this shipping option?")) return;
    try {
      await deleteShippingOption(id);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  }

  async function toggleActive(option: ShippingOption) {
    try {
      await updateShippingOption(option.id, { active: !option.active });
      load();
    } catch {
      toast.error("Update failed");
    }
  }

  async function onReorder(from: number, to: number) {
    if (from === to) return;

    const previous = options;
    const reordered = moveOption(options, from, to).map((option, index) => ({
      ...option,
      sortOrder: index,
    }));

    setOptions(reordered);

    const changed = reordered.filter((option, index) => {
      const prev = previous.find((item) => item.id === option.id);
      return (prev?.sortOrder ?? 0) !== index;
    });

    if (changed.length === 0) return;

    try {
      await Promise.all(
        changed.map((option) =>
          updateShippingOption(option.id, { sortOrder: option.sortOrder })
        )
      );
    } catch {
      toast.error("Failed to save order");
      setOptions(previous);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Shipping</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Methods and prices shown at checkout. Drag rows to reorder.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) {
              setEditing(null);
              setForm(emptyForm);
            }
          }}
        >
          <DialogTrigger>
            <Button
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
              }}
            >
              Add option
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit shipping option" : "New shipping option"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Standard delivery"
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="5–7 business days"
                />
              </div>
              <div className="space-y-1">
                <Label>Price</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Active (shown at checkout)
              </label>
              <Button onClick={onSave} className="w-full">
                {editing ? "Save changes" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 space-y-3">
        {options.map((option, index) => (
          <div
            key={option.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex == null) return;
              void onReorder(dragIndex, index);
              setDragIndex(null);
            }}
            onDragEnd={() => setDragIndex(null)}
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3",
              "cursor-grab active:cursor-grabbing",
              dragIndex === index && "border-neutral-900 opacity-60"
            )}
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 shrink-0 text-neutral-400">
                <GripVertical className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="font-medium">
                  {option.name}
                  {!option.active && (
                    <span className="ml-2 text-xs font-normal text-neutral-400">Inactive</span>
                  )}
                </p>
                <p className="text-xs text-neutral-500">
                  {option.description || "No description"} ·{" "}
                  {option.price === 0 ? "Free" : formatPrice(option.price)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleActive(option)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {option.active ? "Deactivate" : "Activate"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEdit(option)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(option.id)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {options.length === 0 && (
          <p className="text-sm text-neutral-500">No shipping options yet.</p>
        )}
      </div>
    </div>
  );
}
