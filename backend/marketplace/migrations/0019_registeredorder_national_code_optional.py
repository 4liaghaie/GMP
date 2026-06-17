from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("marketplace", "0018_registeredorder_expire_date_jalali_default"),
    ]

    operations = [
        migrations.AlterField(
            model_name="registeredorder",
            name="national_code",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
    ]
