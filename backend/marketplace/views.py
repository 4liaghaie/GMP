# marketplace/views.py
from rest_framework.views import APIView
from rest_framework import generics, permissions
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .filters import RegisteredOrderMarketplaceFilter

from .models import RegisteredOrder, OrderGood
from .serializers import RegisteredOrderCreateUpdateSerializer, RegisteredOrderReadSerializer, PublicRegisteredOrderSerializer


class RegisteredOrderListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = RegisteredOrder.objects.filter(user=request.user).order_by("-date")
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

class MarketplaceRegisteredOrderListAPIView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PublicRegisteredOrderSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_class = RegisteredOrderMarketplaceFilter

    def get_queryset(self):
        return (
            RegisteredOrder.objects
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
            .select_related("user")
            .prefetch_related(
                Prefetch(
                    "goods",
                    queryset=OrderGood.objects.select_related("hs_code").all(),
                )
            )
        )