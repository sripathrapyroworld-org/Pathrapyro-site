import { AuthSession } from "@/components/auth-session";
import { AdminLoginForm } from "@/components/admin-login-form";

export default function AdminLoginPage() {
  return (
    <AuthSession>
      <AdminLoginForm />
    </AuthSession>
  );
}
