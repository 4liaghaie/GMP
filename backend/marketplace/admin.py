from django.contrib import admin
from .models import RegisteredOrder, OrderGood

@admin.register(RegisteredOrder)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "order_number", "user", "verified", "total_value", "created_at")
    list_filter = ("verified",)
    search_fields = ("order_number", "user__username", "user__phone")

@admin.register(OrderGood)
class GoodAdmin(admin.ModelAdmin):
    list_display = ("description","hs_code")
