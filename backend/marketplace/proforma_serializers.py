import json
from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from customs.models import HSCode

from .models import GoodsNeed, GoodsNeedGood, OrderGood

ALL_CUSTOMS_VALUE = "ALL_CUSTOMS"
ALL_BORDERS_VALUE = "ALL_BORDERS"
ALL_TRANSPORTS_VALUE = "ALL_TRANSPORTS"


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
    country_of_origin = serializers.CharField(required=True, allow_blank=False)
    entry_border = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = GoodsNeed
        fields = [
            "id",
            "uuid",
            "user",
            "created_at",
            "verified",
            "rejected",
            "rejection_reason",
            "proforma_file",
            "status",
            "country_of_origin",
            "freight_price",
            "currency_type",
            "fee_type",
            "fee_amount",
            "entry_border",
            "customs",
            "means_of_transport",
            "goods",
            "goods_read",
        ]
        read_only_fields = [
            "id",
            "uuid",
            "user",
            "created_at",
            "verified",
            "rejected",
            "rejection_reason",
        ]

    def validate_proforma_file(self, value):
        if not value:
            return value
        name = (getattr(value, "name", "") or "").lower()
        allowed_extensions = (".pdf", ".jpg", ".jpeg")
        if not name.endswith(allowed_extensions):
            raise serializers.ValidationError("فقط فایل PDF یا JPG مجاز است.")
        content_type = getattr(value, "content_type", "")
        allowed_content_types = {"application/pdf", "image/jpeg"}
        if content_type and content_type not in allowed_content_types:
            raise serializers.ValidationError("فایل بارگذاری‌شده باید PDF یا JPG باشد.")
        return value

    def to_internal_value(self, data):
        if hasattr(data, "dict"):
            data = data.dict()
        elif hasattr(data, "copy"):
            data = data.copy()
        goods_raw = data.get("goods")
        if isinstance(goods_raw, str):
            try:
                data["goods"] = json.loads(goods_raw)
            except json.JSONDecodeError as exc:
                raise serializers.ValidationError({"goods": f"Invalid goods payload: {exc.msg}"})
        return super().to_internal_value(data)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if self.instance is None and not attrs.get("proforma_file"):
            raise serializers.ValidationError({"proforma_file": "فایل PDF یا JPG الزامی است."})
        status_value = attrs.get("status", getattr(self.instance, "status", GoodsNeed.STATUS_AT_ORIGIN))
        customs_value = attrs.get("customs", getattr(self.instance, "customs", ""))
        entry_border_value = attrs.get("entry_border", getattr(self.instance, "entry_border", ""))
        means_of_transport_value = attrs.get(
            "means_of_transport",
            getattr(self.instance, "means_of_transport", ""),
        )
        customs_values = [item.strip() for item in customs_value.split(",") if item.strip()]
        entry_border_values = [item.strip() for item in entry_border_value.split(",") if item.strip()]
        transport_values = [item.strip() for item in means_of_transport_value.split(",") if item.strip()]
        if ALL_CUSTOMS_VALUE in customs_values and status_value != GoodsNeed.STATUS_AT_ORIGIN:
            raise serializers.ValidationError(
                {"customs": "تمام گمرکات فقط برای وضعیت در کشور مبدا مجاز است."}
            )
        if ALL_BORDERS_VALUE in entry_border_values and status_value != GoodsNeed.STATUS_AT_ORIGIN:
            raise serializers.ValidationError(
                {"entry_border": "تمام مرزها فقط برای وضعیت در کشور مبدا مجاز است."}
            )
        if ALL_TRANSPORTS_VALUE in transport_values and len(transport_values) > 1:
            raise serializers.ValidationError(
                {"means_of_transport": "همه روش های حمل باید به صورت تنهایی انتخاب شود."}
            )
        if self.instance is None and not attrs.get("goods"):
            raise serializers.ValidationError({"goods": "حداقل یک کالای بار الزامی است."})
        return attrs

    def get_user(self, obj):
        if getattr(obj.user, "username", None):
            return obj.user.username
        return f"user-{obj.user_id}"

    def can_view_uploaded_file(self):
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        return bool(
            user
            and user.is_authenticated
            and (
                getattr(user, "role", "") == "admin"
                or getattr(user, "is_staff", False)
                or getattr(user, "is_superuser", False)
            )
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["goods"] = data.pop("goods_read", [])
        if not self.can_view_uploaded_file():
            data["proforma_file"] = None
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
