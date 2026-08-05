"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { uploadImage } from "@/services/api";
import type { ProductOption } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type VariantRow = {
  id?: string;
  attributes: Record<string, string>;
  sku: string;
  stock: string;
  price: string;
  salePrice: string;
};

function parseCsvValues(text: string): string[] {
  return text
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function attributeSignature(attributes: Record<string, string>): string {
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

export function formatAttributes(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" / ");
}

export function buildVariantsFromOptions(params: {
  options: ProductOption[];
  previous: VariantRow[];
  baseSku: string;
  baseStock: string;
  basePrice: string;
  baseSalePrice: string;
}): VariantRow[] {
  const optionDefs = params.options
    .map((o) => ({
      name: o.name.trim(),
      values: o.values.map((v) => v.value.trim()).filter(Boolean),
    }))
    .filter((o) => o.name && o.values.length > 0);

  const combos = cartesianCombinations(optionDefs);
  const used = new Set<number>();

  return combos.map((attributes) => {
    const existing = findMatchingVariant(attributes, params.previous, used);
    if (existing) {
      return { ...existing, attributes };
    }
    return {
      attributes,
      sku: buildSku(params.baseSku, attributes),
      stock: params.baseStock || "0",
      price: params.basePrice || "",
      salePrice: params.baseSalePrice || "",
    };
  });
}

export function optionsFromVariants(
  variants: Array<{ attributes?: Record<string, string> | null }>,
  existing?: ProductOption[] | null
): ProductOption[] {
  if (existing?.length) {
    return existing.map((o) => ({
      name: o.name,
      values: (o.values || []).map((v) => ({
        value: v.value,
        image: v.image ?? null,
      })),
    }));
  }

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
    values: (values.get(name) || []).map((value) => ({ value, image: null })),
  }));
}

interface ProductOptionsEditorProps {
  options: ProductOption[];
  variants: VariantRow[];
  images: string[];
  baseSku: string;
  baseStock: string;
  basePrice: string;
  baseSalePrice: string;
  onOptionsChange: (options: ProductOption[]) => void;
  onVariantsChange: (variants: VariantRow[]) => void;
  onImagesChange: (images: string[]) => void;
}

export function ProductOptionsEditor({
  options,
  variants,
  images,
  baseSku,
  baseStock,
  basePrice,
  baseSalePrice,
  onOptionsChange,
  onVariantsChange,
  onImagesChange,
}: ProductOptionsEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const variantsRef = useRef(variants);
  variantsRef.current = variants;
  const [imageTarget, setImageTarget] = useState<{
    optionIndex: number;
    valueIndex: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate combinations when option names/values change (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = buildVariantsFromOptions({
        options,
        previous: variantsRef.current,
        baseSku,
        baseStock,
        basePrice,
        baseSalePrice,
      });
      onVariantsChange(next);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // Intentionally omit variants — we read latest via ref to preserve edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, baseSku, baseStock, basePrice, baseSalePrice]);

  function updateOption(index: number, patch: Partial<ProductOption>) {
    onOptionsChange(options.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  function updateOptionValue(
    optionIndex: number,
    valueIndex: number,
    patch: Partial<ProductOption["values"][number]>
  ) {
    onOptionsChange(
      options.map((o, i) => {
        if (i !== optionIndex) return o;
        return {
          ...o,
          values: o.values.map((v, vi) => (vi === valueIndex ? { ...v, ...patch } : v)),
        };
      })
    );
  }

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    onVariantsChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  async function attachFiles(files: FileList | File[]) {
    if (!imageTarget) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      toast.error("Choose an image file");
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of list) {
        const res = await uploadImage(file);
        if (res.data?.url) uploaded.push(res.data.url);
      }
      if (!uploaded.length) throw new Error("Upload failed");

      const nextImages = [...images];
      for (const url of uploaded) {
        if (!nextImages.includes(url)) nextImages.push(url);
      }
      onImagesChange(nextImages);
      updateOptionValue(imageTarget.optionIndex, imageTarget.valueIndex, {
        image: uploaded[0],
      });
      toast.success(uploaded.length === 1 ? "Image attached" : "Images uploaded");
      setImageTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function selectExisting(url: string) {
    if (!imageTarget) return;
    updateOptionValue(imageTarget.optionIndex, imageTarget.valueIndex, { image: url });
    setImageTarget(null);
  }

  const namedOptions = options.filter((o) => o.name.trim());
  const readyOptions = namedOptions.filter((o) =>
    o.values.some((v) => v.value.trim())
  );

  return (
    <div className="space-y-4 border-t border-neutral-100 pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Variant properties</p>
          <p className="text-xs text-neutral-500">
            Add properties like Size or Color. Combinations update automatically for pricing and
            stock.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onOptionsChange([...options, { name: "", values: [{ value: "", image: null }] }])
          }
        >
          <Plus className="size-3.5" />
          Add property
        </Button>
      </div>

      {options.map((option, optionIndex) => {
        const nameMissing = !option.name.trim() && option.values.some((v) => v.value.trim());

        return (
          <div
            key={optionIndex}
            className={`space-y-3 rounded-xl border p-4 ${
              nameMissing ? "border-red-300" : "border-neutral-200"
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Property name (e.g. color, size)"
                  value={option.name}
                  onChange={(e) => updateOption(optionIndex, { name: e.target.value })}
                />
                {nameMissing && (
                  <p className="text-xs text-red-500">Property name is required</p>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onOptionsChange(options.filter((_, i) => i !== optionIndex))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                Values
              </p>
              {option.values.map((entry, valueIndex) => (
                <div key={valueIndex} className="flex items-stretch gap-2">
                  <Input
                    className="h-20 flex-1 bg-white"
                    placeholder="Value"
                    value={entry.value}
                    onChange={(e) =>
                      updateOptionValue(optionIndex, valueIndex, { value: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setImageTarget({ optionIndex, valueIndex })}
                    className={cn(
                      "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-center transition-colors hover:border-neutral-400 hover:bg-white",
                      entry.image && "border-solid border-neutral-200 p-0"
                    )}
                  >
                    {entry.image ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={entry.image} alt="" className="size-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-[9px] text-white">
                          Change
                        </span>
                      </>
                    ) : (
                      <span className="flex h-full flex-col items-center justify-center px-1 text-[10px] leading-tight text-neutral-500">
                        Click to
                        <br />
                        Add Image
                      </span>
                    )}
                  </button>
                  {entry.image && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-20 px-2"
                      onClick={() =>
                        updateOptionValue(optionIndex, valueIndex, { image: null })
                      }
                      aria-label="Remove image"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-20 px-2"
                    disabled={option.values.length <= 1}
                    onClick={() =>
                      updateOption(optionIndex, {
                        values: option.values.filter((_, i) => i !== valueIndex),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs font-medium text-neutral-700 hover:text-neutral-900"
                onClick={() =>
                  updateOption(optionIndex, {
                    values: [...option.values, { value: "", image: null }],
                  })
                }
              >
                + Add value
              </button>
            </div>
          </div>
        );
      })}

      <div className="space-y-2">
        <p className="text-sm font-medium">
          SKU pricing & stock ({variants.length} possible combination
          {variants.length === 1 ? "" : "s"})
        </p>
        {readyOptions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-200 px-4 py-8 text-center text-xs text-neutral-400">
            Add named properties with values to generate combinations.
          </p>
        ) : (
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
                {variants.map((variant, index) => (
                  <tr
                    key={attributeSignature(variant.attributes)}
                    className="border-b border-neutral-50"
                  >
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
                        value={variant.price}
                        onChange={(e) => updateVariant(index, { price: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        className="h-8 text-xs"
                        type="number"
                        value={variant.salePrice}
                        onChange={(e) => updateVariant(index, { salePrice: e.target.value })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={imageTarget != null}
        onOpenChange={(open) => {
          if (!open) setImageTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>

          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files?.length) void attachFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center transition-colors",
              dragging && "border-neutral-900 bg-neutral-100",
              uploading && "opacity-60"
            )}
          >
            <Upload className="size-8 text-neutral-400" />
            <p className="text-sm text-neutral-600">
              {uploading ? "Uploading…" : "Click here or drag and drop to upload files."}
            </p>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void attachFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {images.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-neutral-800">Choose from Existing</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {images.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => selectExisting(url)}
                    className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 hover:ring-2 hover:ring-neutral-900"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Kept for callers that still paste CSV into a single field during migration */
export function parseCsvOptionValues(text: string) {
  return parseCsvValues(text);
}
