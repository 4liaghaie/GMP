from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0012_registeredorder_customs_goodsneed_customs"),
    ]

    operations = [
        migrations.AddField(
            model_name="goodsneed",
            name="status",
            field=models.CharField(
                choices=[
                    ("در کشور مبدا", "در کشور مبدا"),
                    ("قبض انبار دارد", "قبض انبار دارد"),
                    ("بارنامه شده", "بارنامه شده"),
                ],
                default="در کشور مبدا",
                max_length=50,
            ),
        ),
    ]
