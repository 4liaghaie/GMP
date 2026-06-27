from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "phone", "role", "account_status", "is_active")
    list_filter = ("account_status", "role", "is_active")
    search_fields = ("username", "email", "phone", "first_name", "last_name")
