from django.db import migrations, models


def verify_existing_users(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.all().update(account_status="verified")


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_user_username_code_format"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="account_status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("verified", "Verified"),
                    ("rejected", "Rejected"),
                    ("banned", "Banned"),
                ],
                db_index=True,
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="account_status_note",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.RunPython(verify_existing_users, migrations.RunPython.noop),
    ]
