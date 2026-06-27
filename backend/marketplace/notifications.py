from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import Notification


def notify_admins_of_submission(
    *,
    title: str,
    message: str,
    related_model: str = "",
    related_uuid: str = "",
):
    User = get_user_model()
    admins = User.objects.filter(
        Q(role="admin") | Q(is_staff=True) | Q(is_superuser=True)
    ).distinct()

    notifications = [
        Notification(
            user=admin,
            title=title,
            message=message,
            notification_type=Notification.TYPE_SUBMITTED,
            related_model=related_model,
            related_uuid=related_uuid,
        )
        for admin in admins
    ]
    if notifications:
        Notification.objects.bulk_create(notifications)
