from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0022_remove_registeredorder_payment_shipment"),
    ]

    operations = [
        migrations.AlterField(
            model_name="registeredorder",
            name="payment_instrument",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
