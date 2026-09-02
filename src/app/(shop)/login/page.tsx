import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata;

export default function LoginPage() {
  return (
    <section>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </section>
  );
}
