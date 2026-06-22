from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0020_user_linked_business_uuids"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="registeredorder",
            name="entry_border",
        ),
        migrations.RemoveField(
            model_name="registeredorder",
            name="country_of_origin",
        ),
        migrations.RemoveField(
            model_name="registeredorder",
            name="national_code",
        ),
        migrations.RemoveField(
            model_name="registeredorder",
            name="customs",
        ),
        migrations.RemoveField(
            model_name="registeredorder",
            name="terms_of_delivery",
        ),
        migrations.RemoveField(
            model_name="registeredorder",
            name="means_of_transport",
        ),
        migrations.RemoveField(
            model_name="registeredorder",
            name="total_gw",
        ),
        migrations.RemoveField(
            model_name="registeredorder",
            name="total_nw",
        ),
        migrations.RemoveField(
            model_name="ordergood",
            name="unit",
        ),
        migrations.RemoveField(
            model_name="ordergood",
            name="nw_kg",
        ),
        migrations.RemoveField(
            model_name="ordergood",
            name="gw_kg",
        ),
    ]
