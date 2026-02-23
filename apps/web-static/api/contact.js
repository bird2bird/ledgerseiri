// api/contact.js
export default async function handler(req, res) {
  // Only POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const MAIL_FROM = process.env.MAIL_FROM;
    const MAIL_TO = process.env.MAIL_TO || "bird2bird2024@gmail.com";

    if (!RESEND_API_KEY || !MAIL_FROM) {
      return res.status(500).json({
        ok: false,
        error: "Server mail config missing. Set RESEND_API_KEY and MAIL_FROM.",
      });
    }

    // Parse JSON body
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const name = (body?.name || "").toString().trim();
    const email = (body?.email || "").toString().trim();
    const subject = (body?.subject || "").toString().trim();
    const message = (body?.message || "").toString().trim();

    // honeypot: if filled -> spam
    const company = (body?.company || "").toString().trim(); // hidden field
    if (company) {
      return res.status(200).json({ ok: true }); // pretend success
    }

    // minimal timing check (anti-bot)
    const startedAt = Number(body?.startedAt || 0);
    if (!startedAt || Date.now() - startedAt < 1200) {
      return res.status(429).json({ ok: false, error: "Too fast" });
    }

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: "Invalid email" });
    }

    // ----- Simple in-memory rate limit (per IP) -----
    // NOTE: Serverless instance memory is not shared across all instances.
    // Still useful for basic protection.
    const ip =
      (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      "unknown";

    globalThis.__rl = globalThis.__rl || new Map();
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 min
    const limit = 6; // 6 req / min / ip

    const entry = globalThis.__rl.get(ip) || { count: 0, ts: now };
    if (now - entry.ts > windowMs) {
      entry.count = 0;
      entry.ts = now;
    }
    entry.count += 1;
    globalThis.__rl.set(ip, entry);

    if (entry.count > limit) {
      return res.status(429).json({ ok: false, error: "Rate limited" });
    }
    // -----------------------------------------------

    const safeSubject = subject ? subject.slice(0, 120) : "（件名なし）";
    const mailSubject = `【LedgerSeiri お問い合わせ】${safeSubject}`;

    const text =
      `お名前：${name}\n` +
      `メール：${email}\n` +
      `件名：${safeSubject}\n\n` +
      `内容：\n${message}\n\n` +
      `----\n` +
      `From page: /contact\n` +
      `IP: ${ip}\n` +
      `UA: ${(req.headers["user-agent"] || "").toString()}\n`;

    const html =
      `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.6">` +
      `<h2 style="margin:0 0 12px">${escapeHtml(mailSubject)}</h2>` +
      `<p><b>お名前：</b>${escapeHtml(name)}</p>` +
      `<p><b>メール：</b>${escapeHtml(email)}</p>` +
      `<p><b>件名：</b>${escapeHtml(safeSubject)}</p>` +
      `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />` +
      `<pre style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e5e7eb;padding:12px;border-radius:10px">${escapeHtml(
        message
      )}</pre>` +
      `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />` +
      `<p style="color:#6b7280;font-size:12px;margin:0">From: /contact<br/>IP: ${escapeHtml(
        ip
      )}<br/>UA: ${escapeHtml((req.headers["user-agent"] || "").toString())}</p>` +
      `</div>`;

    // Send via Resend REST API (no dependency)
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [MAIL_TO],
        reply_to: email, // so you can reply directly to the user
        subject: mailSubject,
        text,
        html,
      }),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      return res.status(502).json({ ok: false, error: "Email send failed", detail: errText });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
