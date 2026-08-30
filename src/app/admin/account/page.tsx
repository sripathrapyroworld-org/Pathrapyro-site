import { auth } from "@/auth";
import { AdminAccountSecurity } from "@/components/admin-account-security";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminAccountPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/admin/login");

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  if (!admin?.email) redirect("/admin/login");

  return (
    <div className="admin-account-page">
      <div className="admin-section-head" style={{ marginBottom: 18 }}>
        <div>
          <h2>Account security</h2>
          <p className="cell-sub">Manage admin login email, password, and recovery settings.</p>
        </div>
      </div>
      <p className="cell-sub" style={{ marginBottom: 18 }}>
        Signed in as <strong>{admin.name}</strong>
      </p>
      <AdminAccountSecurity email={admin.email} />
    </div>
  );
}
