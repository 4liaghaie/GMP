from django.db import migrations, models


def forwards(apps, schema_editor):
    RegisteredOrder = apps.get_model("marketplace", "RegisteredOrder")
    GoodsNeed = apps.get_model("marketplace", "GoodsNeed")

    for order in RegisteredOrder.objects.all().iterator():
        order.uuid = f"TMP-S{order.pk}"
        order.save(update_fields=["uuid"])

    order_sequences = {}
    orders = RegisteredOrder.objects.select_related("user").order_by(
        "user_id",
        "created_at",
        "id",
    )
    for order in orders.iterator():
        user_id = order.user_id
        order_sequences[user_id] = order_sequences.get(user_id, 1000) + 1
        order.uuid = f"{order.user.username}-S{order_sequences[user_id]:04d}"
        order.save(update_fields=["uuid"])

    for proforma in GoodsNeed.objects.all().iterator():
        proforma.uuid = f"TMP-B{proforma.pk}"
        proforma.save(update_fields=["uuid"])

    proforma_sequences = {}
    proformas = GoodsNeed.objects.select_related("user").order_by(
        "user_id",
        "created_at",
        "id",
    )
    for proforma in proformas.iterator():
        user_id = proforma.user_id
        proforma_sequences[user_id] = proforma_sequences.get(user_id, 1000) + 1
        proforma.uuid = f"{proforma.user.username}-B{proforma_sequences[user_id]:04d}"
        proforma.save(update_fields=["uuid"])


def backwards(apps, schema_editor):
    # Irreversible because old UUID values are replaced by business identifiers.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_user_username_code_format"),
        ("marketplace", "0019_registeredorder_national_code_optional"),
    ]

    operations = [
        migrations.AlterField(
            model_name="registeredorder",
            name="uuid",
            field=models.CharField(blank=True, db_index=True, editable=False, max_length=32, unique=True),
        ),
        migrations.AlterField(
            model_name="goodsneed",
            name="uuid",
            field=models.CharField(blank=True, db_index=True, editable=False, max_length=32, unique=True),
        ),
        migrations.RunPython(forwards, backwards),
    ]
