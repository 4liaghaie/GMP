from django.urls import path
from .views import (
    RegisteredOrderListCreateAPIView,
    RegisteredOrderDetailAPIView,
    RegisteredOrderVerifyAPIView,
    MarketplaceRegisteredOrderListAPIView,
    MarketplaceRegisteredOrderDetailAPIView,
    GoodsNeedListCreateAPIView,
    GoodsNeedDetailAPIView,
    MarketplaceGoodsNeedListAPIView,
)

urlpatterns = [
    path("registered-orders/", RegisteredOrderListCreateAPIView.as_view(), name="registeredorder-list-create"),
    path("registered-orders/<uuid:uuid>/", RegisteredOrderDetailAPIView.as_view(), name="registeredorder-detail"),
    path("registered-orders/<uuid:uuid>/verify/", RegisteredOrderVerifyAPIView.as_view(), name="registeredorder-verify"),
    path("marketplace/orders/", MarketplaceRegisteredOrderListAPIView.as_view()),
    path("marketplace/orders/<uuid:uuid>/", MarketplaceRegisteredOrderDetailAPIView.as_view()),
    path("goods-needs/", GoodsNeedListCreateAPIView.as_view(), name="goodsneed-list-create"),
    path("goods-needs/<uuid:uuid>/", GoodsNeedDetailAPIView.as_view(), name="goodsneed-detail"),
    path("marketplace/goods-needs/", MarketplaceGoodsNeedListAPIView.as_view()),
]
