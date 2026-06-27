from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0026_moderation_notifications"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="notification_type",
            field=models.CharField(
                choices=[
                    ("submitted", "Submitted"),
                    ("approved", "Approved"),
                    ("rejected", "Rejected"),
                ],
                max_length=20,
            ),
        ),
    ]
