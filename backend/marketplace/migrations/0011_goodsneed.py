import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("customs", "0001_initial"),
        ("marketplace", "0010_registeredorder_fee"),
    ]

    operations = [
        migrations.CreateModel(
            name="GoodsNeed",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("uuid", models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("description", models.CharField(max_length=255)),
                (
                    "goods_status",
                    models.CharField(
                        choices=[
                            ("نو", "نو"),
                            ("مستعمل", "مستعمل"),
                            ("بازسازی شده", "بازسازی شده"),
                        ],
                        default="نو",
                        max_length=20,
                    ),
                ),
                ("quantity", models.DecimalField(decimal_places=2, default=1, max_digits=18)),
                ("unit", models.CharField(default="U", max_length=55)),
                ("manufacturer_country", models.CharField(max_length=55)),
                ("country_of_origin", models.CharField(max_length=555)),
                ("price", models.DecimalField(decimal_places=20, default=0, max_digits=40)),
                ("currency_type", models.CharField(default="دلار", max_length=55)),
                (
                    "fee_type",
                    models.CharField(
                        choices=[
                            ("فی دریافتی", "فی دریافتی"),
                            ("فی پرداختی", "فی پرداختی"),
                        ],
                        default="فی دریافتی",
                        max_length=20,
                    ),
                ),
                ("fee_amount", models.DecimalField(decimal_places=2, default=0, max_digits=20)),
                ("entry_border", models.CharField(default="", max_length=255)),
                ("terms_of_delivery", models.CharField(max_length=50)),
                ("terms_of_payment", models.CharField(max_length=50)),
                ("partial_shipment", models.BooleanField(default=False)),
                ("means_of_transport", models.CharField(max_length=50)),
                ("nw_kg", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("gw_kg", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("hs_code", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="customs.hscode")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
