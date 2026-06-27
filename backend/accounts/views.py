from django.contrib.auth import authenticate, get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from marketplace.notifications import notify_admins_of_submission

from .premissions import IsAdmin
from .serializers import (
    AdminUserSerializer,
    AdminUserStatusSerializer,
    LoginSerializer,
    MeSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
)

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        notify_admins_of_submission(
            title="درخواست تایید کاربر جدید",
            message=f"کاربر {user.username} با ایمیل {user.email or '-'} و موبایل {user.phone or '-'} ثبت‌نام کرد و منتظر تایید است.",
            related_model="user",
            related_uuid=user.username,
        )

        return Response(
            {
                "detail": "Registration submitted. An admin must verify your account before login.",
                "account_status": getattr(user, "account_status", "pending"),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        email = s.validated_data["email"].strip().lower()
        password = s.validated_data["password"]

        user_obj = User.objects.filter(email__iexact=email).first()
        auth_username = user_obj.username if user_obj else email

        user = authenticate(request, username=auth_username, password=password)
        if not user:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not getattr(user, "is_active", True):
            return Response(
                {"detail": "This account is disabled."},
                status=status.HTTP_403_FORBIDDEN,
            )

        account_status = getattr(user, "account_status", User.AccountStatus.PENDING)
        if account_status == User.AccountStatus.PENDING:
            return Response(
                {"detail": "Your account is pending admin verification."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if account_status == User.AccountStatus.REJECTED:
            return Response(
                {"detail": "Your account request was rejected."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if account_status == User.AccountStatus.BANNED:
            return Response(
                {"detail": "Your account has been banned."},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "role": getattr(user, "role", "user"),
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            MeSerializer(request.user, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            MeSerializer(request.user, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        status_filter = (request.query_params.get("status") or "").strip()
        search = (request.query_params.get("search") or "").strip()

        users = User.objects.order_by("-date_joined", "-id")
        if status_filter:
            users = users.filter(account_status=status_filter)
        if search:
            users = users.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(phone__icontains=search)
            )

        return Response(
            AdminUserSerializer(users, many=True).data,
            status=status.HTTP_200_OK,
        )


class AdminUserStatusView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, user_id: int):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminUserStatusSerializer(
            data=request.data,
            context={"request": request, "user": user},
        )
        serializer.is_valid(raise_exception=True)

        next_status = serializer.validated_data["account_status"]
        user.account_status = next_status
        user.account_status_note = serializer.validated_data.get("note", "")
        user.is_active = next_status != User.AccountStatus.BANNED
        user.save(update_fields=["account_status", "account_status_note", "is_active"])

        return Response(
            AdminUserSerializer(user).data,
            status=status.HTTP_200_OK,
        )
