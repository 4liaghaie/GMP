from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0009_registeredorder_order_pdf"),
    ]

    operations = [
        migrations.AddField(
            model_name="registeredorder",
            name="fee_type",
            field=models.CharField(
                choices=[
                    ("فی دریافتی", "فی دریافتی"),
                    ("فی پرداختی", "فی پرداختی"),
                ],
                default="فی دریافتی",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="registeredorder",
            name="fee_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=20),
        ),
    ]
