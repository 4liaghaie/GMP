from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from customs.models import HSCode, Heading, Season

from .models import (
    Notification,
    OrderGood,
    RegisteredOrder,
    SupportConversation,
    SupportMessage,
)


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


class MarketplacePaginationSearchTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="U10101",
            email="seller@example.com",
            password="test-password",
            account_status=User.AccountStatus.VERIFIED,
        )
        self.admin = User.objects.create_user(
            username="U90909",
            email="list-admin@example.com",
            password="test-password",
            role=User.Role.ADMIN,
            account_status=User.AccountStatus.VERIFIED,
        )
        season = Season.objects.create(code="01")
        heading = Heading.objects.create(code="0101", season=season)
        self.target_hs = HSCode.objects.create(
            code="01012100",
            goods_name_fa="اسب",
            goods_name_en="Horse",
            profit="0",
            season=season,
            heading=heading,
        )
        self.other_hs = HSCode.objects.create(
            code="01012900",
            goods_name_fa="سایر",
            goods_name_en="Other",
            profit="0",
            season=season,
            heading=heading,
        )

        for index in range(25):
            order = RegisteredOrder.objects.create(
                uuid=f"U10101-S{index + 1001}",
                user=self.user,
                order_number=f"ORDER-{index}",
                order_pdf="registered_orders/pdfs/test.pdf",
                verified=True,
            )
            OrderGood.objects.create(
                order=order,
                description=f"کالا {index}",
                hs_code=self.target_hs if index == 7 else self.other_hs,
                price=100,
            )

    def test_admin_hs_search_is_backend_filtered_and_paginated(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(
            "/api/admin/registered-orders/",
            {"q": "01012100", "page": 1, "page_size": 10},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(
            response.data["results"][0]["goods"][0]["hs_code"].strip(),
            "01012100",
        )

    def test_marketplace_returns_real_pages(self):
        self.client.force_authenticate(self.user)
        first_page = self.client.get(
            "/api/marketplace/orders/",
            {"page": 1, "page_size": 10},
        )
        second_page = self.client.get(
            "/api/marketplace/orders/",
            {"page": 2, "page_size": 10},
        )
        self.assertEqual(first_page.status_code, status.HTTP_200_OK)
        self.assertEqual(first_page.data["count"], 25)
        self.assertEqual(len(first_page.data["results"]), 10)
        self.assertEqual(len(second_page.data["results"]), 10)
        self.assertNotEqual(
            first_page.data["results"][0]["uuid"],
            second_page.data["results"][0]["uuid"],
        )
