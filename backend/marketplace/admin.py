from django.contrib import admin
from .models import (
    GoodsNeed,
    Notification,
    OrderGood,
    RegisteredOrder,
    SupportConversation,
    SupportMessage,
)

@admin.register(RegisteredOrder)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "order_number", "user", "verified", "rejected", "total_value", "created_at")
    list_filter = ("verified", "rejected")
    search_fields = ("order_number", "user__username", "user__phone")

@admin.register(OrderGood)
class GoodAdmin(admin.ModelAdmin):
    list_display = ("description","hs_code")


@admin.register(GoodsNeed)
class GoodsNeedAdmin(admin.ModelAdmin):
    list_display = ("id", "uuid", "user", "verified", "rejected", "status", "created_at")
    list_filter = ("verified", "rejected", "status")
    search_fields = ("uuid", "user__username", "user__phone")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "notification_type", "related_model", "related_uuid", "read", "created_at")
    list_filter = ("notification_type", "read", "related_model")
    search_fields = ("user__username", "title", "message", "related_uuid")


@admin.register(SupportConversation)
class SupportConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "last_message_at", "updated_at")
    search_fields = ("user__username", "user__email", "user__phone")


@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "related_model", "read_at", "created_at")
    list_filter = ("related_model", "read_at")
    search_fields = ("sender__username", "conversation__user__username", "body", "related_uuid")
