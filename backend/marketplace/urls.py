from django.urls import path
from .views import (
    RegisteredOrderListCreateAPIView,
    RegisteredOrderDetailAPIView,
    RegisteredOrderVerifyAPIView,
    MarketplaceRegisteredOrderListAPIView,
    MarketplaceRegisteredOrderDetailAPIView,
    GoodsNeedListCreateAPIView,
    GoodsNeedDetailAPIView,
    GoodsNeedVerifyAPIView,
    MarketplaceGoodsNeedListAPIView,
    NotificationListAPIView,
    NotificationMarkReadAPIView,
)

urlpatterns = [
    path("registered-orders/", RegisteredOrderListCreateAPIView.as_view(), name="registeredorder-list-create"),
    path("registered-orders/<str:uuid>/", RegisteredOrderDetailAPIView.as_view(), name="registeredorder-detail"),
    path("registered-orders/<str:uuid>/verify/", RegisteredOrderVerifyAPIView.as_view(), name="registeredorder-verify"),
    path("marketplace/orders/", MarketplaceRegisteredOrderListAPIView.as_view()),
    path("marketplace/orders/<str:uuid>/", MarketplaceRegisteredOrderDetailAPIView.as_view()),
    path("goods-needs/", GoodsNeedListCreateAPIView.as_view(), name="goodsneed-list-create"),
    path("goods-needs/<str:uuid>/", GoodsNeedDetailAPIView.as_view(), name="goodsneed-detail"),
    path("goods-needs/<str:uuid>/verify/", GoodsNeedVerifyAPIView.as_view(), name="goodsneed-verify"),
    path("marketplace/goods-needs/", MarketplaceGoodsNeedListAPIView.as_view()),
    path("notifications/", NotificationListAPIView.as_view(), name="notification-list"),
    path("notifications/<int:pk>/read/", NotificationMarkReadAPIView.as_view(), name="notification-read"),
]
