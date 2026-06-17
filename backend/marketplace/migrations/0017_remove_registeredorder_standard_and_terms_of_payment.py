from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("marketplace", "0016_optional_proforma_entry_border"),
    ]

    operations = [
        migrations.AlterField(
            model_name="registeredorder",
            name="standard",
            field=models.CharField(max_length=50, blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="registeredorder",
            name="terms_of_payment",
            field=models.CharField(max_length=50, blank=True, default=""),
        ),
    ]
