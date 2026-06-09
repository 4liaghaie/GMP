// src/lib/auth-api.ts
const API = process.env.NEXT_PUBLIC_API_BASE!;

const AUTH_EVENT = "auth-changed";

function emitAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

// ---- storage helpers ----
function getAccess() {
  return typeof window !== "undefined" ? localStorage.getItem("access") : null;
}
function getRefresh() {
  return typeof window !== "undefined" ? localStorage.getItem("refresh") : null;
}

/**
 * Persist tokens AND notify the app immediately (same-tab).
 */
function setTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);

  // ✅ important: update Navbar in the same tab without reload
  emitAuthChanged();
}

/**
 * Clear tokens AND notify the app immediately (same-tab).
 */
export function clearTokens() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("role");

  // also clear your otp leftovers if you want (optional)
  localStorage.removeItem("otp_step");
  localStorage.removeItem("otp_phone");
  localStorage.removeItem("reg_otp_step");
  localStorage.removeItem("reg_otp_phone");

  // ✅ important
  emitAuthChanged();
}

function firstErrorMessage(data: any, fallback: string) {
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;

  const keys = Object.keys(data);
  if (keys.length) {
    const v = data[keys[0]];
    if (typeof v === "string") return v;
    if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  }
  return fallback;
}

// ---- Auth endpoints ----

export async function login(payload: { email: string; password: string }) {
  if (!payload || typeof payload !== "object") {
    throw new Error("خطای داخلی: payload ورود باید یک آبجکت باشد.");
  }

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(firstErrorMessage(data, "خطا در ورود"));

  // ✅ FIX: Persist tokens on login too
  // adjust field names if your backend uses different keys
  if (typeof window !== "undefined") {
    if (data?.access) setTokens(data.access, data.refresh);
    if (data?.role) localStorage.setItem("role", data.role);
    // If role is not returned here, that's fine—Navbar only needs access token.
  }

  return data as {
    access: string;
    refresh?: string;
    role?: string;
    detail?: string;
  };
}

export async function register(payload: {
  password: string;
  password2: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone: string;
}) {
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(firstErrorMessage(data, "خطا در ثبت‌نام"));

  if (typeof window !== "undefined") {
    if (data?.access) setTokens(data.access, data.refresh);
    if (data?.role) localStorage.setItem("role", data.role);
  }

  return data as {
    access: string;
    refresh: string;
    role: string;
    detail?: string;
  };
}

// ---- Refresh token support ----

let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  const refresh = getRefresh();
  if (!refresh) {
    clearTokens();
    throw new Error("Refresh token وجود ندارد. لطفاً دوباره وارد شوید.");
  }

  const res = await fetch(`${API}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    clearTokens();
    throw new Error(
      firstErrorMessage(data, "نشست شما منقضی شده است. دوباره وارد شوید."),
    );
  }

  if (!data.access) {
    clearTokens();
    throw new Error("پاسخ refresh نامعتبر است.");
  }

  // ✅ this will also dispatch auth-changed
  setTokens(data.access, data.refresh);
  return data.access as string;
}

export async function authFetch(input: string, init: RequestInit = {}) {
  const access = getAccess();
  const headers: Record<string, string> = {
    ...(init.headers as any),
  };

  if (!headers["Content-Type"] && !(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (access) headers["Authorization"] = `Bearer ${access}`;

  const doFetch = (token?: string) =>
    fetch(input, {
      ...init,
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let res = await doFetch();
  if (res.status !== 401) return res;

  try {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const newAccess = await refreshPromise;
    res = await doFetch(newAccess);
    return res;
  } catch {
    return res;
  }
}

// ---- Me endpoints ----

export async function getMe() {
  const res = await authFetch(`${API}/me/`, { method: "GET" });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      clearTokens();
      throw new Error("برای ادامه باید دوباره وارد شوید.");
    }
    throw new Error(firstErrorMessage(data, "خطا در دریافت اطلاعات کاربر"));
  }

  return data as {
    id: number;
    username: string;
    phone: string | null;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

export async function updateProfile(payload: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}) {
  const res = await authFetch(`${API}/me/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      clearTokens();
      throw new Error("برای ادامه باید دوباره وارد شوید.");
    }
    throw new Error(firstErrorMessage(data, "خطا در ذخیره اطلاعات"));
  }

  return data;
}
