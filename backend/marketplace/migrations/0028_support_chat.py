from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0027_notification_submitted_type"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
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
                    ("message", "Message"),
                ],
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name="SupportConversation",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True, db_index=True)),
                (
                    "last_message_at",
                    models.DateTimeField(blank=True, db_index=True, null=True),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="support_conversation",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-last_message_at", "-updated_at"],
            },
        ),
        migrations.CreateModel(
            name="SupportMessage",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("body", models.TextField()),
                (
                    "related_model",
                    models.CharField(
                        choices=[
                            ("general", "General"),
                            ("registered_order", "Registered order"),
                            ("proforma", "Proforma"),
                        ],
                        default="general",
                        max_length=32,
                    ),
                ),
                ("related_uuid", models.CharField(blank=True, default="", max_length=64)),
                ("read_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "conversation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages",
                        to="marketplace.supportconversation",
                    ),
                ),
                (
                    "sender",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="support_messages",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["created_at", "id"],
            },
        ),
    ]
