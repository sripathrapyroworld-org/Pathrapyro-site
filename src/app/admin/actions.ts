"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { serializeComboItems, type ComboItemsData } from "@/lib/combo-items";
import { prisma } from "@/lib/prisma";
import { saveSettings, type SiteSettings, fromIstDatetimeLocal, DEFAULT_SETTINGS } from "@/lib/settings";
import { cartQuoteKey, currentCustomerCartKey, resetCustomerQuote } from "@/lib/cart-quote";
import { removeUpload, saveUpload } from "@/lib/uploads";
import { slugify } from "@/lib/utils";

type LeadStatus = "new" | "contacted" | "converted" | "lost";
type OfferApplies = "ALL" | "CATEGORY" | "COMBOS";
type OfferStatus = "active" | "paused" | "expired";
type ShipmentStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type ActionResult = { ok: true; id?: string; message?: string } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

function fail(error: unknown, fallback: string): ActionResult {
  const msg = error instanceof Error ? error.message : fallback;
  console.error(fallback, error);
  return { ok: false, error: msg || fallback };
}

export async function saveLead(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    if (!name || !phone) return { ok: false, error: "Name and phone are required." };
    const data = {
      name,
      phone,
      interest: String(formData.get("interest") || "").trim(),
      source: String(formData.get("source") || "Website Enquiry"),
      status: String(formData.get("status") || "new") as LeadStatus,
      notes: String(formData.get("notes") || ""),
      lastContact: new Date(),
    };
    if (id) {
      const existing = await prisma.lead.findUnique({ where: { id } });
      await prisma.lead.update({
        where: { id },
        data: { ...data, userId: existing?.userId },
      });
      if (existing?.userId) revalidatePath(`/admin/customers/${existing.userId}`);
    } else {
      const match = await prisma.user.findFirst({
        where: { role: "CUSTOMER", phone: { contains: phone.replace(/\D/g, "").slice(-10) || phone } },
      });
      await prisma.lead.create({ data: { ...data, userId: match?.id } });
      if (match?.id) revalidatePath(`/admin/customers/${match.id}`);
    }
    revalidatePath("/admin/leads");
    revalidatePath("/admin/customers");
    revalidatePath("/admin");
    revalidateTag("leads");
    return { ok: true, message: id ? "Lead updated." : "Lead created." };
  } catch (e) {
    return fail(e, "Could not save lead.");
  }
}

export async function deleteLead(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.lead.delete({ where: { id } });
    revalidatePath("/admin/leads");
    revalidatePath("/admin/customers");
    revalidatePath("/admin");
    revalidateTag("leads");
    return { ok: true, message: "Lead deleted." };
  } catch (e) {
    return fail(e, "Could not delete lead.");
  }
}

export async function saveOffer(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") || "");
    const appliesTo = String(formData.get("appliesTo") || "ALL") as OfferApplies;
    const data = {
      title: String(formData.get("title") || "").trim(),
      pct: Number(formData.get("pct") || 0),
      appliesTo,
      categoryId: appliesTo === "CATEGORY" ? String(formData.get("categoryId") || "") || null : null,
      startDate: new Date(String(formData.get("startDate"))),
      endDate: new Date(String(formData.get("endDate"))),
      status: String(formData.get("status") || "active") as OfferStatus,
    };
    if (!data.title) return { ok: false, error: "Offer title is required." };
    if (id) await prisma.offer.update({ where: { id }, data });
    else await prisma.offer.create({ data });
    revalidatePath("/admin/offers");
    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/combos");
    return { ok: true, message: "Offer saved." };
  } catch (e) {
    return fail(e, "Could not save offer.");
  }
}

export async function deleteOffer(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.offer.delete({ where: { id } });
    revalidatePath("/admin/offers");
    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/combos");
    return { ok: true, message: "Offer deleted." };
  } catch (e) {
    return fail(e, "Could not delete offer.");
  }
}

export async function saveBusinessSettings(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const data: SiteSettings = {
      businessName: String(formData.get("businessName") || ""),
      tagline: String(formData.get("tagline") || ""),
      gstin: String(formData.get("gstin") || ""),
      license: String(formData.get("license") || ""),
      address: String(formData.get("address") || ""),
      cityLine: String(formData.get("cityLine") || ""),
      phone: String(formData.get("phone") || ""),
      phone2: String(formData.get("phone2") || ""),
      whatsapp: String(formData.get("whatsapp") || ""),
      email: String(formData.get("email") || ""),
      hours: String(formData.get("hours") || ""),
      mapEmbed: String(formData.get("mapEmbed") || ""),
      marquee: String(formData.get("marquee") || ""),
      gstPercent: Math.max(0, Number(formData.get("gstPercent") || 0) || 0),
      packingCharge: Math.max(0, Math.round(Number(formData.get("packingCharge") || 0) || 0)),
      countdownEnabled: formData.get("countdownEnabled") === "on",
      countdownEyebrow: String(formData.get("countdownEyebrow") || "").trim() || DEFAULT_SETTINGS.countdownEyebrow,
      countdownHeading: String(formData.get("countdownHeading") || "").trim() || DEFAULT_SETTINGS.countdownHeading,
      countdownEndsAt: fromIstDatetimeLocal(String(formData.get("countdownEndsAt") || "")),
      countdownNote: String(formData.get("countdownNote") || "").trim(),
      countdownButtonLabel: String(formData.get("countdownButtonLabel") || "").trim() || DEFAULT_SETTINGS.countdownButtonLabel,
    };
    await saveSettings(data);
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidateTag("site-settings");
  return { ok: true, message: "Settings saved." };
  } catch (e) {
    return fail(e, "Could not save settings.");
  }
}

export async function saveCustomerQuote(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const userId = String(formData.get("userId") || "").trim();
    if (!userId) return { ok: false, error: "Customer not found." };
    const packingCharge = Math.max(0, Math.round(Number(formData.get("packingCharge") || 0) || 0));
    const shippingCharge = Math.max(0, Math.round(Number(formData.get("shippingCharge") || 0) || 0));
    const quoteReady = formData.get("quoteReady") === "on";
    const cartKey = await currentCustomerCartKey(userId);
    if (quoteReady && !cartKey) {
      return { ok: false, error: "Customer cart is empty. Cannot approve checkout without items." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        packingCharge,
        shippingCharge,
        quoteReady,
        quoteCartKey: quoteReady ? cartKey : "",
      },
    });

    revalidatePath(`/admin/customers/${userId}`);
    revalidatePath("/admin/customers");
    revalidatePath("/cart");
    revalidatePath("/checkout");
    revalidateTag("carts");
    return { ok: true, message: quoteReady ? "Quote saved. Customer can checkout now." : "Charges saved." };
  } catch (e) {
    return fail(e, "Could not save customer quote.");
  }
}

export async function saveCategory(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "Category name is required." };
    const emoji = String(formData.get("emoji") || "🎆").trim() || "🎆";
    const description = String(formData.get("description") || "").trim() || `${name} crackers and fireworks.`;
    let coverPath: string | undefined;
    const file = formData.get("cover") as File | null;
    if (file && typeof file !== "string" && file.size) {
      coverPath = await saveUpload(file, "categories");
    }
    if (id) {
      await prisma.category.update({
        where: { id },
        data: {
          name,
          emoji,
          description,
          ...(coverPath ? { coverPath } : {}),
        },
      });
      revalidatePath("/admin/products");
    revalidatePath(`/admin/products/category/${id}`);
    revalidatePath("/");
    revalidatePath("/shop");
    revalidateTag("categories");
    return { ok: true, id, message: "Category updated." };
    }
    const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
    const created = await prisma.category.create({
      data: {
        name,
        slug: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
        emoji,
        description,
        coverPath,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/shop");
    revalidateTag("categories");
    return { ok: true, id: created.id, message: "Category created." };
  } catch (e) {
    return fail(e, "Could not save category.");
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      return { ok: false, error: `Move or delete ${count} product(s) in this category first.` };
    }
    await prisma.category.delete({ where: { id } });
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/shop");
    return { ok: true, message: "Category deleted." };
  } catch (e) {
    return fail(e, "Could not delete category.");
  }
}

export async function saveProduct(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    const categoryId = String(formData.get("categoryId") || "").trim();
    if (!name) return { ok: false, error: "Product name is required." };
    if (!categoryId) return { ok: false, error: "Please select a category." };
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) return { ok: false, error: "Selected category was not found." };

    const payload = {
      name,
      description: String(formData.get("description") || ""),
      categoryId,
      mrp: Number(formData.get("mrp") || 0),
      salePrice: Number(formData.get("salePrice") || 0),
      stock: Number(formData.get("stock") || 0),
      featured: formData.get("featured") === "on",
      active: formData.get("active") !== "off",
      popularity: Number(formData.get("popularity") || 0.5),
    };

    let productId = id;
    if (id) {
      await prisma.product.update({ where: { id }, data: payload });
    } else {
      const created = await prisma.product.create({
        data: {
          ...payload,
          slug: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
        },
      });
      productId = created.id;
    }

    const files = formData.getAll("images") as File[];
    const existingImages = await prisma.productImage.count({ where: { productId } });
    let sort = existingImages;
    for (const file of files) {
      if (!file || typeof file === "string" || !file.size) continue;
      const path = await saveUpload(file, "products");
      await prisma.productImage.create({
        data: {
          productId,
          path,
          alt: name,
          sortOrder: sort,
          isCover: existingImages === 0 && sort === 0,
        },
      });
      sort += 1;
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/category/${categoryId}`);
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/shop");
    revalidatePath("/");
    return { ok: true, id: productId, message: "Product saved." };
  } catch (e) {
    return fail(e, "Could not save product.");
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!product) return { ok: false, error: "Product not found." };
    for (const img of product.images) await removeUpload(img.path);
    await prisma.product.delete({ where: { id } });
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/category/${product.categoryId}`);
    revalidatePath("/shop");
    return { ok: true, message: "Product deleted." };
  } catch (e) {
    return fail(e, "Could not delete product.");
  }
}

export async function deleteProductImage(id: string, productId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const img = await prisma.productImage.findUnique({ where: { id } });
    await prisma.productImage.delete({ where: { id } });
    if (img) await removeUpload(img.path);
    const first = await prisma.productImage.findFirst({
      where: { productId },
      orderBy: { sortOrder: "asc" },
    });
    if (first) await prisma.productImage.update({ where: { id: first.id }, data: { isCover: true } });
    revalidatePath(`/admin/products/${productId}`);
    return { ok: true };
  } catch (e) {
    return fail(e, "Could not delete image.");
  }
}

export async function setCoverImage(id: string, productId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.productImage.updateMany({ where: { productId }, data: { isCover: false } });
    await prisma.productImage.update({ where: { id }, data: { isCover: true } });
    revalidatePath(`/admin/products/${productId}`);
    return { ok: true };
  } catch (e) {
    return fail(e, "Could not set cover image.");
  }
}

export async function reorderProductImages(productId: string, imageIds: string[]): Promise<ActionResult> {
  try {
    await requireAdmin();
    for (let i = 0; i < imageIds.length; i++) {
      await prisma.productImage.update({
        where: { id: imageIds[i] },
        data: { sortOrder: i, isCover: i === 0 },
      });
    }
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/shop");
    return { ok: true };
  } catch (e) {
    return fail(e, "Could not reorder images.");
  }
}

export async function saveCombo(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "Combo name is required." };

    let itemsData: ComboItemsData = { products: [], extras: [] };
    const itemsRaw = String(formData.get("itemsJson") || "");
    if (itemsRaw) {
      try {
        const parsed = JSON.parse(itemsRaw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          itemsData = {
            products: Array.isArray(parsed.products) ? parsed.products : [],
            extras: Array.isArray(parsed.extras) ? parsed.extras : [],
          };
        } else if (Array.isArray(parsed)) {
          itemsData = {
            products: parsed.filter((x) => x && typeof x === "object" && x.id),
            extras: parsed.filter((x) => typeof x === "string"),
          };
        }
      } catch {
        itemsData = {
          products: [],
          extras: String(formData.get("items") || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        };
      }
    } else {
      itemsData = {
        products: [],
        extras: String(formData.get("items") || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
    }

    const data = {
      name,
      tier: String(formData.get("tier") || ""),
      itemsJson: serializeComboItems(itemsData),
      mrp: Number(formData.get("mrp") || 0),
      salePrice: Number(formData.get("salePrice") || 0),
      active: formData.get("active") !== "off",
    };

    let comboId = id;
    const file = formData.get("image") as File | null;
    let imagePath: string | undefined;
    if (file && typeof file !== "string" && file.size) {
      imagePath = await saveUpload(file, "combos");
    }

    if (id) {
      const existing = await prisma.comboPack.findUnique({ where: { id } });
      if (existing?.imagePath && imagePath) await removeUpload(existing.imagePath);
      await prisma.comboPack.update({
        where: { id },
        data: { ...data, ...(imagePath ? { imagePath } : {}) },
      });
    } else {
      const created = await prisma.comboPack.create({
        data: {
          ...data,
          slug: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
          imagePath,
        },
      });
      comboId = created.id;
    }

    revalidatePath("/admin/combos");
    revalidatePath(`/admin/combos/${comboId}`);
    revalidatePath("/combos");
    revalidatePath("/");
    return { ok: true, id: comboId, message: "Combo saved." };
  } catch (e) {
    return fail(e, "Could not save combo.");
  }
}

export async function deleteCombo(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const combo = await prisma.comboPack.findUnique({ where: { id } });
    if (combo?.imagePath) await removeUpload(combo.imagePath);
    await prisma.comboPack.delete({ where: { id } });
    revalidatePath("/admin/combos");
    revalidatePath("/combos");
    return { ok: true, message: "Combo deleted." };
  } catch (e) {
    return fail(e, "Could not delete combo.");
  }
}

type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export async function updateOrderPayment(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const orderId = String(formData.get("orderId") || "").trim();
    const paymentStatus = String(formData.get("paymentStatus") || "") as PaymentStatus;
    const allowed: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];
    if (!orderId) return { ok: false, error: "Order not found." };
    if (!allowed.includes(paymentStatus)) return { ok: false, error: "Invalid payment status." };

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });
    if (!order) return { ok: false, error: "Order not found." };

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus },
    });

    if (paymentStatus === "paid" && order.shipment && order.shipment.status === "placed") {
      await prisma.shipment.update({
        where: { id: order.shipment.id },
        data: { status: "confirmed", note: "Payment marked as paid by admin" },
      });
      await prisma.shipmentEvent.create({
        data: {
          shipmentId: order.shipment.id,
          status: "confirmed",
          note: "Payment received — marked paid by admin",
        },
      });
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/sales");
    revalidatePath("/admin");
    return { ok: true, message: `Payment status updated to ${paymentStatus}.` };
  } catch (e) {
    return fail(e, "Could not update payment status.");
  }
}

export async function updateShipment(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const orderId = String(formData.get("orderId"));
    const status = String(formData.get("status")) as ShipmentStatus;
    const note = String(formData.get("note") || "");
    const shipment = await prisma.shipment.findUnique({ where: { orderId } });
    if (!shipment) return { ok: false, error: "Shipment not found." };
    await prisma.shipment.update({ where: { id: shipment.id }, data: { status, note } });
    await prisma.shipmentEvent.create({ data: { shipmentId: shipment.id, status, note } });
    const files = formData.getAll("photos") as File[];
    const caption = String(formData.get("caption") || "");
    for (const file of files) {
      if (!file || typeof file === "string" || !file.size) continue;
      const path = await saveUpload(file, "tracking");
      await prisma.shipmentPhoto.create({
        data: { shipmentId: shipment.id, path, caption, stage: status },
      });
    }
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true, message: "Shipment updated." };
  } catch (e) {
    return fail(e, "Could not update shipment.");
  }
}

/** @deprecated use deleteProduct — kept for any leftover form binds */
export async function deleteProductRedirectSafe(id: string) {
  const res = await deleteProduct(id);
  if (res.ok) redirect("/admin/products");
  return res;
}
