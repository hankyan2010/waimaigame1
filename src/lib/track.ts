const API_BASE = "/api";

export function track(event: string, data?: Record<string, unknown>) {
  try {
    const body = JSON.stringify({ event, ...data, ts: Date.now() });
    // Use sendBeacon for reliability (works even on page unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${API_BASE}/track`, body);
    } else {
      fetch(`${API_BASE}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Silently fail - tracking should never break the app
  }
}
