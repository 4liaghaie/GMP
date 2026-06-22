import re
import uuid

from django.db import models

from accounts.models import User
from customs.models import HSCode


class RegisteredOrder(models.Model):
    UUID_PREFIX = "S"
    FEE_RECEIVED = "فی دریافتی"
    FEE_PAID = "فی پرداختی"
    FEE_TYPE_CHOICES = [
        (FEE_RECEIVED, FEE_RECEIVED),
        (FEE_PAID, FEE_PAID),
    ]

    uuid = models.CharField(max_length=32, unique=True, editable=False, db_index=True, blank=True)
    verified = models.BooleanField(default=False, db_index=True)
    order_number = models.CharField(max_length=55)
    order_pdf = models.FileField(upload_to="registered_orders/pdfs/")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    total_value = models.DecimalField(max_digits=20, decimal_places=2, default=1)
    freight_price = models.DecimalField(max_digits=20, decimal_places=2, default=1)
    sub_total = models.DecimalField(max_digits=20, decimal_places=2, default=1)
    currency_type = models.CharField(max_length=55, default="دلار")
    fee_type = models.CharField(max_length=20, choices=FEE_TYPE_CHOICES, default=FEE_RECEIVED)
    fee_amount = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    applicant_name = models.CharField(max_length=255, default="")
    currency_supply = models.CharField(max_length=255, default="")
    bank_name = models.CharField(max_length=255, default="")
    bank_branch = models.CharField(max_length=255, default="")
    payment_instrument = models.CharField(max_length=255, blank=True, default="")
    expire_date = models.CharField(max_length=20, default="1406/10/11")
    # Deprecated legacy column kept temporarily until DB cleanup migration is applied.
    standard = models.CharField(max_length=50, blank=True, default="")

    @classmethod
    def build_uuid(cls, user_code: str, sequence: int) -> str:
        return f"{user_code}-{cls.UUID_PREFIX}{sequence:04d}"

    @classmethod
    def uuid_is_formatted(cls, value: str) -> bool:
        return bool(re.fullmatch(r"U\d{5}-S\d{4,}", value or ""))

    @classmethod
    def next_uuid_for_user(cls, user: User) -> str:
        prefix = f"{user.username}-{cls.UUID_PREFIX}"
        max_sequence = 1000
        for value in cls.objects.filter(
            user=user,
            uuid__startswith=prefix,
        ).values_list("uuid", flat=True):
            try:
                max_sequence = max(
                    max_sequence,
                    int(str(value).split(f"-{cls.UUID_PREFIX}", 1)[1]),
                )
            except (IndexError, ValueError):
                continue
        return cls.build_uuid(user.username, max_sequence + 1)

    def save(self, *args, **kwargs):
        if not self.uuid:
            self.uuid = self.next_uuid_for_user(self.user)
        super().save(*args, **kwargs)


class OrderGood(models.Model):
    STATUS_NEW = "نو"
    STATUS_USED = "مستعمل"
    STATUS_REBUILT = "بازسازی شده"
    STATUS_CHOICES = [
        (STATUS_NEW, STATUS_NEW),
        (STATUS_USED, STATUS_USED),
        (STATUS_REBUILT, STATUS_REBUILT),
    ]

    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    description = models.CharField(max_length=255)
    hs_code = models.ForeignKey(HSCode, on_delete=models.CASCADE)
    order = models.ForeignKey(RegisteredOrder, related_name="goods", on_delete=models.CASCADE)
    goods_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_NEW)
    price = models.DecimalField(max_digits=40, decimal_places=20, default=0)

    @property
    def line_total(self):
        return self.price


class GoodsNeed(models.Model):
    UUID_PREFIX = "B"
    STATUS_AT_ORIGIN = "در کشور مبدا"
    STATUS_HAS_WAREHOUSE_RECEIPT = "قبض انبار دارد"
    STATUS_BILL_OF_LADING = "بارنامه شده"
    STATUS_CHOICES = [
        (STATUS_AT_ORIGIN, STATUS_AT_ORIGIN),
        (STATUS_HAS_WAREHOUSE_RECEIPT, STATUS_HAS_WAREHOUSE_RECEIPT),
        (STATUS_BILL_OF_LADING, STATUS_BILL_OF_LADING),
    ]

    uuid = models.CharField(max_length=32, unique=True, editable=False, db_index=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    proforma_file = models.FileField(upload_to="goods_needs/files/", blank=True, default="")
    description = models.CharField(max_length=255)
    hs_code = models.ForeignKey(HSCode, on_delete=models.CASCADE)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=STATUS_AT_ORIGIN)
    goods_status = models.CharField(
        max_length=20,
        choices=OrderGood.STATUS_CHOICES,
        default=OrderGood.STATUS_NEW,
    )
    quantity = models.DecimalField(default=1, max_digits=18, decimal_places=2)
    unit = models.CharField(max_length=55, default="U")
    manufacturer_country = models.CharField(max_length=55)
    country_of_origin = models.CharField(max_length=555)
    price = models.DecimalField(max_digits=40, decimal_places=20, default=0)
    freight_price = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    currency_type = models.CharField(max_length=55, default="دلار")
    fee_type = models.CharField(
        max_length=20,
        choices=RegisteredOrder.FEE_TYPE_CHOICES,
        default=RegisteredOrder.FEE_RECEIVED,
    )
    fee_amount = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    entry_border = models.CharField(max_length=255, default="")
    customs = models.CharField(max_length=255, default="")
    terms_of_delivery = models.CharField(max_length=50, blank=True, default="")
    terms_of_payment = models.CharField(max_length=50, blank=True, default="")
    partial_shipment = models.BooleanField(default=False)
    means_of_transport = models.CharField(max_length=50)
    nw_kg = models.DecimalField(default=0, max_digits=12, decimal_places=2)
    gw_kg = models.DecimalField(default=0, max_digits=12, decimal_places=2)

    @classmethod
    def build_uuid(cls, user_code: str, sequence: int) -> str:
        return f"{user_code}-{cls.UUID_PREFIX}{sequence:04d}"

    @classmethod
    def uuid_is_formatted(cls, value: str) -> bool:
        return bool(re.fullmatch(r"U\d{5}-B\d{4,}", value or ""))

    @classmethod
    def next_uuid_for_user(cls, user: User) -> str:
        prefix = f"{user.username}-{cls.UUID_PREFIX}"
        max_sequence = 1000
        for value in cls.objects.filter(
            user=user,
            uuid__startswith=prefix,
        ).values_list("uuid", flat=True):
            try:
                max_sequence = max(
                    max_sequence,
                    int(str(value).split(f"-{cls.UUID_PREFIX}", 1)[1]),
                )
            except (IndexError, ValueError):
                continue
        return cls.build_uuid(user.username, max_sequence + 1)

    def save(self, *args, **kwargs):
        if not self.uuid:
            self.uuid = self.next_uuid_for_user(self.user)
        super().save(*args, **kwargs)


class GoodsNeedGood(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    proforma = models.ForeignKey(GoodsNeed, related_name="goods", on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    hs_code = models.ForeignKey(HSCode, on_delete=models.CASCADE)
    goods_status = models.CharField(
        max_length=20,
        choices=OrderGood.STATUS_CHOICES,
        default=OrderGood.STATUS_NEW,
    )
    quantity = models.DecimalField(default=1, max_digits=18, decimal_places=2)
    unit = models.CharField(max_length=55, default="U")
    manufacturer_country = models.CharField(max_length=55)
    price = models.DecimalField(max_digits=40, decimal_places=20, default=0)
    nw_kg = models.DecimalField(default=0, max_digits=12, decimal_places=2)
    gw_kg = models.DecimalField(default=0, max_digits=12, decimal_places=2)

    @property
    def line_total(self):
        return self.quantity * self.price
