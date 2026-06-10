from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from customs.models import HSCode

from .models import GoodsNeed, GoodsNeedGood, OrderGood


class ProformaGoodWriteSerializer(serializers.ModelSerializer):
    hs_code_id = serializers.PrimaryKeyRelatedField(
        source="hs_code",
        queryset=HSCode.objects.all(),
        write_only=True,
    )

    class Meta:
        model = GoodsNeedGood
        fields = [
            "description",
            "hs_code_id",
            "goods_status",
            "quantity",
            "unit",
            "manufacturer_country",
            "price",
            "nw_kg",
            "gw_kg",
        ]


class ProformaGoodReadSerializer(serializers.ModelSerializer):
    hs_code = serializers.StringRelatedField()
    hs_code_id = serializers.IntegerField(read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = GoodsNeedGood
        fields = [
            "uuid",
            "description",
            "hs_code",
            "hs_code_id",
            "goods_status",
            "quantity",
            "unit",
            "manufacturer_country",
            "price",
            "nw_kg",
            "gw_kg",
            "line_total",
        ]

    def get_line_total(self, obj):
        return (obj.quantity or Decimal("0")) * (obj.price or Decimal("0"))


class GoodsNeedSerializer(serializers.ModelSerializer):
    goods = ProformaGoodWriteSerializer(many=True, write_only=True)
    goods_read = ProformaGoodReadSerializer(source="goods", many=True, read_only=True)
    user = serializers.SerializerMethodField()
    country_of_origin = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = GoodsNeed
        fields = [
            "id",
            "uuid",
            "user",
            "created_at",
            "status",
            "country_of_origin",
            "currency_type",
            "fee_type",
            "fee_amount",
            "entry_border",
            "customs",
            "means_of_transport",
            "goods",
            "goods_read",
        ]
        read_only_fields = ["id", "uuid", "user", "created_at"]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        status_value = attrs.get("status", getattr(self.instance, "status", GoodsNeed.STATUS_AT_ORIGIN))
        customs_value = attrs.get("customs", getattr(self.instance, "customs", ""))
        if customs_value == "ALL_CUSTOMS" and status_value != GoodsNeed.STATUS_AT_ORIGIN:
            raise serializers.ValidationError(
                {"customs": "تمام گمرکات فقط برای وضعیت در کشور مبدا مجاز است."}
            )
        if self.instance is None and not attrs.get("goods"):
            raise serializers.ValidationError({"goods": "حداقل یک کالای پروفرما الزامی است."})
        return attrs

    def get_user(self, obj):
        if getattr(obj.user, "username", None):
            return obj.user.username
        return f"user-{obj.user_id}"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["goods"] = data.pop("goods_read", [])
        return data

    def _sync_legacy_fields(self, instance: GoodsNeed) -> None:
        first = instance.goods.select_related("hs_code").first()
        if not first:
            return
        instance.description = first.description
        instance.hs_code = first.hs_code
        instance.goods_status = first.goods_status
        instance.quantity = first.quantity
        instance.unit = first.unit
        instance.manufacturer_country = first.manufacturer_country
        instance.price = first.price
        instance.nw_kg = first.nw_kg
        instance.gw_kg = first.gw_kg
        instance.save(
            update_fields=[
                "description",
                "hs_code",
                "goods_status",
                "quantity",
                "unit",
                "manufacturer_country",
                "price",
                "nw_kg",
                "gw_kg",
            ]
        )

    @transaction.atomic
    def create(self, validated_data):
        goods_data = validated_data.pop("goods", [])
        first = goods_data[0]
        instance = GoodsNeed.objects.create(
            description=first["description"],
            hs_code=first["hs_code"],
            goods_status=first.get("goods_status", OrderGood.STATUS_NEW),
            quantity=first.get("quantity", Decimal("1")),
            unit=first.get("unit", "U"),
            manufacturer_country=first.get("manufacturer_country", ""),
            price=first.get("price", Decimal("0")),
            nw_kg=first.get("nw_kg", Decimal("0")),
            gw_kg=first.get("gw_kg", Decimal("0")),
            **validated_data,
        )
        GoodsNeedGood.objects.bulk_create(
            [GoodsNeedGood(proforma=instance, **item) for item in goods_data]
        )
        return instance

    @transaction.atomic
    def update(self, instance, validated_data):
        goods_data = validated_data.pop("goods", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if goods_data is not None:
            instance.goods.all().delete()
            GoodsNeedGood.objects.bulk_create(
                [GoodsNeedGood(proforma=instance, **item) for item in goods_data]
            )
            self._sync_legacy_fields(instance)
        return instance
