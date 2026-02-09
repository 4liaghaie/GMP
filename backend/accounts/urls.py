from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import RegisterView, LoginView, MeView

urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="register"),
    path("auth/login", LoginView.as_view(), name="login"),

    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("me/", MeView.as_view(), name="me"),
]
