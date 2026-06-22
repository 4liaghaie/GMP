from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0021_simplify_registered_orders"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="registeredorder",
            name="terms_of_payment",
        ),
        migrations.RemoveField(
            model_name="registeredorder",
            name="partial_shipment",
        ),
    ]
