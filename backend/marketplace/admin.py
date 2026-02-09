from django.contrib import admin
from .models import RegisteredOrder, OrderGood

@admin.register(RegisteredOrder)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "total_value")

@admin.register(OrderGood)
class GoodAdmin(admin.ModelAdmin):
    list_display = ("description","hs_code")
