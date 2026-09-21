"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import {
  saveProduct,
  deleteProductImage,
  setCoverImage,
  reorderProductImages,
} from "@/app/admin/actions";
import { useConfirm } from "@/components/confirm-dialog";
import { InlineSpinner } from "@/components/page-loader";
import { discountPct, formatInr, mediaUrl } from "@/lib/utils";

type Img = { id: string; path: string; isCover: boolean };

type PendingImage = { id: string; file: File; preview: string };

export function ProductEditor({
  product,
  categories,
  defaultCategoryId,
}: {
  product?: {
    id: string;
    name: string;
    description: string;
    categoryId: string;
    subCategoryId: string | null;
    sortOrder: number;
    mrp: number;
    salePrice: number;
    stock: number;
    featured: boolean;
    active: boolean;
    images: Img[];
  };
  categories: { id: string; name: string; subCategories: { id: string; name: string }[] }[];
  defaultCategoryId?: string;
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [name, setName] = useState(product?.name || "");
  const [catId, setCatId] = useState(
    product?.categoryId || defaultCategoryId || categories[0]?.id || ""
  );
  const [subCategoryId, setSubCategoryId] = useState(product?.subCategoryId || "");
  const [sortOrder, setSortOrder] = useState(product?.sortOrder ?? 0);
  const [mrp, setMrp] = useState(product?.mrp || 0);
  const [sale, setSale] = useState(product?.salePrice || 0);
  const [stock, setStock] = useState(product?.stock || 0);
  const [desc, setDesc] = useState(product?.description || "");
  const [featured, setFeatured] = useState(product?.featured || false);
  const [images, setImages] = useState<Img[]>(product?.images || []);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, startSave] = useTransition();
  const [pending, startTransition] = useTransition();

  const catName = categories.find((c) => c.id === catId)?.name || "Category";
  const subOptions = categories.find((c) => c.id === catId)?.subCategories || [];
  const disc = discountPct(mrp, sale);
  const cover = images.find((i) => i.isCover) || images[0];
  const liveImg = pendingImages[0]?.preview || (cover ? mediaUrl(cover.path) : "");

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: PendingImage[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setPendingImages((prev) => [...prev, ...next]);
  }

  function removePending(id: string) {
    setPendingImages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  function moveImage(index: number, dir: -1 | 1) {
    if (!product?.id) return;
    const next = index + dir;
    if (next < 0 || next >= images.length) return;
    const reordered = [...images];
    const [item] = reordered.splice(index, 1);
    reordered.splice(next, 0, item);
    setImages(reordered);
    startTransition(async () => {
      await reorderProductImages(
        product.id,
        reordered.map((i) => i.id)
      );
      router.refresh();
    });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setOk("");
    if (!catId) {
      setError("Please select a category.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.delete("images");
    for (const item of pendingImages) {
      fd.append("images", item.file);
    }
    startSave(async () => {
      const res = await saveProduct(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOk(
        pendingImages.length > 1
          ? `Product saved with ${pendingImages.length} new images.`
          : res.message || "Product saved."
      );
      setPendingImages([]);
      router.push(`/admin/products/${res.id}`);
      router.refresh();
    });
  }

  return (
    <>
      {dialog}
      <form className="editor-split" onSubmit={onSubmit}>
        {product?.id && <input type="hidden" name="id" value={product.id} />}
        <div className="card form-card static">
          <h3>{product ? "Edit Product" : "Add Product"}</h3>
          {error && <div className="alert error">{error}</div>}
          {ok && <div className="alert ok">{ok}</div>}
          {!categories.length && (
            <div className="alert error">Create a category first before adding products.</div>
          )}
          <div className="form-row" style={{ marginTop: 14 }}>
            <div className="field">
              <label>Product Name</label>
              <input name="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-row two">
              <div className="field">
                <label>Category</label>
                <select
                  name="categoryId"
                  value={catId}
                  onChange={(e) => {
                    setCatId(e.target.value);
                    setSubCategoryId("");
                  }}
                  required
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Subcategory (optional)</label>
                <select name="subCategoryId" value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)}>
                  <option value="">None</option>
                  {subOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row two">
              <div className="field">
                <label>Display order (lower = first)</label>
                <input
                  type="number"
                  name="sortOrder"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                />
              </div>
              <div className="field">
                <label>Stock Qty</label>
                <input
                  type="number"
                  name="stock"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="form-row two">
              <div className="field">
                <label>Original Price (₹)</label>
                <input type="number" name="mrp" value={mrp} onChange={(e) => setMrp(Number(e.target.value))} />
              </div>
              <div className="field">
                <label>Sale Price (₹)</label>
                <input
                  type="number"
                  name="salePrice"
                  value={sale}
                  onChange={(e) => setSale(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea name="description" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <label className="check-row">
              <input
                type="checkbox"
                name="featured"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />{" "}
              Featured on home
            </label>
            <div className="field">
              <label>Product images ({images.length + pendingImages.length} total)</label>
              <div
                className={`dropzone${over ? " over" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(true);
                }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(false);
                  addFiles(e.dataTransfer.files);
                }}
              >
                Drag & drop images here, or browse to add more
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  multiple
                  style={{ marginTop: 10 }}
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                {pendingImages.length > 0 && (
                  <p className="cell-sub" style={{ marginTop: 8 }}>
                    {pendingImages.length} new image{pendingImages.length === 1 ? "" : "s"} ready to upload
                  </p>
                )}
              </div>
              <div className="img-chips">
                {images.map((img, idx) => (
                  <div className="img-chip" key={img.id}>
                    <img src={mediaUrl(img.path)} alt="" />
                    {img.isCover && <span className="cover">Cover</span>}
                    <div className="img-chip-actions">
                      <button
                        type="button"
                        className="icon-mini"
                        disabled={pending || idx === 0}
                        onClick={() => moveImage(idx, -1)}
                        title="Move left"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        className="icon-mini"
                        disabled={pending || idx === images.length - 1}
                        onClick={() => moveImage(idx, 1)}
                        title="Move right"
                      >
                        →
                      </button>
                      {!img.isCover && (
                        <button
                          type="button"
                          className="icon-mini"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await setCoverImage(img.id, product!.id);
                              router.refresh();
                            })
                          }
                        >
                          ★
                        </button>
                      )}
                      <button
                        type="button"
                        className="icon-mini"
                        disabled={pending}
                        onClick={async () => {
                          const okConfirm = await confirm({
                            title: "Delete image?",
                            message: "This image will be removed from the product.",
                            confirmLabel: "Delete",
                            danger: true,
                          });
                          if (!okConfirm) return;
                          startTransition(async () => {
                            await deleteProductImage(img.id, product!.id);
                            setImages((prev) => prev.filter((i) => i.id !== img.id));
                            router.refresh();
                          });
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {pendingImages.map((item) => (
                  <div className="img-chip" key={item.id}>
                    <img src={item.preview} alt="" />
                    <span className="cover">New</span>
                    <div className="img-chip-actions">
                      <button
                        type="button"
                        className="icon-mini"
                        onClick={() => removePending(item.id)}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 18 }} disabled={saving || !categories.length}>
            {saving ? <InlineSpinner label="Saving…" /> : "Save Product"}
          </button>
        </div>

        <div>
          <h3 style={{ marginBottom: 14 }}>Live preview</h3>
          <div className="card product-card static">
            <div className="imgwrap">
              {liveImg ? (
                <img src={liveImg} alt="" />
              ) : (
                <div style={{ height: "100%", background: "rgba(255,255,255,0.04)" }} />
              )}
              {disc > 0 && <div className="off-badge">{disc}% OFF</div>}
            </div>
            <div className="body">
              <div className="cat">{catName}</div>
              <h4>{name || "Product name"}</h4>
              <div className="price-row">
                <span className="old">{formatInr(mrp || 0)}</span>
                <span className="new">{formatInr(sale || 0)}</span>
              </div>
              <div className="qty-row">
                <div className="qty-selector">
                  <button type="button">−</button>
                  <span className="val">1</span>
                  <button type="button">+</button>
                </div>
                <button className="add-cart-btn" type="button">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
          {(images.length > 0 || pendingImages.length > 0) && (
            <div className="card static" style={{ marginTop: 18, padding: 16 }}>
              <div className="eyebrow">Gallery ({images.length + pendingImages.length})</div>
              <div className="pdp-thumbs">
                {images.map((img) => (
                  <button type="button" key={img.id}>
                    <img src={mediaUrl(img.path)} alt="" />
                  </button>
                ))}
                {pendingImages.map((item) => (
                  <button type="button" key={item.id}>
                    <img src={item.preview} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>
    </>
  );
}
