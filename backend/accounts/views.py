from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
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

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "detail": "Registration completed successfully.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "role": getattr(user, "role", "user"),
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
