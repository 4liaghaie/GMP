from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User

from .models import Notification, SupportConversation, SupportMessage


class SupportChatAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="U10001",
            email="user1@example.com",
            password="test-password",
            account_status=User.AccountStatus.VERIFIED,
        )
        self.other_user = User.objects.create_user(
            username="U10002",
            email="user2@example.com",
            password="test-password",
            account_status=User.AccountStatus.VERIFIED,
        )
        self.admin = User.objects.create_user(
            username="U99999",
            email="admin@example.com",
            password="test-password",
            role=User.Role.ADMIN,
            account_status=User.AccountStatus.VERIFIED,
        )

    def test_users_only_see_their_own_support_messages(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/support-chat/messages/",
            {
                "body": "برای این ثبت سفارش راهنمایی می‌خواهم.",
                "related_model": SupportMessage.RELATED_ORDER,
                "related_uuid": "U10002-S1001",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(self.other_user)
        response = self.client.get("/api/support-chat/messages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
        self.assertEqual(
            SupportConversation.objects.get(user=self.user).messages.count(),
            1,
        )

    def test_normal_user_cannot_access_admin_chat_routes(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/admin/support-chat/conversations/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client.get(
            f"/api/admin/support-chat/conversations/{self.other_user.pk}/messages/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_reply_and_user_receives_notification(self):
        conversation = SupportConversation.objects.create(user=self.user)
        SupportMessage.objects.create(
            conversation=conversation,
            sender=self.user,
            body="سلام",
        )

        self.client.force_authenticate(self.admin)
        response = self.client.post(
            f"/api/admin/support-chat/conversations/{self.user.pk}/messages/",
            {"body": "سلام، چطور می‌توانم کمک کنم؟"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(conversation.messages.count(), 2)
        self.assertTrue(
            Notification.objects.filter(
                user=self.user,
                notification_type=Notification.TYPE_MESSAGE,
                related_model="support_chat",
            ).exists()
        )

        self.client.force_authenticate(self.user)
        response = self.client.get("/api/support-chat/messages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[-1]["sender_role"], "admin")
        self.assertIsNotNone(
            SupportMessage.objects.get(sender=self.admin).read_at
        )
