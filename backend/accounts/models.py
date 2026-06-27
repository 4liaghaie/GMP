import random
import re

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    USERNAME_PREFIX = "U"
    USERNAME_MIN = 10001
    USERNAME_MAX = 99999

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        STAFF = "staff", "Staff"
        USER = "user", "User"

    class AccountStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"
        BANNED = "banned", "Banned"

    username = models.CharField(max_length=150, unique=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    account_status = models.CharField(
        max_length=20,
        choices=AccountStatus.choices,
        default=AccountStatus.PENDING,
        db_index=True,
    )
    account_status_note = models.TextField(blank=True, default="")

    @classmethod
    def generate_username(cls) -> str:
        rng = random.SystemRandom()
        while True:
            candidate = f"{cls.USERNAME_PREFIX}{rng.randint(cls.USERNAME_MIN, cls.USERNAME_MAX):05d}"
            if not cls.objects.filter(username=candidate).exists():
                return candidate

    @classmethod
    def username_is_formatted(cls, value: str) -> bool:
        return bool(re.fullmatch(r"U\d{5}", value or ""))

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.generate_username()
        if (self.is_staff or self.is_superuser) and self.account_status == self.AccountStatus.PENDING:
            self.account_status = self.AccountStatus.VERIFIED
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
