from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0014_goodsneedgood"),
    ]

    operations = [
        migrations.AlterField(
            model_name="goodsneed",
            name="country_of_origin",
            field=models.CharField(blank=True, default="", max_length=555),
        ),
        migrations.AlterField(
            model_name="goodsneed",
            name="terms_of_delivery",
            field=models.CharField(blank=True, default="", max_length=50),
        ),
        migrations.AlterField(
            model_name="goodsneed",
            name="terms_of_payment",
            field=models.CharField(blank=True, default="", max_length=50),
        ),
    ]
