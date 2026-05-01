from django.contrib import admin
from .models import Category, Size, Product, ProductImage, ProductSize


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductSizeInline(admin.TabularInline):
    model = ProductSize
    extra = 1


class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'color', 'price']
    list_filter = ['category', 'color']
    search_fields = ['name', 'color', 'description']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline, ProductSizeInline]


class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'slug']
    prepopulated_fields = {'slug': ('name',)}

    #list_filter = ('parent',)
    #search_fields = ('name', 'slug')
    #list_select_related = ('parent',)
    
    #fieldsets = (
    #    ('Основная информация', {
    #        'fields': ('name', 'slug', 'parent')
    #    }),
    #    ('Контент', {
    #        'fields': ('description', 'image')
    #    }),
    #)


class SizeAdmin(admin.ModelAdmin):
    list_display = ['name']


admin.site.register(Category, CategoryAdmin)
admin.site.register(Size, SizeAdmin)
admin.site.register(Product, ProductAdmin)