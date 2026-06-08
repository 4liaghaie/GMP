from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("marketplace", "0007_registeredorder_trade_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="ordergood",
            name="goods_status",
            field=models.CharField(
                choices=[
                    ("نو", "نو"),
                    ("مستعمل", "مستعمل"),
                    ("بازسازی شده", "بازسازی شده"),
                ],
                default="نو",
                max_length=20,
            ),
        ),
    ]
