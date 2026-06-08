from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0011_goodsneed"),
    ]

    operations = [
        migrations.AddField(
            model_name="registeredorder",
            name="customs",
            field=models.CharField(default="", max_length=255),
        ),
        migrations.AddField(
            model_name="goodsneed",
            name="customs",
            field=models.CharField(default="", max_length=255),
        ),
    ]
