import uuid

from django.db import migrations, models
import django.db.models.deletion


def copy_existing_goods_needs(apps, schema_editor):
    GoodsNeed = apps.get_model("marketplace", "GoodsNeed")
    GoodsNeedGood = apps.get_model("marketplace", "GoodsNeedGood")

    rows = []
    for need in GoodsNeed.objects.all().iterator():
        rows.append(
            GoodsNeedGood(
                uuid=uuid.uuid4(),
                proforma_id=need.id,
                description=need.description,
                hs_code_id=need.hs_code_id,
                goods_status=need.goods_status,
                quantity=need.quantity,
                unit=need.unit,
                manufacturer_country=need.manufacturer_country,
                price=need.price,
                nw_kg=need.nw_kg,
                gw_kg=need.gw_kg,
            )
        )
    GoodsNeedGood.objects.bulk_create(rows, ignore_conflicts=True)


class Migration(migrations.Migration):

    dependencies = [
        ("customs", "0001_initial"),
        ("marketplace", "0013_goodsneed_status"),
    ]

    operations = [
        migrations.CreateModel(
            name="GoodsNeedGood",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("uuid", models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)),
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
                ("price", models.DecimalField(decimal_places=20, default=0, max_digits=40)),
                ("nw_kg", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("gw_kg", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("hs_code", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="customs.hscode")),
                (
                    "proforma",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="goods",
                        to="marketplace.goodsneed",
                    ),
                ),
            ],
        ),
        migrations.RunPython(copy_existing_goods_needs, migrations.RunPython.noop),
    ]
