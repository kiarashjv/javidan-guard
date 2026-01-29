const SESSION_KEY = "irp_session_id";

function getStoredSessionId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(SESSION_KEY);
}

function storeSessionId(sessionId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, sessionId);
}

export function getSessionId() {
  const existing = getStoredSessionId();
  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  storeSessionId(sessionId);
  return sessionId;
}

export function getClientMeta() {
  if (typeof navigator === "undefined") {
    return { userAgent: "unknown", ipHash: "unknown" };
  }

  return {
    userAgent: navigator.userAgent,
    ipHash: "unknown",
  };
}
