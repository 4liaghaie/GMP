// src/lib/auth-api.ts
const API = process.env.NEXT_PUBLIC_API_BASE!;

// ---- storage helpers ----
function getAccess() {
  return typeof window !== "undefined" ? localStorage.getItem("access") : null;
}
function getRefresh() {
  return typeof window !== "undefined" ? localStorage.getItem("refresh") : null;
}
function setTokens(access: string, refresh?: string) {
  localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
}
export function clearTokens() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("role");
}

function firstErrorMessage(data: any, fallback: string) {
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;

  // Field errors: {username: ["..."], password: ["..."]}
  const keys = Object.keys(data);
  if (keys.length) {
    const v = data[keys[0]];
    if (typeof v === "string") return v;
    if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  }
  return fallback;
}

// ---- Auth endpoints (NEW: username/password) ----

export async function login(payload: { username: string; password: string }) {
  if (!payload || typeof payload !== "object") {
    throw new Error("خطای داخلی: payload ورود باید یک آبجکت باشد.");
  }

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: payload.username,
      password: payload.password,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail ?? "خطا در ورود");
  // persist tokens...
  return data;
}

export async function register(payload: {
  username: string;
  password: string;
  password2: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}) {
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(firstErrorMessage(data, "خطا در ثبت‌نام"));

  // Persist tokens here (recommended)
  if (typeof window !== "undefined") {
    setTokens(data.access, data.refresh);
    localStorage.setItem("role", data.role);
  }

  return data as {
    access: string;
    refresh: string;
    role: string;
    detail?: string;
  };
}

// ---- Refresh token support ----

// Prevent multiple refresh calls racing at the same time
let refreshPromise: Promise<string> | null = null;

/**
 * Refresh access token using refresh token.
 * Returns the new access token, also stored in localStorage.
 */
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
      firstErrorMessage(data, "نشست شما منقضی شده است. دوباره وارد شوید.")
    );
  }

  if (!data.access) {
    clearTokens();
    throw new Error("پاسخ refresh نامعتبر است.");
  }

  // If ROTATE enabled, backend may also return refresh
  setTokens(data.access, data.refresh);
  return data.access as string;
}

/**
 * Fetch wrapper that:
 * - attaches Authorization header
 * - on 401, refreshes access once and retries
 */
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

// ---- Me endpoints (NEW: replaces complete-profile) ----

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

  // your MeView returns updated user object in PATCH (per backend)
  return data;
}
