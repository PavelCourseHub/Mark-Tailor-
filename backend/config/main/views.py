from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
import logging

from .models import Category, Product, Size
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductDetailSerializer,
    FilterParamsSerializer,
    PaginatedProductSerializer,
    SizeSerializer
)

def get_all_subcategory_ids(category):
    """
    Рекурсивно собирает ID категории и всех её подкатегорий
    """
    ids = [category.id]
    for child in category.children.all():
        ids.extend(get_all_subcategory_ids(child))
    return ids

logger = logging.getLogger(__name__)


class IndexView(APIView):
    """
    Главная страница с категориями
    """
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.all()
        categories_serializer = CategorySerializer(categories, many=True)
        
        return Response({
            'categories': categories_serializer.data,
            'featured_products': self.get_featured_products(request)
        }, status=status.HTTP_200_OK)
    
    def get_featured_products(self, request):
        """Получить рекомендуемые/популярные товары"""
        featured = Product.objects.filter(is_active=True).order_by('-created_at')[:8]
        return ProductSerializer(featured, many=True, context={'request': request}).data


class CatalogView(APIView):
    """
    Каталог товаров с фильтрацией, поиском и пагинацией
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # Валидируем параметры фильтрации
        filter_serializer = FilterParamsSerializer(data=request.query_params)
        if not filter_serializer.is_valid():
            return Response(filter_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        filters = filter_serializer.validated_data
        
        # Начинаем с базового queryset
        products = Product.objects.filter(is_active=True).select_related('category').prefetch_related('product_sizes__size')
        
        # Фильтрация по категории
        category_slug = filters.get('category')
        current_category = None

        if category_slug:
            if category_slug == 'rasprodazha':
                products = products.filter(is_on_sale=True)
            else:
                current_category = get_object_or_404(Category, slug=category_slug)
                category_ids = get_all_subcategory_ids(current_category)
                products = products.filter(category_id__in=category_ids)
        
        # Поиск по названию и описанию
        query = filters.get('q', '')
        if query:
            products = products.filter(
                Q(name__icontains=query) | 
                Q(description__icontains=query)
            )
        
        # Фильтрация по цвету
        color = filters.get('color')
        if color:
            products = products.filter(color__iexact=color)
        
        # Фильтрация по цене
        min_price = filters.get('min_price')
        if min_price is not None:
            products = products.filter(price__gte=min_price)
        
        max_price = filters.get('max_price')
        if max_price is not None:
            products = products.filter(price__lte=max_price)
        
        # Фильтрация по размеру
        size = filters.get('size')
        if size:
            products = products.filter(product_sizes__size__name__iexact=size)
        
        # Сортировка
        sort = filters.get('sort')
        if sort:
            if sort == 'price_asc':
                products = products.order_by('price')
            elif sort == 'price_desc':
                products = products.order_by('-price')
            elif sort == 'name_asc':
                products = products.order_by('name')
            else:  # newest
                products = products.order_by('-created_at')
        else:
            products = products.order_by('-created_at')
        
        # Пагинация
        page = filters.get('page', 1)
        page_size = filters.get('page_size', 20)
        
        paginator = Paginator(products, page_size)
        
        try:
            products_page = paginator.page(page)
        except PageNotAnInteger:
            products_page = paginator.page(1)
        except EmptyPage:
            products_page = paginator.page(paginator.num_pages)
        
        # Сериализуем результаты
        products_serializer = ProductSerializer(
            products_page, 
            many=True, 
            context={'request': request}
        )
        
        # Получаем все доступные размеры для фильтра
        all_sizes = Size.objects.all()
        sizes_serializer = SizeSerializer(all_sizes, many=True)
        
        # Получаем все категории
        categories = Category.objects.all()
        categories_serializer = CategorySerializer(categories, many=True)
        
        # Формируем ответ
        response_data = {
            'products': products_serializer.data,
            'pagination': {
                'current_page': products_page.number,
                'total_pages': paginator.num_pages,
                'total_items': paginator.count,
                'page_size': page_size,
                'has_next': products_page.has_next(),
                'has_previous': products_page.has_previous(),
            },
            'filter_params': filter_serializer.data,
            'available_filters': {
                'categories': categories_serializer.data,
                'sizes': sizes_serializer.data,
                'price_range': self.get_price_range(),
            },
            'current_category': {
                'slug': category_slug,
                'name': current_category.name if current_category else None
            } if category_slug else None,
            'search_query': query
        }
        
        # Добавляем флаги для UI (если нужно)
        if filters.get('show_filters'):
            response_data['show_filters'] = True
        if filters.get('show_search'):
            response_data['show_search'] = True
        if filters.get('reset_search'):
            response_data['reset_search'] = True
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    def get_price_range(self):
        """Получить диапазон цен для фильтра"""
        from django.db import models
        min_price = Product.objects.aggregate(min_price=models.Min('price'))['min_price']
        max_price = Product.objects.aggregate(max_price=models.Max('price'))['max_price']
        return {
            'min': float(min_price) if min_price else 0,
            'max': float(max_price) if max_price else 1000
        }


class ProductDetailView(APIView):
    """
    Детальная страница товара
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        
        # Получаем связанные товары
        related_products = Product.objects.filter(
            category=product.category,
            is_active=True
        ).exclude(id=product.id)[:4]
        
        # Сериализуем данные
        product_serializer = ProductDetailSerializer(
            product, 
            context={'request': request}
        )
        related_serializer = ProductSerializer(
            related_products, 
            many=True, 
            context={'request': request}
        )
        
        # Получаем все категории для навигации
        categories = Category.objects.all()
        categories_serializer = CategorySerializer(categories, many=True)
        
        return Response({
            'product': product_serializer.data,
            'related_products': related_serializer.data,
            'categories': categories_serializer.data,
            'current_category': product.category.slug if product.category else None
        }, status=status.HTTP_200_OK)


class CategoryListView(APIView):
    """
    Список всех категорий
    """
    permission_classes = [AllowAny]

    def get(self, request):
        #categories = Category.objects.all()
        #serializer = CategorySerializer(categories, many=True)

        # Получаем только корневые категории (без родителей)
        root_categories = Category.objects.filter(parent__isnull=True).order_by('id')
        serializer = CategorySerializer(root_categories, many=True)
        
        return Response({
            'categories': serializer.data
        }, status=status.HTTP_200_OK)


class SearchSuggestionsView(APIView):
    """
    Поисковые подсказки (автокомплит)
    """
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        
        if not query or len(query) < 2:
            return Response({
                'suggestions': []
            }, status=status.HTTP_200_OK)
        
        # Ищем товары по названию
        products = Product.objects.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query),
            is_active=True
        )[:10]
        
        suggestions = []
        for product in products:
            suggestions.append({
                'id': product.id,
                'name': product.name,
                'slug': product.slug,
                'price': str(product.price),
                'image_url': product.main_image.url if product.main_image else None,
                'type': 'product'
            })
        
        # Ищем категории
        categories = Category.objects.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query)
        )[:5]
        
        for category in categories:
            suggestions.append({
                'id': category.id,
                'name': category.name,
                'slug': category.slug,
                'type': 'category'
            })
        
        return Response({
            'suggestions': suggestions[:10],  # Ограничиваем до 10 результатов
            'query': query
        }, status=status.HTTP_200_OK)


class FilterOptionsView(APIView):
    """
    Получение доступных опций для фильтрации
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # Получаем уникальные значения для фильтров
        colors = Product.objects.filter(is_active=True).exclude(color__isnull=True).exclude(color='').values_list('color', flat=True).distinct()
        sizes = Size.objects.all()
        
        price_range = Product.objects.filter(is_active=True).aggregate(
            min_price=models.Min('price'),
            max_price=models.Max('price')
        )
        
        return Response({
            'colors': list(colors),
            'sizes': SizeSerializer(sizes, many=True).data,
            'price_range': {
                'min': float(price_range['min_price']) if price_range['min_price'] else 0,
                'max': float(price_range['max_price']) if price_range['max_price'] else 1000
            }
        }, status=status.HTTP_200_OK)