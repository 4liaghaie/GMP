
from django.contrib import admin
from .models import HSCode, Heading, Season

@admin.register(Heading)
class HeadingAdmin(admin.ModelAdmin):
    list_display = ('code', 'description')
@admin.register(HSCode)
class HSCodeAdmin (admin.ModelAdmin):
    list_display = ('code','goods_name_en')
@admin.register(Season)
class SeasonAdmin (admin.ModelAdmin):
    list_display = ('code','description')
