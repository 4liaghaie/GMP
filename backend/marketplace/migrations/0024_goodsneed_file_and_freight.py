from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0023_registeredorder_payment_instrument_optional"),
    ]

    operations = [
        migrations.AddField(
            model_name="goodsneed",
            name="proforma_file",
            field=models.FileField(blank=True, default="", upload_to="goods_needs/files/"),
        ),
        migrations.AddField(
            model_name="goodsneed",
            name="freight_price",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=20),
        ),
    ]
