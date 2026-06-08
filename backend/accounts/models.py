from django.contrib.auth.models import AbstractUser
from django.db import models
import secrets


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        STAFF = "staff", "Staff"
        USER = "user", "User"

    username = models.CharField(max_length=150, unique=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)

    @classmethod
    def generate_username(cls) -> str:
        while True:
            candidate = f"user_{secrets.token_hex(4)}"
            if not cls.objects.filter(username=candidate).exists():
                return candidate

    def __str__(self):
        return self.username
