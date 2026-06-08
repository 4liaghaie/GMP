from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0006_registeredorder_verified"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="registeredorder",
            name="date",
        ),
        migrations.RemoveField(
            model_name="registeredorder",
            name="seller_country",
        ),
        migrations.AddField(
            model_name="registeredorder",
            name="applicant_name",
            field=models.CharField(default="", max_length=255),
        ),
        migrations.AddField(
            model_name="registeredorder",
            name="bank_branch",
            field=models.CharField(default="", max_length=255),
        ),
        migrations.AddField(
            model_name="registeredorder",
            name="bank_name",
            field=models.CharField(default="", max_length=255),
        ),
        migrations.AddField(
            model_name="registeredorder",
            name="currency_supply",
            field=models.CharField(default="", max_length=255),
        ),
        migrations.AddField(
            model_name="registeredorder",
            name="entry_border",
            field=models.CharField(default="", max_length=255),
        ),
        migrations.AddField(
            model_name="registeredorder",
            name="national_code",
            field=models.CharField(default="", max_length=64),
        ),
        migrations.AddField(
            model_name="registeredorder",
            name="payment_instrument",
            field=models.CharField(default="", max_length=255),
        ),
    ]
