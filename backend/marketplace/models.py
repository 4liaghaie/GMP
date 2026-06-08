import uuid

from django.db import models

from accounts.models import User
from customs.models import HSCode


class RegisteredOrder(models.Model):
    FEE_RECEIVED = "فی دریافتی"
    FEE_PAID = "فی پرداختی"
    FEE_TYPE_CHOICES = [
        (FEE_RECEIVED, FEE_RECEIVED),
        (FEE_PAID, FEE_PAID),
    ]

    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
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
    national_code = models.CharField(max_length=64, default="")
    entry_border = models.CharField(max_length=255, default="")
    customs = models.CharField(max_length=255, default="")
    currency_supply = models.CharField(max_length=255, default="")
    bank_name = models.CharField(max_length=255, default="")
    bank_branch = models.CharField(max_length=255, default="")
    payment_instrument = models.CharField(max_length=255, default="")
    expire_date = models.CharField(max_length=20, default="2028/01/01")
    terms_of_delivery = models.CharField(max_length=50)
    terms_of_payment = models.CharField(max_length=50)
    partial_shipment = models.BooleanField(default=False)
    means_of_transport = models.CharField(max_length=50)
    country_of_origin = models.CharField(max_length=555)
    standard = models.CharField(max_length=50)
    total_gw = models.DecimalField(default=0, max_digits=20, decimal_places=2)
    total_nw = models.DecimalField(default=0, max_digits=20, decimal_places=2)
    total_qty = models.DecimalField(default=0, max_digits=20, decimal_places=2)


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
    quantity = models.DecimalField(default=1, max_digits=18, decimal_places=2)
    origin = models.CharField(max_length=55)
    unit_price = models.DecimalField(max_digits=40, decimal_places=20, default=0)
    unit = models.CharField(max_length=55, default="U")
    nw_kg = models.DecimalField(default=1, max_digits=12, decimal_places=2)
    gw_kg = models.DecimalField(default=1, max_digits=12, decimal_places=2)

    @property
    def line_total(self):
        return self.quantity * self.unit_price


class GoodsNeed(models.Model):
    STATUS_AT_ORIGIN = "در کشور مبدا"
    STATUS_HAS_WAREHOUSE_RECEIPT = "قبض انبار دارد"
    STATUS_BILL_OF_LADING = "بارنامه شده"
    STATUS_CHOICES = [
        (STATUS_AT_ORIGIN, STATUS_AT_ORIGIN),
        (STATUS_HAS_WAREHOUSE_RECEIPT, STATUS_HAS_WAREHOUSE_RECEIPT),
        (STATUS_BILL_OF_LADING, STATUS_BILL_OF_LADING),
    ]

    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
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
    currency_type = models.CharField(max_length=55, default="دلار")
    fee_type = models.CharField(
        max_length=20,
        choices=RegisteredOrder.FEE_TYPE_CHOICES,
        default=RegisteredOrder.FEE_RECEIVED,
    )
    fee_amount = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    entry_border = models.CharField(max_length=255, default="")
    customs = models.CharField(max_length=255, default="")
    terms_of_delivery = models.CharField(max_length=50)
    terms_of_payment = models.CharField(max_length=50)
    partial_shipment = models.BooleanField(default=False)
    means_of_transport = models.CharField(max_length=50)
    nw_kg = models.DecimalField(default=0, max_digits=12, decimal_places=2)
    gw_kg = models.DecimalField(default=0, max_digits=12, decimal_places=2)
