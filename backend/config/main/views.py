from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Q, Case, When, F, Min, Max, DecimalField, Avg, Count
from django.db import models
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import logging

from .models import Category, Product, Size, Subscriber, Review, Coupon
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductDetailSerializer,
    FilterParamsSerializer,
    SizeSerializer,
    ReviewSerializer,
    ReviewCreateSerializer,
    CouponSerializer,
    CouponValidateSerializer
)

logger = logging.getLogger(__name__)


def get_all_subcategory_ids(category):
    ids = [category.id]
    for child in category.children.all():
        ids.extend(get_all_subcategory_ids(child))
    return ids


class IndexView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.all()
        categories_serializer = CategorySerializer(categories, many=True)
        
        return Response({
            'categories': categories_serializer.data,
            'featured_products': self.get_featured_products(request)
        }, status=status.HTTP_200_OK)
    
    def get_featured_products(self, request):
        featured = Product.objects.filter(is_active=True).order_by('-created_at')[:8]
        return ProductSerializer(featured, many=True, context={'request': request}).data


class CatalogView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        filter_serializer = FilterParamsSerializer(data=request.query_params)
        if not filter_serializer.is_valid():
            return Response(filter_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        filters = filter_serializer.validated_data
        products = Product.objects.filter(is_active=True).select_related('category').prefetch_related('product_sizes__size')
        
        products = products.annotate(
            effective_price=Case(
                When(is_on_sale=True, then=F('sale_price')),
                default=F('price'),
                output_field=DecimalField(max_digits=10, decimal_places=2)
            ),
            average_rating=Avg('reviews__rating', filter=Q(reviews__is_approved=True))
        )

        category_slug = filters.get('category')
        current_category = None

        if category_slug:
            if category_slug == 'rasprodazha':
                products = products.filter(is_on_sale=True)
            else:
                current_category = get_object_or_404(Category, slug=category_slug)
                category_ids = get_all_subcategory_ids(current_category)
                products = products.filter(category_id__in=category_ids)
        
        query = filters.get('q', '')
        if query:
            products = products.filter(
                Q(name__icontains=query) | Q(description__icontains=query)
            )
        
        color = filters.get('color')
        if color:
            products = products.filter(color__iexact=color)
        
        min_price = filters.get('min_price')
        max_price = filters.get('max_price')
        
        if min_price is not None:
            products = products.filter(effective_price__gte=min_price)
        if max_price is not None:
            products = products.filter(effective_price__lte=max_price)
        
        size = filters.get('size')
        if size:
            products = products.filter(
                product_sizes__size__name__iexact=size,
                product_sizes__stock__gt=0
            ).distinct()
        
        sort = filters.get('sort')
        if sort == 'price_asc':
            products = products.order_by('effective_price')  
        elif sort == 'price_desc':
            products = products.order_by('-effective_price')  
        elif sort == 'name_asc':
            products = products.order_by('name')
        else:
            products = products.order_by('-created_at')
        
        page = filters.get('page', 1)
        page_size = filters.get('page_size', 20)
        
        paginator = Paginator(products, page_size)
        
        try:
            products_page = paginator.page(page)
        except PageNotAnInteger:
            products_page = paginator.page(1)
        except EmptyPage:
            products_page = paginator.page(paginator.num_pages)
        
        products_serializer = ProductSerializer(
            products_page, many=True, context={'request': request}
        )
        
        all_sizes = Size.objects.all()
        sizes_serializer = SizeSerializer(all_sizes, many=True)
        
        categories = Category.objects.all()
        categories_serializer = CategorySerializer(categories, many=True)
        
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
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    def get_price_range(self):
        price_stats = Product.objects.filter(is_active=True).annotate(
            effective_price=Case(
                When(is_on_sale=True, then=F('sale_price')),
                default=F('price'),
                output_field=DecimalField(max_digits=10, decimal_places=2)
            )
        ).aggregate(
            min_price=Min('effective_price'),
            max_price=Max('effective_price')
        )
        
        return {
            'min': float(price_stats['min_price']) if price_stats['min_price'] else 0,
            'max': float(price_stats['max_price']) if price_stats['max_price'] else 1000
        }


class ProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        
        related_products = Product.objects.filter(
            category=product.category, is_active=True
        ).exclude(id=product.id)[:4]
        
        product_serializer = ProductDetailSerializer(product, context={'request': request})
        related_serializer = ProductSerializer(related_products, many=True, context={'request': request})
        
        categories = Category.objects.all()
        categories_serializer = CategorySerializer(categories, many=True)
        
        return Response({
            'product': product_serializer.data,
            'related_products': related_serializer.data,
            'categories': categories_serializer.data,
            'current_category': product.category.slug if product.category else None
        }, status=status.HTTP_200_OK)


class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        root_categories = Category.objects.filter(parent__isnull=True).order_by('id')
        serializer = CategorySerializer(root_categories, many=True)
        return Response({'categories': serializer.data}, status=status.HTTP_200_OK)


class SearchSuggestionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        
        if not query or len(query) < 2:
            return Response({'suggestions': []}, status=status.HTTP_200_OK)
        
        products = Product.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query),
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
        
        categories = Category.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )[:5]
        
        for category in categories:
            suggestions.append({
                'id': category.id,
                'name': category.name,
                'slug': category.slug,
                'type': 'category'
            })
        
        return Response({'suggestions': suggestions[:10], 'query': query}, status=status.HTTP_200_OK)


class FilterOptionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        colors = Product.objects.filter(is_active=True).exclude(color__isnull=True).exclude(color='').values_list('color', flat=True).distinct()
        sizes = Size.objects.filter(
            product_sizes__stock__gt=0,
            product_sizes__product__is_active=True
        ).distinct()
        
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


class SubscribeView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        subscriber, created = Subscriber.objects.get_or_create(
            email=email,
            defaults={'is_active': True}
        )
        
        if not created and subscriber.is_active:
            return Response({'message': 'Вы уже подписаны на нашу рассылку!'}, status=status.HTTP_200_OK)
        
        if not created and not subscriber.is_active:
            subscriber.is_active = True
            subscriber.save()
        
        try:
            subject = 'Добро пожаловать в рассылку Mark Tailor!'
            message = f'''Здравствуйте!

Спасибо за подписку на нашу рассылку!

Мы будем присылать вам информацию о:
• Новых коллекциях
• Скидках и акциях
• Специальных предложениях
• Стильных образах

С уважением,
Команда Mark Tailor'''
            
            send_mail(subject, message, 'info@marktailor.com', [email], fail_silently=False)
            
            return Response({'message': 'Спасибо за подписку! Проверьте вашу почту.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Не удалось отправить письмо. Пожалуйста, попробуйте позже.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== ОТЗЫВЫ ====================

class ProductReviewListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        reviews = Review.objects.filter(product=product, is_approved=True)
        
        rating_stats = reviews.aggregate(
            avg_rating=Avg('rating'),
            total_reviews=Count('id'),
            rating_5=Count('rating', filter=Q(rating=5)),
            rating_4=Count('rating', filter=Q(rating=4)),
            rating_3=Count('rating', filter=Q(rating=3)),
            rating_2=Count('rating', filter=Q(rating=2)),
            rating_1=Count('rating', filter=Q(rating=1)),
        )
        
        serializer = ReviewSerializer(reviews, many=True, context={'request': request})
        
        return Response({
            'reviews': serializer.data,
            'stats': {
                'average_rating': float(rating_stats['avg_rating'] or 0),
                'total_reviews': rating_stats['total_reviews'],
                'distribution': {
                    5: rating_stats['rating_5'],
                    4: rating_stats['rating_4'],
                    3: rating_stats['rating_3'],
                    2: rating_stats['rating_2'],
                    1: rating_stats['rating_1'],
                }
            }
        }, status=status.HTTP_200_OK)


class ReviewCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        
        # Проверяем, не оставлял ли пользователь уже отзыв
        if Review.objects.filter(product=product, user=request.user).exists():
            return Response({
                'error': 'You have already reviewed this product'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Передаём product в контекст сериализатора
        serializer = ReviewCreateSerializer(
            data=request.data,
            context={'request': request, 'product': product}  # Добавляем product в контекст
        )
        
        if serializer.is_valid():
            review = serializer.save()
            return Response(
                ReviewSerializer(review, context={'request': request}).data, 
                status=status.HTTP_201_CREATED
            )
        
        print("Serializer errors:", serializer.errors)  # Для отладки
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReviewHelpfulView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, review_id):
        review = get_object_or_404(Review, id=review_id, is_approved=True)
        review.helpful_count += 1
        review.save()
        return Response({'helpful_count': review.helpful_count}, status=status.HTTP_200_OK)


class CanReviewView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        
        from orders.models import OrderItem
        has_purchased = OrderItem.objects.filter(
            order__user=request.user,
            order__status__in=['delivered', 'completed'],
            product=product
        ).exists()
        
        has_reviewed = Review.objects.filter(product=product, user=request.user).exists()
        
        return Response({
            'can_review': has_purchased and not has_reviewed,
            'has_purchased': has_purchased,
            'has_reviewed': has_reviewed
        }, status=status.HTTP_200_OK)


# ==================== ПРОМОКОДЫ ====================

class ValidateCouponView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        code = serializer.validated_data['code'].upper()
        cart_total = serializer.validated_data['cart_total']
        
        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response({'error': 'Промокод не найден'}, status=status.HTTP_404_NOT_FOUND)
        
        user = request.user if request.user.is_authenticated else None
        is_valid, message = coupon.is_valid(user, cart_total)
        
        if not is_valid:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
        
        discount_amount = coupon.calculate_discount(cart_total)
        
        return Response({
            'valid': True,
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_value': float(coupon.discount_value),
            'discount_amount': float(discount_amount),
            'final_total': float(cart_total - discount_amount),
            'message': f'Промокод применён! Скидка: {discount_amount:.2f} BYN'
        }, status=status.HTTP_200_OK)


class AvailableCouponsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        now = timezone.now()
        coupons = Coupon.objects.filter(
            is_active=True,
            valid_from__lte=now,
            valid_to__gte=now
        )[:10]
        
        serializer = CouponSerializer(coupons, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)