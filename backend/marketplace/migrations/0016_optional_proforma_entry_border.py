from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0015_optional_proforma_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="goodsneed",
            name="entry_border",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
