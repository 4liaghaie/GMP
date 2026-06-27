import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("marketplace", "0025_ordergood_price_only"),
    ]

    operations = [
        migrations.AddField(
            model_name="registeredorder",
            name="rejected",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name="registeredorder",
            name="rejection_reason",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="goodsneed",
            name="verified",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name="goodsneed",
            name="rejected",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name="goodsneed",
            name="rejection_reason",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("message", models.TextField()),
                (
                    "notification_type",
                    models.CharField(
                        choices=[("approved", "Approved"), ("rejected", "Rejected")],
                        max_length=20,
                    ),
                ),
                ("related_model", models.CharField(blank=True, default="", max_length=50)),
                ("related_uuid", models.CharField(blank=True, default="", max_length=64)),
                ("read", models.BooleanField(db_index=True, default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at", "-id"],
            },
        ),
    ]
