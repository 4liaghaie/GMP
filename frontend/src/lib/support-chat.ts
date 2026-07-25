import { authFetch } from "@/lib/auth-api";
import type { PaginatedResponse } from "@/lib/pagination";

const API = process.env.NEXT_PUBLIC_API_BASE;

export type SupportMessage = {
  id: number;
  body: string;
  sender_username: string;
  sender_role: "admin" | "user";
  is_mine: boolean;
  related_model: "general" | "registered_order" | "proforma";
  related_uuid: string;
  read_at: string | null;
  created_at: string;
};

export type SupportConversation = {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  last_message: SupportMessage | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

type MessagePayload = {
  body: string;
  related_model?: SupportMessage["related_model"];
  related_uuid?: string;
};

async function parseResponse<T>(res: Response, fallback: string): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : typeof data?.body?.[0] === "string"
          ? data.body[0]
          : fallback;
    throw new Error(detail);
  }
  return data as T;
}

export async function getSupportMessages() {
  const res = await authFetch(`${API}/support-chat/messages/`, {
    method: "GET",
    cache: "no-store",
  });
  return parseResponse<SupportMessage[]>(res, "خطا در دریافت پیام‌ها");
}

export async function sendSupportMessage(payload: MessagePayload) {
  const res = await authFetch(`${API}/support-chat/messages/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseResponse<SupportMessage>(res, "خطا در ارسال پیام");
}

export async function getAdminSupportConversations(params?: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const url = new URL(`${API}/admin/support-chat/conversations/`);
  if (params?.q) url.searchParams.set("q", params.q);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.pageSize)
    url.searchParams.set("page_size", String(params.pageSize));
  const res = await authFetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });
  return parseResponse<PaginatedResponse<SupportConversation>>(
    res,
    "خطا در دریافت گفتگوهای پشتیبانی",
  );
}

export async function getAdminSupportMessages(userId: number) {
  const res = await authFetch(
    `${API}/admin/support-chat/conversations/${userId}/messages/`,
    { method: "GET", cache: "no-store" },
  );
  return parseResponse<SupportMessage[]>(res, "خطا در دریافت پیام‌ها");
}

export async function sendAdminSupportMessage(
  userId: number,
  payload: MessagePayload,
) {
  const res = await authFetch(
    `${API}/admin/support-chat/conversations/${userId}/messages/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return parseResponse<SupportMessage>(res, "خطا در ارسال پاسخ");
}
