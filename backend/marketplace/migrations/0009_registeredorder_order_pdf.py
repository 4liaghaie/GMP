from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("marketplace", "0008_ordergood_goods_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="registeredorder",
            name="order_pdf",
            field=models.FileField(default="", upload_to="registered_orders/pdfs/"),
            preserve_default=False,
        ),
    ]
