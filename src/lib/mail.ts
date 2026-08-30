const RESEND_API = "https://api.resend.com/emails";

type MailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendMail(payload: MailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "Sri Pathra Pyro <onboarding@resend.dev>";

  if (!apiKey) {
    console.info("[mail:dev]", payload.to, payload.subject, payload.html.replace(/<[^>]+>/g, " ").trim());
    return { ok: true as const, dev: true };
  }

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("sendMail failed:", res.status, text);
    return { ok: false as const, error: "Could not send email. Check mail settings." };
  }

  return { ok: true as const, dev: false };
}

export async function sendAdminOtpEmail(to: string, code: string, kind: "reset" | "email_change") {
  const subject =
    kind === "reset"
      ? "Admin password reset code — Sri Pathra Pyro World"
      : "Confirm your new admin email — Sri Pathra Pyro World";
  const intro =
    kind === "reset"
      ? "Use this code to reset your admin password:"
      : "Use this code to confirm your new admin email address:";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:520px">
      <h2 style="margin:0 0 12px">Sri Pathra Pyro World</h2>
      <p>${intro}</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:18px 0">${code}</p>
      <p style="color:#666;font-size:14px">This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>
    </div>
  `;

  return sendMail({ to, subject, html });
}
