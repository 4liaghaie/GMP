import uuid
from django.db import models
from customs.models import HSCode
from accounts.models import User


class RegisteredOrder(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    verified = models.BooleanField(default=False, db_index=True)
    order_number = models.CharField(max_length=55)
    user = models.ForeignKey(User, on_delete=models.CASCADE, )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    total_value = models.DecimalField(max_digits=20, decimal_places=2, default=1)
    freight_price = models.DecimalField(max_digits=20, decimal_places=2, default=1)
    sub_total = models.DecimalField(max_digits=20, decimal_places=2, default=1)
    currency_type = models.CharField(max_length=55, default="دلار")
    seller_country = models.CharField(max_length=255, default="asd")
    date = models.CharField(max_length=20,default='2026/01/01')
    expire_date = models.CharField(max_length=20,default='2028/01/01')
    terms_of_delivery = models.CharField(max_length=50)
    terms_of_payment = models.CharField(max_length=50)
    partial_shipment = models.BooleanField(default=False)
    means_of_transport = models.CharField(max_length=50)
    country_of_origin = models.CharField(max_length=555)
    standard = models.CharField(max_length=50)
    total_gw = models.DecimalField(default=0, max_digits=20, decimal_places=2,)
    total_nw = models.DecimalField(default=0, max_digits=20, decimal_places=2,)
    total_qty = models.DecimalField(default=0, max_digits=20, decimal_places=2,)

class OrderGood(models.Model): 
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    description = models.CharField(max_length=255)
    hs_code = models.ForeignKey(HSCode, on_delete=models.CASCADE)
    order = models.ForeignKey(RegisteredOrder, related_name="goods", on_delete=models.CASCADE)
    quantity = models.DecimalField(default=1, max_digits=18, decimal_places=2)
    origin = models.CharField(max_length=55)
    unit_price = models.DecimalField(max_digits=40, decimal_places=20, default=0)
    unit = models.CharField(max_length=55, default="U")
    nw_kg = models.DecimalField(default=1, max_digits=12, decimal_places=2,)
    gw_kg = models.DecimalField(default=1, max_digits=12, decimal_places=2,)    

    @property
    def line_total(self):
        return self.quantity * self.unit_price
