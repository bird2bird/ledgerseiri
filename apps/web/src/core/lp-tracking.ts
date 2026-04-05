export type LpTrackPayload = {
  path: string;
  locale?: string | null;
  eventType?: string;
  ctaName?: string | null;
};

function getOrCreateStorageKey(key: string) {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = `${key}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  window.localStorage.setItem(key, value);
  return value;
}

function getUtm(name: string) {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

export async function trackLpEvent(payload: LpTrackPayload) {
  if (typeof window === "undefined") return;

  const body = {
    ...payload,
    referrer: document.referrer || null,
    visitorId: getOrCreateStorageKey("ls_lp_visitor_id"),
    sessionId: getOrCreateStorageKey("ls_lp_session_id"),
    utmSource: getUtm("utm_source"),
    utmMedium: getUtm("utm_medium"),
    utmCampaign: getUtm("utm_campaign"),
    utmTerm: getUtm("utm_term"),
    utmContent: getUtm("utm_content"),
  };

  try {
    await fetch("/api/platform/lp-analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {}
}


export type LpConversionPayload = {
  eventType: string;
  email?: string | null;
  userId?: string | null;
  ctaName?: string | null;
  source?: string | null;
  locale?: string | null;
  referrer?: string | null;
  path?: string | null;
};

export async function trackLpConversionEvent(payload: LpConversionPayload) {
  if (typeof window === "undefined") return;

  const body = {
    ...payload,
    visitorId: window.localStorage.getItem("ls_lp_visitor_id") || null,
    sessionId: window.localStorage.getItem("ls_lp_session_id") || null,
  };

  try {
    await fetch("/api/platform/lp-analytics/conversion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {}
}
