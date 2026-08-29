import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Please log in to send an enquiry." }, { status: 401 });
  }
  const body = await req.json();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 401 });

  const name = String(body.name || user.name).trim() || user.name;
  const phone = String(body.phone || user.phone || "").trim();
  const message = String(body.message || "").trim();
  if (!message || !phone) {
    return NextResponse.json({ error: "Message and phone are required." }, { status: 400 });
  }
  await prisma.lead.create({
    data: {
      userId: user.id,
      name,
      phone,
      interest: message.slice(0, 180),
      source: "Website Enquiry",
      status: "new",
      notes: message,
    },
  });
  revalidateTag("leads");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/customers");
  return NextResponse.json({ ok: true });
}
