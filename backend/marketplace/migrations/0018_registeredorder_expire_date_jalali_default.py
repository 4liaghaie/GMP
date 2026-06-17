from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("marketplace", "0017_remove_registeredorder_standard_and_terms_of_payment"),
    ]

    operations = [
        migrations.AlterField(
            model_name="registeredorder",
            name="expire_date",
            field=models.CharField(default="1406/10/11", max_length=20),
        ),
    ]
