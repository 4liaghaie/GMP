# marketplace/views.py
from rest_framework.views import APIView
from rest_framework import generics, permissions, status
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .filters import RegisteredOrderMarketplaceFilter

from .models import RegisteredOrder, OrderGood
from .serializers import RegisteredOrderCreateUpdateSerializer, RegisteredOrderReadSerializer, PublicRegisteredOrderSerializer


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

    def get(self, request):
        if is_admin_user(request.user):
            qs = RegisteredOrder.objects.select_related("user").order_by("-created_at")
        else:
            qs = RegisteredOrder.objects.filter(user=request.user).select_related("user").order_by("-created_at")
        return Response(RegisteredOrderReadSerializer(qs, many=True).data)

    def post(self, request):
        ser = RegisteredOrderCreateUpdateSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        order = ser.save()
        return Response(RegisteredOrderReadSerializer(order).data, status=status.HTTP_201_CREATED)


class RegisteredOrderDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "uuid"          # model field
    lookup_url_kwarg = "uuid"      # url param name (we will set it in urls)

    def get_object(self, request, uuid):
        if is_admin_user(request.user):
            return get_object_or_404(RegisteredOrder, uuid=uuid)
        return get_object_or_404(RegisteredOrder, uuid=uuid, user=request.user)

    def get(self, request, uuid):
        order = self.get_object(request, uuid)
        return Response(RegisteredOrderReadSerializer(order).data)

    def put(self, request, uuid):
        order = self.get_object(request, uuid)
        ser = RegisteredOrderCreateUpdateSerializer(order, data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        order = ser.save()
        return Response(RegisteredOrderReadSerializer(order).data)

    def patch(self, request, uuid):
        order = self.get_object(request, uuid)
        ser = RegisteredOrderCreateUpdateSerializer(order, data=request.data, partial=True, context={"request": request})
        ser.is_valid(raise_exception=True)
        order = ser.save()
        return Response(RegisteredOrderReadSerializer(order).data)

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
        return Response(RegisteredOrderReadSerializer(order).data, status=status.HTTP_200_OK)


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
            .order_by("-date")
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
