from django.db import migrations, models


def copy_unit_price_to_price(apps, schema_editor):
    OrderGood = apps.get_model("marketplace", "OrderGood")
    for good in OrderGood.objects.all().iterator():
        good.price = good.unit_price
        good.save(update_fields=["price"])


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0024_goodsneed_file_and_freight"),
    ]

    operations = [
        migrations.AddField(
            model_name="ordergood",
            name="price",
            field=models.DecimalField(decimal_places=20, default=0, max_digits=40),
        ),
        migrations.RunPython(copy_unit_price_to_price, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="registeredorder",
            name="total_qty",
        ),
        migrations.RemoveField(
            model_name="ordergood",
            name="quantity",
        ),
        migrations.RemoveField(
            model_name="ordergood",
            name="origin",
        ),
        migrations.RemoveField(
            model_name="ordergood",
            name="unit_price",
        ),
    ]
