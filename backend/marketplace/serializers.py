import json
from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from customs.models import HSCode

from .bank_branches import format_bank_branch
from .models import GoodsNeed, GoodsNeedGood, Notification, OrderGood, RegisteredOrder


def is_admin_user(user) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (
            getattr(user, "role", "") == "admin"
            or getattr(user, "is_staff", False)
            or getattr(user, "is_superuser", False)
        )
    )


def can_view_private_order_fields(request, order: RegisteredOrder) -> bool:
    user = getattr(request, "user", None) if request else None
    return bool(
        user
        and user.is_authenticated
        and (is_admin_user(user) or user.pk == order.user_id)
    )


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
            "goods_status",
            "price",
        ]


class OrderGoodReadSerializer(serializers.ModelSerializer):
    hs_code = serializers.StringRelatedField()
    hs_code_id = serializers.IntegerField(read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderGood
        fields = [
            "uuid",
            "description",
            "hs_code",
            "hs_code_id",
            "goods_status",
            "price",
            "line_total",
        ]

    def get_line_total(self, obj):
        return obj.price or Decimal("0")


class GoodsNeedGoodWriteSerializer(serializers.ModelSerializer):
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


class GoodsNeedGoodReadSerializer(serializers.ModelSerializer):
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


class RegisteredOrderCreateUpdateSerializer(serializers.ModelSerializer):
    goods = OrderGoodWriteSerializer(many=True, write_only=True)

    class Meta:
        model = RegisteredOrder
        fields = [
            "uuid",
            "order_number",
            "order_pdf",
            "total_value",
            "freight_price",
            "sub_total",
            "currency_type",
            "fee_type",
            "fee_amount",
            "applicant_name",
            "currency_supply",
            "bank_name",
            "bank_branch",
            "payment_instrument",
            "expire_date",
            "goods",
        ]
        read_only_fields = [
            "uuid",
            "total_value",
            "sub_total",
        ]
        extra_kwargs = {
            "payment_instrument": {"required": False, "allow_blank": True},
        }

    def validate_order_number(self, value):
        request = self.context["request"]
        qs = RegisteredOrder.objects.filter(user=request.user, order_number=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("این شماره ثبت سفارش قبلا برای این کاربر ثبت شده است.")
        return value

    def validate_order_pdf(self, value):
        if not value:
            raise serializers.ValidationError("فایل PDF یا JPG الزامی است.")
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
        if not self.instance and not attrs.get("order_pdf"):
            raise serializers.ValidationError({"order_pdf": "فایل PDF یا JPG الزامی است."})
        return attrs

    def _recalc_totals(self, order: RegisteredOrder) -> None:
        total_value = Decimal("0")

        for g in order.goods.all():
            total_value += g.price or Decimal("0")

        order.total_value = total_value
        order.sub_total = total_value + (order.freight_price or Decimal("0"))

    @transaction.atomic
    def create(self, validated_data):
        goods_data = validated_data.pop("goods", [])
        request = self.context["request"]

        order = RegisteredOrder.objects.create(user=request.user, **validated_data)
        OrderGood.objects.bulk_create([OrderGood(order=order, **item) for item in goods_data])

        self._recalc_totals(order)
        order.save(update_fields=["total_value", "sub_total"])
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        goods_data = validated_data.pop("goods", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if goods_data is not None:
            instance.goods.all().delete()
            OrderGood.objects.bulk_create([OrderGood(order=instance, **item) for item in goods_data])

        self._recalc_totals(instance)
        instance.save(update_fields=["total_value", "sub_total"])
        return instance


class RegisteredOrderReadSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    user_phone = serializers.SerializerMethodField()
    order_number = serializers.SerializerMethodField()
    applicant_name = serializers.SerializerMethodField()
    bank_branch_display = serializers.SerializerMethodField()
    goods = OrderGoodReadSerializer(many=True)

    class Meta:
        model = RegisteredOrder
        fields = [
            "id",
            "uuid",
            "verified",
            "rejected",
            "rejection_reason",
            "order_number",
            "order_pdf",
            "user",
            "user_email",
            "user_phone",
            "total_value",
            "freight_price",
            "sub_total",
            "currency_type",
            "fee_type",
            "fee_amount",
            "applicant_name",
            "currency_supply",
            "bank_name",
            "bank_branch",
            "bank_branch_display",
            "payment_instrument",
            "expire_date",
            "goods",
        ]

    def get_user(self, obj):
        if getattr(obj.user, "username", None):
            return obj.user.username
        return f"user-{obj.user_id}"

    def get_order_number(self, obj):
        request = self.context.get("request")
        if request and is_admin_user(request.user):
            return obj.order_number
        return None

    def get_user_email(self, obj):
        request = self.context.get("request")
        if request and is_admin_user(request.user):
            return getattr(obj.user, "email", None)
        return None

    def get_user_phone(self, obj):
        request = self.context.get("request")
        if request and is_admin_user(request.user):
            return getattr(obj.user, "phone", None)
        return None

    def get_applicant_name(self, obj):
        request = self.context.get("request")
        if can_view_private_order_fields(request, obj):
            return obj.applicant_name
        return None

    def get_bank_branch_display(self, obj):
        return format_bank_branch(obj.bank_branch)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if not (request and is_admin_user(request.user)):
            data["order_pdf"] = None
        return data

class GoodsNeedSerializer(serializers.ModelSerializer):
    goods = GoodsNeedGoodWriteSerializer(many=True, write_only=True)
    goods_read = GoodsNeedGoodReadSerializer(source="goods", many=True, read_only=True)
    hs_code_id = serializers.PrimaryKeyRelatedField(
        source="hs_code",
        queryset=HSCode.objects.all(),
        required=False,
        write_only=True,
    )
    hs_code = serializers.StringRelatedField(read_only=True)
    user = serializers.SerializerMethodField()

    class Meta:
        model = GoodsNeed
        fields = [
            "id",
            "uuid",
            "user",
            "created_at",
            "description",
            "hs_code",
            "hs_code_id",
            "status",
            "goods_status",
            "quantity",
            "unit",
            "manufacturer_country",
            "country_of_origin",
            "price",
            "currency_type",
            "fee_type",
            "fee_amount",
            "entry_border",
            "customs",
            "terms_of_delivery",
            "terms_of_payment",
            "partial_shipment",
            "means_of_transport",
            "nw_kg",
            "gw_kg",
            "goods",
            "goods_read",
        ]
        read_only_fields = [
            "id",
            "uuid",
            "user",
            "created_at",
            "hs_code",
            "description",
            "goods_status",
            "quantity",
            "unit",
            "manufacturer_country",
            "price",
            "nw_kg",
            "gw_kg",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        status_value = attrs.get("status", getattr(self.instance, "status", GoodsNeed.STATUS_AT_ORIGIN))
        customs_value = attrs.get("customs", getattr(self.instance, "customs", ""))
        if customs_value == "ALL_CUSTOMS" and status_value != GoodsNeed.STATUS_AT_ORIGIN:
            raise serializers.ValidationError(
                {"customs": "تمام گمرکات فقط برای وضعیت در کشور مبدا مجاز است."}
            )
        if self.instance is None and not attrs.get("goods"):
            raise serializers.ValidationError({"goods": "حداقل یک کالای بار الزامی است."})
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
        validated_data.pop("hs_code", None)

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

    def get_user_email(self, obj):
        request = self.context.get("request")
        if request and is_admin_user(request.user):
            return getattr(obj.user, "email", None)
        return None

    def get_user_phone(self, obj):
        request = self.context.get("request")
        if request and is_admin_user(request.user):
            return getattr(obj.user, "phone", None)
        return None

    def get_applicant_name(self, obj):
        request = self.context.get("request")
        if can_view_private_order_fields(request, obj):
            return obj.applicant_name
        return None

class GoodsNeedGoodWriteSerializer(serializers.ModelSerializer):
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


class GoodsNeedGoodReadSerializer(serializers.ModelSerializer):
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
    goods = GoodsNeedGoodWriteSerializer(many=True, write_only=True)
    goods_read = GoodsNeedGoodReadSerializer(source="goods", many=True, read_only=True)
    hs_code_id = serializers.PrimaryKeyRelatedField(
        source="hs_code",
        queryset=HSCode.objects.all(),
        required=False,
        write_only=True,
    )
    hs_code = serializers.StringRelatedField(read_only=True)
    user = serializers.SerializerMethodField()

    class Meta:
        model = GoodsNeed
        fields = [
            "id",
            "uuid",
            "user",
            "created_at",
            "description",
            "hs_code",
            "hs_code_id",
            "status",
            "goods_status",
            "quantity",
            "unit",
            "manufacturer_country",
            "country_of_origin",
            "price",
            "currency_type",
            "fee_type",
            "fee_amount",
            "entry_border",
            "customs",
            "terms_of_delivery",
            "terms_of_payment",
            "partial_shipment",
            "means_of_transport",
            "nw_kg",
            "gw_kg",
            "goods",
            "goods_read",
        ]
        read_only_fields = [
            "id",
            "uuid",
            "user",
            "created_at",
            "hs_code",
            "description",
            "goods_status",
            "quantity",
            "unit",
            "manufacturer_country",
            "price",
            "nw_kg",
            "gw_kg",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        status_value = attrs.get("status", getattr(self.instance, "status", GoodsNeed.STATUS_AT_ORIGIN))
        customs_value = attrs.get("customs", getattr(self.instance, "customs", ""))
        if customs_value == "ALL_CUSTOMS" and status_value != GoodsNeed.STATUS_AT_ORIGIN:
            raise serializers.ValidationError(
                {"customs": "تمام گمرکات فقط برای وضعیت در کشور مبدا مجاز است."}
            )
        if self.instance is None and not attrs.get("goods"):
            raise serializers.ValidationError({"goods": "حداقل یک کالای بار الزامی است."})
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
        validated_data.pop("hs_code", None)

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

    def get_user_email(self, obj):
        request = self.context.get("request")
        if request and is_admin_user(request.user):
            return getattr(obj.user, "email", None)
        return None

    def get_user_phone(self, obj):
        request = self.context.get("request")
        if request and is_admin_user(request.user):
            return getattr(obj.user, "phone", None)
        return None

    def get_applicant_name(self, obj):
        request = self.context.get("request")
        if can_view_private_order_fields(request, obj):
            return obj.applicant_name
        return None

class PublicRegisteredOrderSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    order_number = serializers.SerializerMethodField()
    applicant_name = serializers.SerializerMethodField()
    bank_branch = serializers.SerializerMethodField()
    bank_branch_display = serializers.SerializerMethodField()
    payment_instrument = serializers.SerializerMethodField()
    goods = OrderGoodReadSerializer(many=True, read_only=True)

    class Meta:
        model = RegisteredOrder
        fields = [
            "uuid",
            "verified",
            "rejected",
            "rejection_reason",
            "order_number",
            "user",
            "total_value",
            "freight_price",
            "sub_total",
            "created_at",
            "currency_type",
            "fee_type",
            "fee_amount",
            "applicant_name",
            "currency_supply",
            "bank_name",
            "bank_branch",
            "bank_branch_display",
            "payment_instrument",
            "expire_date",
            "goods",
        ]

    def get_user(self, obj):
        if getattr(obj.user, "username", None):
            return obj.user.username
        return f"user-{obj.user_id}"

    def get_order_number(self, obj):
        request = self.context.get("request")
        if request and is_admin_user(request.user):
            return obj.order_number
        return None

    def get_applicant_name(self, obj):
        request = self.context.get("request")
        if request and is_admin_user(request.user):
            return obj.applicant_name
        return None

    def get_bank_branch(self, obj):
        request = self.context.get("request")
        if request and is_admin_user(request.user):
            return obj.bank_branch
        return None

    def get_bank_branch_display(self, obj):
        request = self.context.get("request")
        if request and is_admin_user(request.user):
            return format_bank_branch(obj.bank_branch)
        return None

    def get_payment_instrument(self, obj):
        request = self.context.get("request")
        if request and is_admin_user(request.user):
            return obj.payment_instrument
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if not (request and is_admin_user(request.user)):
            data.pop("fee_type", None)
            data.pop("fee_amount", None)
        return data


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "notification_type",
            "related_model",
            "related_uuid",
            "read",
            "created_at",
        ]

class GoodsNeedSerializer(serializers.ModelSerializer):
    hs_code_id = serializers.PrimaryKeyRelatedField(
        source="hs_code",
        queryset=HSCode.objects.all(),
    )
    hs_code = serializers.StringRelatedField(read_only=True)
    user = serializers.SerializerMethodField()

    class Meta:
        model = GoodsNeed
        fields = [
            "id",
            "uuid",
            "user",
            "created_at",
            "description",
            "hs_code",
            "hs_code_id",
            "status",
            "goods_status",
            "quantity",
            "unit",
            "manufacturer_country",
            "country_of_origin",
            "price",
            "currency_type",
            "fee_type",
            "fee_amount",
            "entry_border",
            "customs",
            "terms_of_delivery",
            "terms_of_payment",
            "partial_shipment",
            "means_of_transport",
            "nw_kg",
            "gw_kg",
        ]
        read_only_fields = ["id", "uuid", "user", "created_at", "hs_code"]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        status_value = attrs.get("status", getattr(self.instance, "status", GoodsNeed.STATUS_AT_ORIGIN))
        customs_value = attrs.get("customs", getattr(self.instance, "customs", ""))
        if customs_value == "ALL_CUSTOMS" and status_value != GoodsNeed.STATUS_AT_ORIGIN:
            raise serializers.ValidationError(
                {"customs": "تمام گمرکات فقط برای وضعیت در کشور مبدا مجاز است."}
            )
        return attrs

    def get_user(self, obj):
        if getattr(obj.user, "username", None):
            return obj.user.username
        return f"user-{obj.user_id}"
