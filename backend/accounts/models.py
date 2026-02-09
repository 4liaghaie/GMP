from django.contrib.auth.models import AbstractUser
from django.db import models
import hashlib
import secrets
from datetime import timedelta
from django.conf import settings
from django.utils import timezone

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        STAFF = "staff", "Staff"
        USER = "user", "User"

    username = models.CharField(max_length=150, unique=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)   # 👈 ADD THIS
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)

    def __str__(self):
        return self.phone or self.username
