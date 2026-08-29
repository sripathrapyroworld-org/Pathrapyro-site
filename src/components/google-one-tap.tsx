"use client";

import { useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

const GSI_SRC = "https://accounts.google.com/gsi/client";

function loadGsiScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
  if (existing?.dataset.loaded === "true") return Promise.resolve();
  if (existing) {
    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("GSI load failed")), { once: true });
    });
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("GSI load failed"));
    document.head.appendChild(script);
  });
}

export function GoogleOneTap() {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const prompted = useRef(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || status !== "unauthenticated") return;
    if (pathname.startsWith("/admin")) return;
    if (prompted.current) return;

    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || prompted.current || !window.google?.accounts?.id) return;
        prompted.current = true;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            const result = await signIn("google-onetap", {
              credential: response.credential,
              redirect: false,
            });
            if (!result?.error) {
              router.refresh();
            }
          },
          auto_select: true,
          cancel_on_tap_outside: false,
          context: "signin",
          itp_support: true,
        });

        window.google.accounts.id.prompt();
      })
      .catch(() => {
        prompted.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, pathname, router, status]);

  return null;
}

export function GoogleSignInButton({
  callbackUrl = "/account",
  label = "Continue with Google",
}: {
  callbackUrl?: string;
  label?: string;
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  return (
    <button
      type="button"
      className="btn btn-google btn-block"
      onClick={() => signIn("google", { callbackUrl })}
    >
      <GoogleMark />
      {label}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.083 36 24 36c-5.523 0-10-4.477-10-10s4.477-10 10-10c2.396 0 4.597.84 6.327 2.236l5.657-5.657C33.64 9.053 29.082 7 24 7 12.954 7 4 15.954 4 27s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c2.396 0 4.597.84 6.327 2.236l5.657-5.657C33.64 9.053 29.082 7 24 7 12.954 7 4 15.954 4 27c0 3.592 1.048 6.936 2.856 9.753l6.45-5.062z"
      />
      <path
        fill="#4CAF50"
        d="M24 47c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 38.091 26.715 39 24 39c-5.099 0-9.445-3.243-11.037-7.771l-6.522 5.025C8.488 42.556 15.8 47 24 47z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C41.38 36.091 44 31.546 44 27c0-2.386-.455-4.673-1.389-6.917z"
      />
    </svg>
  );
}
