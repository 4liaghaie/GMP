from django.db import migrations


def forwards(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    users = User.objects.order_by("date_joined", "id")

    for user in users.iterator():
        user.username = f"TMP-U{user.pk:05d}"
        user.save(update_fields=["username"])

    users = User.objects.order_by("date_joined", "id")
    next_number = 10001
    for user in users.iterator():
        if next_number > 99999:
            raise RuntimeError("User code range exceeded while migrating usernames.")
        user.username = f"U{next_number:05d}"
        user.save(update_fields=["username"])
        next_number += 1


def backwards(apps, schema_editor):
    # Irreversible because previous random usernames cannot be reconstructed.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_delete_phoneotp_alter_user_email"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
