import type { UserNotification } from "@/lib/auth-api";

export function notificationTargetHref(
  item: Pick<UserNotification, "notification_type" | "related_model" | "related_uuid">,
  role?: string | null,
) {
  const model = String(item.related_model || "").trim();
  const uuid = String(item.related_uuid || "").trim();
  const isAdmin = role === "admin";
  const search = uuid ? `?search=${encodeURIComponent(uuid)}` : "";

  if (model === "registered_order") {
    if (isAdmin && item.notification_type === "submitted") return `/admin-orders${search}`;
    return uuid ? `/my-orders/${encodeURIComponent(uuid)}` : "/my-orders";
  }

  if (model === "proforma") {
    if (isAdmin && item.notification_type === "submitted") return `/admin-proformas${search}`;
    return uuid ? `/my-needs/${encodeURIComponent(uuid)}` : "/my-needs";
  }

  if (model === "user") {
    return `/user-management${search}`;
  }

  return "/notifications";
}
