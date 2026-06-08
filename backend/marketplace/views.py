# marketplace/views.py
from rest_framework.views import APIView
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch, Q
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .filters import RegisteredOrderMarketplaceFilter

from .models import GoodsNeed, RegisteredOrder, OrderGood
from .serializers import (
    GoodsNeedSerializer,
    RegisteredOrderCreateUpdateSerializer,
    RegisteredOrderReadSerializer,
    PublicRegisteredOrderSerializer,
)


def is_admin_user(user):
    return bool(
        user
        and user.is_authenticated
        and (
            getattr(user, "role", "") == "admin"
            or getattr(user, "is_staff", False)
            or getattr(user, "is_superuser", False)
        )
    )


class RegisteredOrderListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        if is_admin_user(request.user):
            qs = RegisteredOrder.objects.select_related("user").order_by("-created_at")
        else:
            qs = RegisteredOrder.objects.filter(user=request.user).select_related("user").order_by("-created_at")
        return Response(RegisteredOrderReadSerializer(qs, many=True, context={"request": request}).data)

    def post(self, request):
        ser = RegisteredOrderCreateUpdateSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        order = ser.save()
        return Response(RegisteredOrderReadSerializer(order, context={"request": request}).data, status=status.HTTP_201_CREATED)


class RegisteredOrderDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    lookup_field = "uuid"          # model field
    lookup_url_kwarg = "uuid"      # url param name (we will set it in urls)

    def get_object(self, request, uuid):
        if is_admin_user(request.user):
            return get_object_or_404(RegisteredOrder, uuid=uuid)
        return get_object_or_404(RegisteredOrder, uuid=uuid, user=request.user)

    def get(self, request, uuid):
        order = self.get_object(request, uuid)
        return Response(RegisteredOrderReadSerializer(order, context={"request": request}).data)

    def put(self, request, uuid):
        order = self.get_object(request, uuid)
        ser = RegisteredOrderCreateUpdateSerializer(order, data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        order = ser.save()
        return Response(RegisteredOrderReadSerializer(order, context={"request": request}).data)

    def patch(self, request, uuid):
        order = self.get_object(request, uuid)
        ser = RegisteredOrderCreateUpdateSerializer(order, data=request.data, partial=True, context={"request": request})
        ser.is_valid(raise_exception=True)
        order = ser.save()
        return Response(RegisteredOrderReadSerializer(order, context={"request": request}).data)

    def delete(self, request, uuid):
        order = self.get_object(request, uuid)
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegisteredOrderVerifyAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, uuid):
        if not is_admin_user(request.user):
            return Response(
                {"detail": "Only admins can change verification state."},
                status=status.HTTP_403_FORBIDDEN,
            )

        order = get_object_or_404(RegisteredOrder, uuid=uuid)
        raw = request.data.get("verified", None)

        if not isinstance(raw, bool):
            return Response(
                {"detail": "Field 'verified' must be boolean."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.verified = raw
        order.save(update_fields=["verified"])
        return Response(RegisteredOrderReadSerializer(order, context={"request": request}).data, status=status.HTTP_200_OK)


class MarketplaceRegisteredOrderListAPIView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PublicRegisteredOrderSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_class = RegisteredOrderMarketplaceFilter

    def get_queryset(self):
        return (
            RegisteredOrder.objects
            .filter(verified=True)
            .select_related("user")
            .prefetch_related(
                Prefetch(
                    "goods",
                    queryset=OrderGood.objects.select_related("hs_code").all(),
                )
            )
            .order_by("-created_at")
            .distinct()  # important because hscode joins goods
        )


class MarketplaceRegisteredOrderDetailAPIView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PublicRegisteredOrderSerializer
    lookup_field = "uuid"
    lookup_url_kwarg = "uuid"

    def get_queryset(self):
        return (
            RegisteredOrder.objects
            .filter(verified=True)
            .select_related("user")
            .prefetch_related(
                Prefetch(
                    "goods",
                    queryset=OrderGood.objects.select_related("hs_code").all(),
                )
            )
        )


class GoodsNeedListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if is_admin_user(request.user):
            qs = GoodsNeed.objects.select_related("user", "hs_code").order_by("-created_at")
        else:
            qs = (
                GoodsNeed.objects
                .filter(user=request.user)
                .select_related("user", "hs_code")
                .order_by("-created_at")
            )
        return Response(GoodsNeedSerializer(qs, many=True, context={"request": request}).data)

    def post(self, request):
        ser = GoodsNeedSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        need = ser.save(user=request.user)
        return Response(GoodsNeedSerializer(need, context={"request": request}).data, status=status.HTTP_201_CREATED)


class GoodsNeedDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "uuid"
    lookup_url_kwarg = "uuid"

    def get_object(self, request, uuid):
        if is_admin_user(request.user):
            return get_object_or_404(GoodsNeed, uuid=uuid)
        return get_object_or_404(GoodsNeed, uuid=uuid, user=request.user)

    def get(self, request, uuid):
        need = self.get_object(request, uuid)
        return Response(GoodsNeedSerializer(need, context={"request": request}).data)

    def put(self, request, uuid):
        need = self.get_object(request, uuid)
        ser = GoodsNeedSerializer(need, data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        need = ser.save()
        return Response(GoodsNeedSerializer(need, context={"request": request}).data)

    def patch(self, request, uuid):
        need = self.get_object(request, uuid)
        ser = GoodsNeedSerializer(need, data=request.data, partial=True, context={"request": request})
        ser.is_valid(raise_exception=True)
        need = ser.save()
        return Response(GoodsNeedSerializer(need, context={"request": request}).data)

    def delete(self, request, uuid):
        need = self.get_object(request, uuid)
        need.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MarketplaceGoodsNeedListAPIView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = GoodsNeedSerializer

    def get_queryset(self):
        qs = GoodsNeed.objects.select_related("user", "hs_code").order_by("-created_at")
        hs_code = (self.request.query_params.get("hs_code") or "").strip()
        q = (self.request.query_params.get("q") or "").strip()
        status_value = (self.request.query_params.get("status") or "").strip()
        goods_status = (self.request.query_params.get("goods_status") or "").strip()
        currency_type = (self.request.query_params.get("currency_type") or "").strip()
        entry_border = (self.request.query_params.get("entry_border") or "").strip()
        customs = (self.request.query_params.get("customs") or "").strip()
        manufacturer_country = (self.request.query_params.get("manufacturer_country") or "").strip()
        country_of_origin = (self.request.query_params.get("country_of_origin") or "").strip()
        terms_of_delivery = (self.request.query_params.get("terms_of_delivery") or "").strip()
        terms_of_payment = (self.request.query_params.get("terms_of_payment") or "").strip()
        means_of_transport = (self.request.query_params.get("means_of_transport") or "").strip()
        partial_shipment = (self.request.query_params.get("partial_shipment") or "").strip().lower()
        if hs_code:
            qs = qs.filter(hs_code__code__in=[x.strip() for x in hs_code.split(",") if x.strip()])
        if status_value:
            qs = qs.filter(status=status_value)
        if goods_status:
            qs = qs.filter(goods_status=goods_status)
        if currency_type:
            qs = qs.filter(currency_type=currency_type)
        if entry_border:
            qs = qs.filter(entry_border=entry_border)
        if customs:
            qs = qs.filter(customs=customs)
        if manufacturer_country:
            qs = qs.filter(manufacturer_country=manufacturer_country)
        if country_of_origin:
            qs = qs.filter(country_of_origin=country_of_origin)
        if terms_of_delivery:
            qs = qs.filter(terms_of_delivery=terms_of_delivery)
        if terms_of_payment:
            qs = qs.filter(terms_of_payment=terms_of_payment)
        if means_of_transport:
            qs = qs.filter(means_of_transport=means_of_transport)
        if partial_shipment in {"true", "false"}:
            qs = qs.filter(partial_shipment=partial_shipment == "true")
        if q:
            qs = qs.filter(
                Q(description__icontains=q)
                | Q(hs_code__code__icontains=q)
                | Q(entry_border__icontains=q)
            )
        return qs
