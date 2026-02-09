from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Creates a user with username + password.
    Optionally accepts email/first_name/last_name/phone.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "username",
            "password",
            "password2",
            "email",
            "first_name",
            "last_name",
            "phone",
        )

    def validate_username(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("نام کاربری الزامی است.")
        return value

    def validate(self, attrs):
        pw = attrs.get("password")
        pw2 = attrs.get("password2")
        if pw != pw2:
            raise serializers.ValidationError({"password2": "تکرار رمز عبور با رمز عبور یکسان نیست."})

        # Django password validators (recommended)
        validate_password(pw)

        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)

        # If you want a default role:
        if hasattr(user, "role") and not user.role:
            user.role = getattr(User, "Role", None).USER if hasattr(User, "Role") else "user"

        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """
    Login via username + password.
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "phone", "first_name", "last_name", "email", "role")
        read_only_fields = ("id", "username", "role")


class UpdateProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name  = serializers.CharField(required=False, allow_blank=True)
    email      = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    phone      = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ("first_name", "last_name", "email", "phone")

    def validate_phone(self, value):
        if value is None:
            return None

        value = value.strip()
        if value == "":
            return None

        qs = User.objects.filter(phone=value)

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError("این شماره موبایل قبلاً ثبت شده است.")

        return value

    def validate_email(self, value):
        if value is None:
            return None

        value = value.strip().lower()
        if value == "":
            return None

        qs = User.objects.filter(email=value)

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError("این ایمیل قبلاً ثبت شده است.")

        return value
