# marketplace/serializers.py
from decimal import Decimal
from django.db import transaction
from rest_framework import serializers

from .models import RegisteredOrder, OrderGood
from customs.models import HSCode


class OrderGoodWriteSerializer(serializers.ModelSerializer):
    hs_code_id = serializers.PrimaryKeyRelatedField(
        source="hs_code",
        queryset=HSCode.objects.all(),
        write_only=True,
    )

    class Meta:
        model = OrderGood
        fields = [
            "description",
            "hs_code_id",
            "quantity",
            "origin",
            "unit_price",
            "unit",
            "nw_kg",
            "gw_kg",
        ]


class OrderGoodReadSerializer(serializers.ModelSerializer):
    hs_code = serializers.StringRelatedField()
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderGood
        fields = [
            "uuid",
            "description",
            "hs_code",
            "quantity",
            "origin",
            "unit_price",
            "unit",
            "nw_kg",
            "gw_kg",
            "line_total",
        ]

    def get_line_total(self, obj):
        return (obj.quantity or Decimal("0")) * (obj.unit_price or Decimal("0"))


class RegisteredOrderCreateUpdateSerializer(serializers.ModelSerializer):
    goods = OrderGoodWriteSerializer(many=True, write_only=True)

    class Meta:
        model = RegisteredOrder
        fields = [
            "uuid",
            "order_number",

            "total_value",
            "freight_price",
            "sub_total",

            "currency_type",
            "seller_country",
            "date",
            "expire_date",

            "terms_of_delivery",
            "terms_of_payment",

            "partial_shipment",
            "means_of_transport",

            "country_of_origin",
            "standard",

            "total_gw",
            "total_nw",
            "total_qty",

            "goods",
        ]
        read_only_fields = [
            "uuid",
            "total_value",
            "sub_total",
            "total_gw",
            "total_nw",
            "total_qty",
        ]

    def validate_order_number(self, value):
        request = self.context["request"]
        qs = RegisteredOrder.objects.filter(user=request.user, order_number=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("این شماره ثبت سفارش قبلا برای شما ثبت شده است.")
        return value

    def _recalc_totals(self, order: RegisteredOrder) -> None:
        total_value = Decimal("0")
        total_qty = Decimal("0")
        total_nw = Decimal("0")
        total_gw = Decimal("0")

        for g in order.goods.all():
            qty = g.quantity or Decimal("0")
            unit_price = g.unit_price or Decimal("0")
            total_value += qty * unit_price
            total_qty += qty
            total_nw += (g.nw_kg or Decimal("0"))
            total_gw += (g.gw_kg or Decimal("0"))

        order.total_value = total_value
        order.sub_total = total_value + (order.freight_price or Decimal("0"))
        order.total_qty = total_qty
        order.total_nw = total_nw
        order.total_gw = total_gw

    @transaction.atomic
    def create(self, validated_data):
        goods_data = validated_data.pop("goods", [])
        request = self.context["request"]

        order = RegisteredOrder.objects.create(user=request.user, **validated_data)

        OrderGood.objects.bulk_create(
            [OrderGood(order=order, **item) for item in goods_data]
        )

        self._recalc_totals(order)
        order.save(update_fields=["total_value", "sub_total", "total_qty", "total_nw", "total_gw"])
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        goods_data = validated_data.pop("goods", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if goods_data is not None:
            instance.goods.all().delete()
            OrderGood.objects.bulk_create(
                [OrderGood(order=instance, **item) for item in goods_data]
            )

        self._recalc_totals(instance)
        instance.save(update_fields=["total_value", "sub_total", "total_qty", "total_nw", "total_gw"])
        return instance


class RegisteredOrderReadSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    goods = OrderGoodReadSerializer(many=True)

    class Meta:
        model = RegisteredOrder
        fields = [
            "id",
            "uuid",
            "order_number",
            "user",

            "total_value",
            "freight_price",
            "sub_total",

            "currency_type",
            "seller_country",
            "date",
            "expire_date",

            "terms_of_delivery",
            "terms_of_payment",

            "partial_shipment",
            "means_of_transport",

            "country_of_origin",
            "standard",

            "total_gw",
            "total_nw",
            "total_qty",

            "goods",
        ]


class PublicRegisteredOrderSerializer(serializers.ModelSerializer):
    # safer than StringRelatedField if User.__str__ returns phone/email
    user = serializers.SerializerMethodField()
    goods = OrderGoodReadSerializer(many=True, read_only=True)

    class Meta:
        model = RegisteredOrder
        fields = [
            "uuid",
            "order_number",
            "user",

            "total_value",
            "freight_price",
            "sub_total",
            "created_at",
            "currency_type",
            "seller_country",
            "date",
            "expire_date",

            "terms_of_delivery",
            "terms_of_payment",

            "partial_shipment",
            "means_of_transport",

            "country_of_origin",
            "standard",

            "total_gw",
            "total_nw",
            "total_qty",

            "goods",
        ]

    def get_user(self, obj):
        # pick what you want to show publicly
        # if you have username, show username; otherwise show an anonymized label
        if getattr(obj.user, "username", None):
            return obj.user.username
        return f"user-{obj.user_id}"